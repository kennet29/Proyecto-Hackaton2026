import { useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_URL } from '../config/api';
import { isExpoGoAndroid, loadNotifications } from '../utils/notificationsRuntime';

const STORAGE_KEY = '@gs_push_token';
const STORAGE_SYNC_KEY = '@gs_push_token_synced';
const DEFAULT_CHANNEL_ID = 'default';

const getProjectId = (): string | undefined => {
  const easProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const easConfigId = (Constants as any).easConfig?.projectId as string | undefined;
  return easProjectId ?? easConfigId;
};

const getPushRegistrationBlocker = (): string | null => {
  if (Platform.OS === 'web') return 'Las notificaciones push remotas estan disponibles solo en la app movil.';
  if (isExpoGoAndroid()) return 'Las notificaciones push remotas no funcionan en Expo Go para Android. Usa un development build.';
  if (!getProjectId()) return 'Falta configurar extra.eas.projectId en app.json para obtener el Expo push token.';
  return null;
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  const Notifications = await loadNotifications();
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#071120', sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const syncTokenWithBackend = async (expoPushToken: string, authToken?: string | null) => {
  if (!authToken || await AsyncStorage.getItem(STORAGE_SYNC_KEY) === expoPushToken) return;
  try {
    const response = await fetch(`${API_URL}/notifications/device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    });
    if (!response.ok) throw new Error(`No se pudo sincronizar el dispositivo (HTTP ${response.status}).`);
    await AsyncStorage.setItem(STORAGE_SYNC_KEY, expoPushToken);
  } catch (error) {
    console.log('[notifications] no se pudo sincronizar el token', error);
  }
};

const registerForPushNotificationsAsync = async (): Promise<{ token: string | null; error: string | null }> => {
  if (!Device.isDevice) return { token: null, error: 'Las notificaciones push requieren ejecutarse en un dispositivo fisico.' };
  const blocker = getPushRegistrationBlocker();
  if (blocker) return { token: null, error: blocker };
  const Notifications = await loadNotifications();
  let { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') existingStatus = (await Notifications.requestPermissionsAsync()).status;
  if (existingStatus !== 'granted') return { token: null, error: 'No se otorgaron permisos de notificaciones.' };
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: getProjectId()! });
  return { token: data, error: null };
};

export const usePushNotifications = (authToken?: string | null, userId?: number | null) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGoAndroid()) {
      setRegistrationError(getPushRegistrationBlocker());
      return;
    }
    let mounted = true;
    const setup = async () => {
      try {
        await ensureAndroidChannel();
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedToken) setExpoPushToken(storedToken);
        const { token, error } = await registerForPushNotificationsAsync();
        if (error) { if (mounted) setRegistrationError(error); return; }
        if (!token || !mounted) return;
        setRegistrationError(null);
        setExpoPushToken(token);
        await AsyncStorage.setItem(STORAGE_KEY, token);
        await syncTokenWithBackend(token, authToken);
      } catch (error) {
        console.warn('[notifications] error registrando push token', error);
        if (mounted) setRegistrationError((error as Error).message);
      }
    };
    setup();
    return () => { mounted = false; };
  }, [authToken, userId]);

  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGoAndroid()) return;
    let active = true;
    const setup = async () => {
      const Notifications = await loadNotifications();
      if (!active) return;
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => console.log('[notifications] recibida en foreground', notification));
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => console.log('[notifications] respuesta del usuario', response));
    };
    setup().catch((error) => console.warn('[notifications] no se pudieron iniciar listeners', error));
    return () => {
      active = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, registrationError };
};
