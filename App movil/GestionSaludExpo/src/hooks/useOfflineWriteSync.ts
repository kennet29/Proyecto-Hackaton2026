import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  flushOfflineWriteQueue,
  getOfflineWriteQueueSummary,
  retryFailedOfflineWrites,
  subscribeOfflineWriteQueue,
} from '../utils/offlineWriteQueue';

export type OfflineSyncState = {
  isConnected: boolean | null;
  isSyncing: boolean;
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
  retry: () => Promise<void>;
};

export function useOfflineWriteSync(
  token?: string | null,
  ownerUserId?: number | null,
): OfflineSyncState {
  const syncingRef = useRef(false);
  const connectedRef = useRef<boolean | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refreshSummary = useCallback(async () => {
    if (!ownerUserId) {
      setPending(0);
      setFailed(0);
      return;
    }
    const summary = await getOfflineWriteQueueSummary(ownerUserId);
    setPending(summary.pending);
    setFailed(summary.failed);
  }, [ownerUserId]);

  const runSync = useCallback(async () => {
    if (!token || !ownerUserId || syncingRef.current || connectedRef.current === false) {
      await refreshSummary();
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await flushOfflineWriteQueue(token);
      setPending(result.pending);
      setFailed(result.failed);
      if (result.synced > 0) {
        setLastSyncedAt(new Date().toISOString());
      }
    } catch (error) {
      console.warn('[offline-queue] no se pudo sincronizar la cola', error);
      await refreshSummary();
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [ownerUserId, refreshSummary, token]);

  const retry = useCallback(async () => {
    if (!ownerUserId) {
      return;
    }
    await retryFailedOfflineWrites(ownerUserId);
    await runSync();
  }, [ownerUserId, runSync]);

  useEffect(() => {
    void refreshSummary();
    const unsubscribe = subscribeOfflineWriteQueue(() => {
      void refreshSummary();
    });
    return unsubscribe;
  }, [refreshSummary]);

  useEffect(() => {
    if (!token || !ownerUserId) {
      return;
    }

    const updateNetworkState = (state: Network.NetworkState) => {
      const online =
        state.isConnected !== false && state.isInternetReachable !== false;
      const wasConnected = connectedRef.current;
      connectedRef.current = online;
      setIsConnected(online);
      if (online && wasConnected !== true) {
        void runSync();
      }
    };

    void Network.getNetworkStateAsync().then(updateNetworkState);
    const networkSubscription =
      Network.addNetworkStateListener(updateNetworkState);
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void Network.getNetworkStateAsync().then(updateNetworkState);
      }
    });
    const fallbackInterval = setInterval(() => {
      void runSync();
    }, 2 * 60 * 1000);

    return () => {
      networkSubscription.remove();
      appSubscription.remove();
      clearInterval(fallbackInterval);
    };
  }, [ownerUserId, runSync, token]);

  return {
    isConnected,
    isSyncing,
    pending,
    failed,
    lastSyncedAt,
    retry,
  };
}
