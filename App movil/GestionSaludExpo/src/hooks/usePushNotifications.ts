import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_URL } from '../config/api';

const STORAGE_KEY = '@gs_push_token';
const STORAGE_SYNC_KEY = '@gs_push_token_synced';
const DEFAULT_CHANNEL_ID = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined => {
  const easProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const easConfigId = (Constants as any).easConfig?.projectId as string | undefined;
  return easProjectId ?? easConfigId;
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0f172a',
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const syncTokenWithBackend = async (expoPushToken: string, authToken?: string | null, userId?: number | null) => {
  if (!authToken) {
    return;
  }
  const lastSynced = await AsyncStorage.getItem(STORAGE_SYNC_KEY);
  if (lastSynced === expoPushToken) {
    return;
  }

  try {
    const body = {
      expoPushToken,
      platform: Platform.OS,
      userId,
    };
    await fetch(`${API_URL}/notifications/device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });
    await AsyncStorage.setItem(STORAGE_SYNC_KEY, expoPushToken);
  } catch (error) {
    console.log('[notifications] no se pudo sincronizar el token', error);
  }
};

const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Las notificaciones push requieren ejecutarse en un dispositivo físico');
    return null;
  }

  let { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const permissionResponse = await Notifications.requestPermissionsAsync();
    existingStatus = permissionResponse.status;
  }

  if (existingStatus !== 'granted') {
    console.warn('No se otorgaron permisos de notificaciones');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('Agrega el projectId de EAS para obtener tokens push');
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

export const usePushNotifications = (authToken?: string | null, userId?: number | null) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        await ensureAndroidChannel();
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedToken) {
          setExpoPushToken(storedToken);
        }
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          setRegistrationError('Sin permisos para notificaciones');
          return;
        }
        if (!mounted) {
          return;
        }
        setExpoPushToken(token);
        await AsyncStorage.setItem(STORAGE_KEY, token);
        await syncTokenWithBackend(token, authToken, userId);
      } catch (error) {
        console.warn('[notifications] error registrando push token', error);
        setRegistrationError((error as Error).message);
      }
    };

    setup();

    return () => {
      mounted = false;
    };
  }, [authToken, userId]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[notifications] recibida en foreground', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[notifications] respuesta del usuario', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, registrationError };
};



