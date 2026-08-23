/**
 * @file App movil/GestionSaludExpo/src/utils/localReminderScheduler.ts
 * @description TypeScript module implementation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = '@gs_local_reminder_schedules_v1';
const CHANNEL_ID = 'recordatorios-locales';

type StoredSchedule = {
  ownerUserId: number;
  logicalKey: string;
  notificationId: string;
  scheduledAt: string;
};

export type LocalReminderStatus =
  | 'scheduled'
  | 'cancelled'
  | 'not-applicable'
  | 'unsupported'
  | 'permission-denied'
  | 'invalid-date'
  | 'failed';

type SyncLocalReminderInput = {
  ownerUserId: number;
  operationId: string;
  path: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  responseData?: unknown;
};

const readSchedules = async (): Promise<StoredSchedule[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSchedules = (items: StoredSchedule[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));

const ensurePermissions = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios sin conexión',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const extractResponseId = (kind: string, responseData: unknown) => {
  if (!responseData || typeof responseData !== 'object') return null;
  const data = responseData as Record<string, unknown>;
  const raw =
    kind === 'notificacion'
      ? data.notificacionId ?? data.notificacionid ?? data.id
      : data.recordatoriocitaId ?? data.recordatoriocitaid ?? data.id;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const cancelLogicalSchedule = async (
  ownerUserId: number,
  logicalKey: string,
): Promise<boolean> => {
  const schedules = await readSchedules();
  const matches = schedules.filter(
    (item) => item.ownerUserId === ownerUserId && item.logicalKey === logicalKey,
  );
  await Promise.all(
    matches.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(() => undefined),
    ),
  );
  if (matches.length) {
    await writeSchedules(
      schedules.filter(
        (item) => item.ownerUserId !== ownerUserId || item.logicalKey !== logicalKey,
      ),
    );
  }
  return matches.length > 0;
};

export async function syncLocalReminder(
  input: SyncLocalReminderInput,
): Promise<LocalReminderStatus> {
  const match = input.path.match(/^\/(notificacion|recordatoriocita)(?:\/(\d+))?$/);
  if (!match) return 'not-applicable';
  if (Platform.OS === 'web') return 'unsupported';

  const kind = match[1];
  const pathId = match[2] ? Number(match[2]) : null;
  const responseId = extractResponseId(kind, input.responseData);
  const logicalKey = `${kind}:${pathId ?? responseId ?? input.operationId}`;
  const operationKey = `${kind}:${input.operationId}`;
  const scheduledValue =
    input.body?.fechaprogramada ?? input.body?.fecharecordatorio;
  const message =
    typeof input.body?.mensaje === 'string' ? input.body.mensaje.trim() : '';
  const isCompleted =
    input.method === 'DELETE' ||
    input.body?.estado === 'realizada' ||
    input.body?.enviada === true ||
    input.body?.campoprueba05 === 'realizada';

  try {
    // Cuando una creación en cola obtiene su ID del servidor, sustituye la
    // clave temporal sin dejar dos avisos locales programados.
    if (responseId && logicalKey !== operationKey) {
      await cancelLogicalSchedule(input.ownerUserId, operationKey);
    }

    if (isCompleted || !scheduledValue) {
      const cancelled = await cancelLogicalSchedule(input.ownerUserId, logicalKey);
      return cancelled ? 'cancelled' : 'not-applicable';
    }

    const scheduledAt = new Date(String(scheduledValue));
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      return 'invalid-date';
    }
    if (!message) return 'not-applicable';
    if (!(await ensurePermissions())) return 'permission-denied';

    await ensureAndroidChannel();
    await cancelLogicalSchedule(input.ownerUserId, logicalKey);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de salud',
        body: message,
        sound: 'default',
        data: {
          ownerUserId: input.ownerUserId,
          reminderKey: logicalKey,
          source: 'local-offline',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledAt,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });

    const schedules = await readSchedules();
    schedules.push({
      ownerUserId: input.ownerUserId,
      logicalKey,
      notificationId,
      scheduledAt: scheduledAt.toISOString(),
    });
    await writeSchedules(schedules);
    return 'scheduled';
  } catch (error) {
    console.warn('[local-reminder] no se pudo programar el aviso local', error);
    return 'failed';
  }
}
