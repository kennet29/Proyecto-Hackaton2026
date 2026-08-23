/**
 * @file App movil/GestionSaludExpo/src/components/AltchaWidget.web.tsx
 * @description TypeScript module implementation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';

type AltchaWidgetProps = { onPayload: (payload: string) => void; resetKey?: number };
const SCRIPT_ID = 'altcha-widget-script';

export function AltchaWidget({ onPayload, resetKey = 0 }: AltchaWidgetProps) {
  const containerRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let widget: any;
    const render = () => {
      if (!active || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      widget = document.createElement('altcha-widget');
      widget.setAttribute('challenge', `${API_URL}/auth/altcha-challenge`);
      widget.setAttribute('type', 'checkbox');
      widget.setAttribute('language', 'es');
      widget.setAttribute('hidefooter', '');
      widget.style.width = '100%';
      widget.style.setProperty('--altcha-max-width', '100%');
      widget.addEventListener('verified', (event: any) => {
        onPayload(event.detail.payload);
        setStatus('verified');
      });
      widget.addEventListener('expired', () => {
        onPayload('');
        setStatus('ready');
      });
      widget.addEventListener('statechange', (event: any) => {
        if (event.detail.state === 'error') setStatus('error');
      });
      containerRef.current.appendChild(widget);
      setStatus('ready');
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (customElements.get('altcha-widget')) render();
    else if (existing) existing.addEventListener('load', render, { once: true });
    else {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `${API_URL}/auth/altcha.js`;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        if (active) setStatus('error');
      }, { once: true });
      document.head.appendChild(script);
    }
    return () => { active = false; if (widget) widget.remove(); };
  }, [onPayload, resetKey, retryKey]);

  return <AltchaFrame status={status} onRetry={() => { setStatus('loading'); setRetryKey((current) => current + 1); }}><div ref={containerRef} style={{ width: '100%' }} /></AltchaFrame>;
}

function AltchaFrame({ status, children, onRetry }: { status: string; children: React.ReactNode; onRetry: () => void }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Ionicons name="shield-checkmark-outline" size={19} color={appColors.success} />
          <View><AppText style={styles.title}>Verificación privada</AppText><AppText style={styles.subtitle}>Protección ALTCHA sin rastreo</AppText></View>
        </View>
        {status === 'verified' ? <View style={styles.badge}><Ionicons name="checkmark-circle" size={15} color={appColors.success} /><AppText style={styles.badgeText}>Verificado</AppText></View> : null}
      </View>
      <View style={styles.area}>{children}{status === 'loading' ? <ActivityIndicator color={appColors.info} /> : null}</View>
      {status === 'error' ? <View style={styles.errorRow}><AppText style={styles.error}>La API de verificación no está disponible.</AppText><TouchableOpacity onPress={onRetry} style={styles.retryButton}><Ionicons name="refresh" size={15} color={appColors.info} /><AppText style={styles.retryText}>Reintentar</AppText></TouchableOpacity></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colorAlpha(appColors.success, '44'), backgroundColor: colorAlpha(appColors.success, '0A'), gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: appColors.text, fontSize: 14, fontWeight: '800' }, subtitle: { color: appColors.textMuted, fontSize: 11, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: colorAlpha(appColors.success, '16') },
  badgeText: { color: appColors.success, fontSize: 11, fontWeight: '800' }, area: { minHeight: 65, justifyContent: 'center' },
  error: { color: appColors.accent, fontSize: 12, lineHeight: 18 },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: colorAlpha(appColors.info, '12') },
  retryText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
});
