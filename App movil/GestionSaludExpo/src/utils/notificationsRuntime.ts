import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type NotificationsModule = typeof import('expo-notifications');

export const isExpoGoAndroid = () =>
  Platform.OS === 'android' &&
  (Constants.executionEnvironment === 'storeClient' ||
    (Constants as { appOwnership?: string }).appOwnership === 'expo');

let notificationHandlerConfigured = false;

export const loadNotifications = async (): Promise<NotificationsModule> => {
  const notifications = await import('expo-notifications');
  if (!notificationHandlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }
  return notifications;
};
