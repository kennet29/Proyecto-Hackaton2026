/**
 * @file App movil/GestionSaludExpo/src/components/OfflineStatusBanner.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';
import { OfflineSyncState } from '../hooks/useOfflineWriteSync';
import { appColors } from '../theme/colors';

type Props = {
  state: OfflineSyncState;
};

export const OfflineStatusBanner: React.FC<Props> = ({ state }) => {
  const hasWork = state.pending > 0 || state.failed > 0;
  if (state.isConnected !== false && !state.isSyncing && !hasWork) {
    return null;
  }

  const message = state.isConnected === false
    ? `Sin conexion${state.pending ? ` · ${state.pending} cambio(s) pendiente(s)` : ''}`
    : state.isSyncing
      ? `Sincronizando ${state.pending || ''}`.trim()
      : state.failed
        ? `${state.failed} cambio(s) necesita(n) revision`
        : `${state.pending} cambio(s) pendiente(s)`;

  const tone = state.failed
    ? styles.failed
    : state.isConnected === false
      ? styles.offline
      : styles.syncing;

  return (
    <View accessibilityRole="alert" style={[styles.container, tone]}>
      <AppText style={styles.text}>{message}</AppText>
      {state.isConnected !== false && !state.isSyncing && hasWork ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void state.retry()}
          style={styles.retryButton}
        >
          <AppText style={styles.retryText}>Reintentar</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  offline: {
    backgroundColor: '#7C4A03',
  },
  syncing: {
    backgroundColor: appColors.border,
  },
  failed: {
    backgroundColor: '#8A2138',
  },
  text: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: appColors.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryText: {
    color: appColors.text,
    fontSize: 12,
    fontWeight: '800',
  },
});
