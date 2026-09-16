import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { useAppColors } from '../theme/useAppColors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminServerLogs'>;
type LogLevel = 'info' | 'warn' | 'error';
type LogEntry = { id: number; timestamp: string; level: LogLevel; message: string };
type LogResponse = { entries?: LogEntry[]; retainedEntries?: number };

const levelMeta: Record<LogLevel, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { label: 'INFO', color: '#0B6FEA', icon: 'information-circle-outline' },
  warn: { label: 'AVISO', color: '#B45309', icon: 'warning-outline' },
  error: { label: 'ERROR', color: '#DC2626', icon: 'alert-circle-outline' },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'medium' });
};

export function AdminServerLogsScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const colors = useAppColors();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [retainedEntries, setRetainedEntries] = useState(500);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = ['admin', 'superadmin'].includes(user?.role?.trim().toLowerCase() ?? '');

  const load = useCallback(async (isRefresh = false) => {
    if (!token || !isAdmin) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      setError(null);
      const response = await apiFetch('/server-logs?limit=200', { headers: buildJsonHeaders(token) });
      const data = await parseJsonResponse<LogResponse>(response);
      if (!response.ok || !data?.entries) throw new Error('No se pudieron cargar los registros del servidor.');
      setEntries(data.entries);
      setRetainedEntries(data.retainedEntries ?? 500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los registros del servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!isAdmin) return <View style={styles.center}><Ionicons name="lock-closed-outline" size={38} color={colors.textMuted} /><AppText style={styles.accessTitle}>Acceso restringido</AppText><AppText style={styles.muted}>Esta vista solo esta disponible para administradores.</AppText></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.info} /><AppText style={styles.muted}>Cargando registros...</AppText></View>;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.info} />}>
    <View style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="terminal-outline" size={26} color="#FFFFFF" /></View>
      <View style={{ flex: 1 }}><AppText style={styles.title}>Registros del servidor</AppText><AppText style={styles.subtitle}>Solicitudes y errores recientes de esta instancia.</AppText></View>
    </View>
    <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={19} color={colors.info} /><AppText style={styles.noticeText}>Solo se muestran registros sanitizados. Se conservan hasta {retainedEntries} eventos en memoria y se reinician al reiniciar el servidor.</AppText></View>
    <TouchableOpacity style={styles.refreshButton} onPress={() => void load(true)} disabled={refreshing} accessibilityRole="button" accessibilityLabel="Actualizar registros">
      {refreshing ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="refresh-outline" size={18} color="#FFFFFF" /><AppText style={styles.refreshText}>Actualizar</AppText></>}
    </TouchableOpacity>
    {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={21} color="#DC2626" /><AppText style={styles.errorText}>{error}</AppText></View> : null}
    {entries.length ? entries.map((entry) => {
      const meta = levelMeta[entry.level] ?? levelMeta.info;
      return <View key={entry.id} style={[styles.logCard, { borderLeftColor: meta.color }]}><View style={styles.logHeader}><View style={[styles.badge, { backgroundColor: `${meta.color}22` }]}><Ionicons name={meta.icon} size={15} color={meta.color} /><AppText style={[styles.badgeText, { color: meta.color }]}>{meta.label}</AppText></View><AppText style={styles.time}>{formatDate(entry.timestamp)}</AppText></View><AppText selectable style={styles.message}>{entry.message}</AppText></View>;
    }) : <View style={styles.empty}><Ionicons name="document-text-outline" size={34} color={colors.textMuted} /><AppText style={styles.emptyTitle}>No hay registros aún</AppText><AppText style={styles.muted}>Actualiza la vista después de usar la aplicación.</AppText></View>}
    <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={17} color="#FFFFFF" /><AppText style={styles.backText}>Volver a gestión</AppText></TouchableOpacity>
  </ScrollView>;
}

const createStyles = (colors: ReturnType<typeof useAppColors>) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background }, container: { flexGrow: 1, padding: 20, gap: 14, backgroundColor: colors.background }, center: { flex: 1, padding: 24, gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, hero: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 20, borderRadius: 18, backgroundColor: '#0B6FEA', borderWidth: 1, borderColor: '#57A6FA' }, heroIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF2E' }, title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, subtitle: { color: '#EAF3FF', fontSize: 13, marginTop: 3 }, notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 13, backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.border }, noticeText: { flex: 1, color: colors.textSoft, fontSize: 12, lineHeight: 18 }, refreshButton: { alignSelf: 'flex-end', minHeight: 42, paddingHorizontal: 16, gap: 7, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: colors.info }, refreshText: { color: '#FFFFFF', fontWeight: '900' }, logCard: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 5, backgroundColor: colors.surface }, logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }, badgeText: { fontSize: 10, fontWeight: '900' }, time: { flex: 1, textAlign: 'right', color: colors.textMuted, fontSize: 11 }, message: { color: colors.text, fontSize: 13, lineHeight: 19, fontFamily: 'monospace' }, error: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 12, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }, errorText: { flex: 1, color: '#991B1B', fontWeight: '700' }, empty: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 22, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, accessTitle: { color: colors.text, fontSize: 20, fontWeight: '900' }, muted: { color: colors.textMuted, fontSize: 13, textAlign: 'center' }, back: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, backgroundColor: colors.info }, backText: { color: '#FFFFFF', fontWeight: '900' },
});
