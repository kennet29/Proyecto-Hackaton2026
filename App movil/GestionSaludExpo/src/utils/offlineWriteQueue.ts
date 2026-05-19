import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, buildJsonHeaders, type ApiMethod, parseJsonResponse } from './apiClient';

const OFFLINE_WRITE_QUEUE_KEY = '@gs_offline_write_queue';

type OfflineWriteMethod = Exclude<ApiMethod, 'GET'>;

export type OfflineWriteQueueItem = {
  id: string;
  path: string;
  method: OfflineWriteMethod;
  body?: Record<string, unknown>;
  description: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
  lastAttemptAt?: string;
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

type FlushOfflineWriteResult = {
  synced: number;
  failed: number;
  pending: number;
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

const generateQueueId = (): string =>
  `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function readOfflineWriteQueue(): Promise<OfflineWriteQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_WRITE_QUEUE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineWriteQueueItem[]) : [];
  } catch (error) {
    console.warn('[offline-queue] no se pudo leer la cola local', error);
    return [];
  }
}

async function writeOfflineWriteQueue(queue: OfflineWriteQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_WRITE_QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineWriteQueueCount(): Promise<number> {
  const queue = await readOfflineWriteQueue();
  return queue.length;
}

export async function enqueueOfflineWrite(
  input: SubmitOfflineWriteInput,
): Promise<OfflineWriteQueueItem> {
  const queue = await readOfflineWriteQueue();
  const item: OfflineWriteQueueItem = {
    id: generateQueueId(),
    path: input.path,
    method: input.method,
    body: input.body,
    description: input.description,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  queue.push(item);
  await writeOfflineWriteQueue(queue);
  return item;
}

export async function submitJsonWithOfflineFallback<T = unknown>(
  input: SubmitOfflineWriteInput,
): Promise<SubmitOfflineWriteResult<T>> {
  try {
    const response = await apiFetch(input.path, {
      method: input.method,
      headers: buildJsonHeaders(input.token),
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

    const queued = await enqueueOfflineWrite(input);
    return { status: 'queued', item: queued };
  }
}

export async function flushOfflineWriteQueue(
  token?: string | null,
): Promise<FlushOfflineWriteResult> {
  const queue = await readOfflineWriteQueue();
  if (!queue.length) {
    return { synced: 0, failed: 0, pending: 0 };
  }

  const pending: OfflineWriteQueueItem[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await apiFetch(item.path, {
        method: item.method,
        headers: buildJsonHeaders(token),
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        synced += 1;
        continue;
      }

      const payload = await parseJsonResponse<{ message?: string }>(response);
      const clientError = response.status >= 400 && response.status < 500;

      pending.push({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError:
          payload?.message ??
          `Error HTTP ${response.status} al sincronizar ${item.description}`,
      });
      failed += 1;

      if (response.status === 401 || response.status === 403 || clientError) {
        pending.push(...queue.slice(queue.indexOf(item) + 1));
        break;
      }
    } catch (error) {
      pending.push({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError:
          error instanceof Error ? error.message : 'No se pudo sincronizar la escritura pendiente',
      });
      failed += 1;
      pending.push(...queue.slice(queue.indexOf(item) + 1));
      break;
    }
  }

  await writeOfflineWriteQueue(pending);
  return {
    synced,
    failed,
    pending: pending.length,
  };
}
