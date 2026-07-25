import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';

type Props = { onPayload: (payload: string) => void; resetKey?: number };
type Message = { type?: 'verified' | 'expired' | 'error' | 'ready'; payload?: string };

export function AltchaWidget({ onPayload, resetKey = 0 }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as Message;
      if (message.type === 'verified' && message.payload) { onPayload(message.payload); setStatus('verified'); }
      else if (message.type === 'expired') { onPayload(''); setStatus('ready'); }
      else if (message.type === 'error') { onPayload(''); setStatus('error'); }
      else if (message.type === 'ready') setStatus('ready');
    } catch { onPayload(''); setStatus('error'); }
  };
  return (
    <View style={styles.wrapper}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}><Ionicons name="shield-checkmark-outline" size={19} color={appColors.success} /><View><AppText style={styles.title}>Verificación privada</AppText><AppText style={styles.subtitle}>Protección ALTCHA sin rastreo</AppText></View></View>
        {status === 'verified' ? <View style={styles.badge}><Ionicons name="checkmark-circle" size={15} color={appColors.success} /><AppText style={styles.badgeText}>Verificado</AppText></View> : null}
      </View>
      <View style={styles.area}>
        <WebView key={`${resetKey}-${retryKey}`} source={{ uri: `${API_URL}/auth/altcha-widget` }} onMessage={handleMessage} onLoadStart={() => setStatus('loading')} onError={() => setStatus('error')} javaScriptEnabled domStorageEnabled originWhitelist={['https://*', 'http://*', 'blob:*']} setSupportMultipleWindows={false} style={styles.webView} containerStyle={styles.webViewContainer} scrollEnabled={false} overScrollMode="never" />
        {status === 'loading' ? <View style={styles.loading}><ActivityIndicator color={appColors.info} /><AppText style={styles.loadingText}>Preparando verificación…</AppText></View> : null}
      </View>
      {status === 'error' ? <View style={styles.errorRow}><AppText style={styles.error}>La API de verificación no está disponible.</AppText><TouchableOpacity onPress={() => { setStatus('loading'); setRetryKey((current) => current + 1); }} style={styles.retryButton}><Ionicons name="refresh" size={15} color={appColors.info} /><AppText style={styles.retryText}>Reintentar</AppText></TouchableOpacity></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colorAlpha(appColors.success, '44'), backgroundColor: colorAlpha(appColors.success, '0A'), gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, headingCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: appColors.text, fontSize: 14, fontWeight: '800' }, subtitle: { color: appColors.textMuted, fontSize: 11, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: colorAlpha(appColors.success, '16') }, badgeText: { color: appColors.success, fontSize: 11, fontWeight: '800' },
  area: { height: 84, borderRadius: 10, overflow: 'hidden', position: 'relative' }, webViewContainer: { backgroundColor: 'transparent' }, webView: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: appColors.surface }, loadingText: { color: appColors.textMuted, fontSize: 12 }, error: { color: appColors.accent, fontSize: 12, lineHeight: 18 },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, retryButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: colorAlpha(appColors.info, '12') }, retryText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
});
