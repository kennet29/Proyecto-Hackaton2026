import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, buildJsonHeaders, type ApiMethod, parseJsonResponse } from './apiClient';
import { getTokenUserId } from './jwt';

const OFFLINE_WRITE_QUEUE_KEY = '@gs_offline_write_queue_v2';
const MAX_RETRY_DELAY_MS = 15 * 60 * 1000;
const queueListeners = new Set<() => void>();
let queueLock: Promise<void> = Promise.resolve();

type OfflineWriteMethod = Exclude<ApiMethod, 'GET'>;
export type OfflineWriteStatus = 'pending' | 'failed';

export type OfflineWriteQueueItem = {
  id: string;
  operationId: string;
  ownerUserId: number;
  pacienteId?: number;
  path: string;
  method: OfflineWriteMethod;
  body?: Record<string, unknown>;
  description: string;
  createdAt: string;
  status: OfflineWriteStatus;
  attempts: number;
  lastError?: string;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
};

type SubmitOfflineWriteInput = {
  token?: string | null;
  path: string;
  method: OfflineWriteMethod;
  body?: Record<string, unknown>;
  description: string;
};

type SubmitOfflineWriteResult<T> =
  | { status: 'online'; data: T | null }
  | { status: 'queued'; item: OfflineWriteQueueItem };

export type OfflineWriteQueueSummary = {
  pending: number;
  failed: number;
};

export type FlushOfflineWriteResult = OfflineWriteQueueSummary & {
  synced: number;
};

const emitQueueChange = () => {
  queueListeners.forEach((listener) => listener());
};

const withQueueLock = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = queueLock.then(operation, operation);
  queueLock = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const subscribeOfflineWriteQueue = (listener: () => void) => {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
};

const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('networkerror') ||
    message.includes('fetch failed') ||
    message.includes('load failed') ||
    message.includes('internet')
  );
};

const generateOperationId = (): string =>
  `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const resolvePacienteId = (
  body: Record<string, unknown> | undefined,
): number | undefined => {
  const raw = body?.pacienteId ?? body?.pacienteid;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const buildOfflineHeaders = (
  token: string | null | undefined,
  operationId: string,
) => ({
  ...buildJsonHeaders(token),
  'Idempotency-Key': operationId,
});

export async function readOfflineWriteQueue(): Promise<OfflineWriteQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_WRITE_QUEUE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is OfflineWriteQueueItem =>
        item &&
        typeof item === 'object' &&
        Number.isSafeInteger(item.ownerUserId) &&
        item.ownerUserId > 0 &&
        typeof item.operationId === 'string',
    );
  } catch (error) {
    console.warn('[offline-queue] no se pudo leer la cola local', error);
    return [];
  }
}

async function writeOfflineWriteQueue(
  queue: OfflineWriteQueueItem[],
): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_WRITE_QUEUE_KEY, JSON.stringify(queue));
  emitQueueChange();
}

export async function getOfflineWriteQueueSummary(
  ownerUserId: number,
): Promise<OfflineWriteQueueSummary> {
  const queue = (await readOfflineWriteQueue()).filter(
    (item) => item.ownerUserId === ownerUserId,
  );
  return {
    pending: queue.filter((item) => item.status === 'pending').length,
    failed: queue.filter((item) => item.status === 'failed').length,
  };
}

async function enqueuePreparedOfflineWrite(
  item: OfflineWriteQueueItem,
): Promise<OfflineWriteQueueItem> {
  return withQueueLock(async () => {
    const queue = await readOfflineWriteQueue();
    if (!queue.some((current) => current.operationId === item.operationId)) {
      queue.push(item);
      await writeOfflineWriteQueue(queue);
    }
    return item;
  });
}

export async function submitJsonWithOfflineFallback<T = unknown>(
  input: SubmitOfflineWriteInput,
): Promise<SubmitOfflineWriteResult<T>> {
  const ownerUserId = getTokenUserId(input.token);
  if (!ownerUserId) {
    throw new Error('La sesion no permite guardar cambios sin conexion.');
  }

  const operationId = generateOperationId();
  const queuedItem: OfflineWriteQueueItem = {
    id: operationId,
    operationId,
    ownerUserId,
    pacienteId: resolvePacienteId(input.body),
    path: input.path,
    method: input.method,
    body: input.body,
    description: input.description,
    createdAt: new Date().toISOString(),
    status: 'pending',
    attempts: 0,
  };

  try {
    const response = await apiFetch(input.path, {
      method: input.method,
      headers: buildOfflineHeaders(input.token, operationId),
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
    const data = await parseJsonResponse<T>(response);

    if (!response.ok) {
      const message =
        (data as { message?: string } | null)?.message ??
        `No se pudo completar la operacion: ${input.description}`;
      throw new Error(message);
    }

    return { status: 'online', data };
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }

    const queued = await enqueuePreparedOfflineWrite(queuedItem);
    return { status: 'queued', item: queued };
  }
}

const retryDelayMs = (attempts: number) =>
  Math.min(15_000 * 2 ** Math.max(attempts - 1, 0), MAX_RETRY_DELAY_MS);

export async function retryFailedOfflineWrites(
  ownerUserId: number,
): Promise<void> {
  return withQueueLock(async () => {
    const queue = await readOfflineWriteQueue();
    const updated = queue.map((item) =>
      item.ownerUserId === ownerUserId && item.status === 'failed'
        ? {
            ...item,
            status: 'pending' as const,
            nextAttemptAt: undefined,
            lastError: undefined,
          }
        : item,
    );
    await writeOfflineWriteQueue(updated);
  });
}

export async function flushOfflineWriteQueue(
  token?: string | null,
): Promise<FlushOfflineWriteResult> {
  return withQueueLock(async () => {
    const ownerUserId = getTokenUserId(token);
    if (!ownerUserId) {
      return { synced: 0, pending: 0, failed: 0 };
    }

    const queue = await readOfflineWriteQueue();
    const untouched = queue.filter((item) => item.ownerUserId !== ownerUserId);
    const ownerQueue = queue.filter((item) => item.ownerUserId === ownerUserId);
    const remaining: OfflineWriteQueueItem[] = [];
    let synced = 0;

    for (let index = 0; index < ownerQueue.length; index += 1) {
      const item = ownerQueue[index];
      if (
        item.status === 'failed' ||
        (item.nextAttemptAt && new Date(item.nextAttemptAt).getTime() > Date.now())
      ) {
        remaining.push(item);
        continue;
      }

      const attempted = {
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
      };

      try {
        const response = await apiFetch(item.path, {
          method: item.method,
          headers: buildOfflineHeaders(token, item.operationId),
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          synced += 1;
          continue;
        }

        const payload = await parseJsonResponse<{ message?: string }>(response);
        const lastError =
          payload?.message ??
          `Error HTTP ${response.status} al sincronizar ${item.description}`;

        if (response.status === 401 || response.status === 403) {
          remaining.push({ ...attempted, lastError });
          remaining.push(...ownerQueue.slice(index + 1));
          break;
        }

        if (response.status >= 400 && response.status < 500) {
          remaining.push({ ...attempted, status: 'failed', lastError });
          continue;
        }

        remaining.push({
          ...attempted,
          lastError,
          nextAttemptAt: new Date(
            Date.now() + retryDelayMs(attempted.attempts),
          ).toISOString(),
        });
      } catch (error) {
        remaining.push({
          ...attempted,
          lastError:
            error instanceof Error
              ? error.message
              : 'No se pudo sincronizar la escritura pendiente',
          nextAttemptAt: new Date(
            Date.now() + retryDelayMs(attempted.attempts),
          ).toISOString(),
        });
        remaining.push(...ownerQueue.slice(index + 1));
        break;
      }
    }

    await writeOfflineWriteQueue([...untouched, ...remaining]);
    return {
      synced,
      pending: remaining.filter((item) => item.status === 'pending').length,
      failed: remaining.filter((item) => item.status === 'failed').length,
    };
  });
}
