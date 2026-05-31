import { AppState } from 'react-native';
import { useEffect } from 'react';
import { flushOfflineWriteQueue } from '../utils/offlineWriteQueue';

export function useOfflineWriteSync(token?: string | null) {
  useEffect(() => {
    if (!token) {
      return;
    }

    let syncing = false;

    const runSync = async () => {
      if (syncing) {
        return;
      }

      syncing = true;
      try {
        await flushOfflineWriteQueue(token);
      } catch (error) {
        console.warn('[offline-queue] no se pudo sincronizar la cola', error);
      } finally {
        syncing = false;
      }
    };

    runSync();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void runSync();
      }
    });

    const intervalId = setInterval(() => {
      void runSync();
    }, 45000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [token]);
}
