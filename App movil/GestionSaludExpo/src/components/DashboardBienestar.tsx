import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from './AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useBackgroundMode } from '../context/BackgroundModeContext';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { getTokenPacienteId } from '../utils/jwt';

type PhysicalSummary = { peso?: { actual: number | null; cambio: number | null }; ejercicio?: { minutosTotales: number | null; pasosPromedio: number | null } };
type MentalStats = { promedioSemanal?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null }; weekly?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null } };
type MentalHistory = { historialPorFecha?: Array<{ hidratacionLitros?: number | null }> };
type Props = { navigation: { navigate: (screen: string) => void } };
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const valueLabel = (value?: number | null, suffix = '') => value == null ? 'Sin datos' : `${value}${suffix}`;
const scoreColor = (score: number) => {
  const start = score <= 50 ? [230, 74, 102] : [245, 185, 66];
  const end = score <= 50 ? [245, 185, 66] : [56, 217, 150];
  const progress = (score <= 50 ? score : score - 50) / 50;
  const channel = (index: number) => Math.round(start[index] + (end[index] - start[index]) * progress)
    .toString(16)
    .padStart(2, '0');

  return `#${channel(0)}${channel(1)}${channel(2)}`;
};

export function DashboardBienestar({ navigation }: Props) {
  const { token, user } = useAuth();
  const { mode } = useBackgroundMode();
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const isLight = mode === 'light';
  const theme = isLight
    ? { card: '#FFFFFF', border: '#E1EAF4', title: '#172B4D', text: '#5E7894', muted: '#68819D', chip: '#FFFFFF', chipBorder: '#CDE0F5', tip: '#F1FFF8', tipBorder: '#A6ECCC', tipTitle: '#173B2B', tipText: '#4A7060' }
    : { card: '#102039', border: '#27496D', title: '#F4F8FF', text: '#C9D7E8', muted: '#9FB3C8', chip: '#182A44', chipBorder: '#5D87BE', tip: '#103628', tipBorder: '#287452', tipTitle: '#F4F8FF', tipText: '#C3DBC9' };
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [physical, setPhysical] = useState<PhysicalSummary | null>(null);
  const [mental, setMental] = useState<MentalStats | null>(null);
  const [history, setHistory] = useState<MentalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headers = useMemo<Record<string, string>>(() => { const result: Record<string, string> = {}; if (token) result.Authorization = `Bearer ${token}`; return result; }, [token]);
  const selectedPatient = patients.find((patient) => patient.pacienteId === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const linked = await fetchLinkedPatients(headers, { forceRefresh: true });
      const me = token ? await fetch(`${API_URL}/auth/me`, { headers }) : null;
      const profile = me?.ok ? await me.json() as { pacienteId?: number | null; pacienteIds?: number[] } : null;
      const linkedPrincipal = linked.find((item) => item.esPrincipal);
      const candidateIds = [
        profile?.pacienteId,
        user?.pacienteId,
        getTokenPacienteId(token),
        ...(profile?.pacienteIds ?? []),
        ...(user?.pacienteIds ?? []),
      ];
      const preferredId = candidateIds
        .map((value) => Number(value))
        .find((value) => Number.isInteger(value) && value > 0);
      const available = !linkedPrincipal && preferredId && !linked.some((item) => item.pacienteId === preferredId)
        ? [{ pacienteId: preferredId, displayName: 'Paciente principal', esPrincipal: true }, ...linked]
        : linked;
      setPatients(available);
      const patientId = selectedId && available.some((item) => item.pacienteId === selectedId)
        ? selectedId
        : linkedPrincipal?.pacienteId ?? preferredId ?? available[0]?.pacienteId ?? null;
      setSelectedId(patientId);
      if (!patientId) { setPhysical(null); setMental(null); setHistory(null); return; }
      const [physicalResponse, mentalResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/resumen`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/estadisticas`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/historial`, { headers }),
      ]);
      setPhysical(physicalResponse.ok ? await physicalResponse.json() : null);
      setMental(mentalResponse.ok ? await mentalResponse.json() : null);
      setHistory(historyResponse.ok ? await historyResponse.json() : null);
    } catch { setError('No se pudo actualizar el dashboard. Intenta nuevamente.'); } finally { setLoading(false); }
  }, [headers, selectedId, token, user?.pacienteId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const weekly = mental?.promedioSemanal ?? mental?.weekly;
  const physicalScore = clamp(((physical?.ejercicio?.minutosTotales ?? 0) / 150) * 55 + ((physical?.ejercicio?.pasosPromedio ?? 0) / 8000) * 45);
  const mentalScore = clamp(((weekly?.estadoAnimo ?? 0) / 5) * 55 + (1 - Math.min((weekly?.estres ?? 5) / 5, 1)) * 25 + Math.min((weekly?.horasSueno ?? 0) / 8, 1) * 20);
  const hydration = history?.historialPorFecha?.[0]?.hidratacionLitros ?? null;
  const nutritionScore = hydration === null ? null : clamp((hydration / 2) * 100);
  const overallScore = clamp((physicalScore + mentalScore + (nutritionScore ?? 50)) / 3);
  const dashboardColor = scoreColor(overallScore);
  const hasPhysicalData = physical?.ejercicio?.minutosTotales != null || physical?.ejercicio?.pasosPromedio != null;
  const physicalAdvice = !hasPhysicalData
    ? {
        title: 'Registra tu actividad física',
        message: 'Agrega tus pasos o minutos de ejercicio para recibir recomendaciones personalizadas.',
      }
    : physicalScore >= 80
      ? {
          title: '¡Excelente ritmo físico!',
          message: 'Mantén tu constancia: tu actividad y pasos reflejan un muy buen avance.',
        }
      : physicalScore >= 50
        ? {
            title: 'Vas por buen camino',
            message: 'Una caminata corta o algunos minutos más de ejercicio te ayudarán a mejorar tu estado físico.',
          }
        : {
            title: 'Es momento de activarte',
            message: 'Empieza con una caminata suave o una rutina corta para elevar tu bienestar físico.',
          };
  const cards = [
    { title: 'Salud mental', score: mentalScore, icon: 'heart-outline' as const, color: '#A78BFA', detail: `Ánimo ${valueLabel(weekly?.estadoAnimo, '/5')} · Sueño ${valueLabel(weekly?.horasSueno, ' h')}`, route: 'SaludMental' },
    { title: 'Actividad y ejercicio', score: physicalScore, icon: 'fitness-outline' as const, color: '#38D996', detail: `${valueLabel(physical?.ejercicio?.minutosTotales, ' min')} · ${valueLabel(physical?.ejercicio?.pasosPromedio, ' pasos')}`, route: 'SeguimientoFisico' },
    { title: 'Alimentación y peso', score: nutritionScore, icon: 'nutrition-outline' as const, color: '#F5B942', detail: nutritionScore === null ? 'Registra tu hidratación para calcularlo' : `Hidratación ${hydration} L · ${valueLabel(physical?.peso?.cambio, ' kg')}`, route: 'NanoConsejero' },
  ];

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#0B6FEA" />}>
    <View style={[styles.hero, isWide && styles.heroWide, { backgroundColor: dashboardColor }]}><View style={styles.heroCopy}><AppText style={styles.heroTitle}>{physicalAdvice.title}</AppText><AppText style={styles.heroText}>{physicalAdvice.message}</AppText><AppText style={styles.patientLabel}>Sesión activa: {selectedPatient?.displayName ?? 'Selecciona un paciente'}</AppText></View><View style={styles.scoreRing}><AppText style={styles.scoreValue}>{overallScore}</AppText><AppText style={styles.scoreUnit}>/100</AppText></View></View>
    {patients.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientRow}>{patients.map((patient) => <TouchableOpacity key={patient.pacienteId} onPress={() => setSelectedId(patient.pacienteId)} style={[styles.patientChip, { backgroundColor: theme.chip, borderColor: theme.chipBorder }, patient.pacienteId === selectedId && styles.patientChipActive]}><AppText style={[styles.patientText, { color: theme.text }, patient.pacienteId === selectedId && styles.patientTextActive]}>{patient.displayName}</AppText></TouchableOpacity>)}</ScrollView> : null}
    {loading ? <ActivityIndicator size="large" color="#0B6FEA" style={styles.loader} /> : null}{error ? <AppText style={styles.error}>{error}</AppText> : null}
    <View style={styles.sectionHeader}><AppText style={[styles.sectionTitle, { color: theme.title }]}>Indicadores de bienestar</AppText><AppText style={[styles.sectionMeta, { color: theme.muted }]}>3 áreas disponibles</AppText></View>
    <View style={styles.grid}>{cards.map((card) => <TouchableOpacity key={card.title} style={[styles.card, isWide && styles.cardWide, { backgroundColor: theme.card, borderColor: card.color }]} onPress={() => navigation.navigate(card.route)}><View style={[styles.cardIcon, { backgroundColor: `${card.color}20` }]}><Ionicons name={card.icon} size={23} color={card.color} /></View><View style={styles.cardInfo}><View style={styles.cardTitleRow}><AppText style={[styles.cardTitle, { color: theme.title }]}>{card.title}</AppText><AppText style={[styles.cardScore, { color: card.color }]}>{card.score == null ? '—' : `${card.score}%`}</AppText></View><AppText style={[styles.cardDetail, { color: theme.text }]} numberOfLines={2}>{card.detail}</AppText></View><Ionicons name="chevron-forward" size={20} color={theme.muted} /></TouchableOpacity>)}</View>
    <View style={[styles.tipCard, { backgroundColor: theme.tip, borderColor: theme.tipBorder }]}><Ionicons name="sparkles-outline" size={22} color="#28B879" /><View style={styles.tipCopy}><AppText style={[styles.tipTitle, { color: theme.tipTitle }]}>Recomendación de hoy</AppText><AppText style={[styles.tipText, { color: theme.tipText }]}>{overallScore >= 70 ? 'Vas bien: mantén la constancia con tus registros diarios.' : 'Completa un registro de actividad, ánimo e hidratación para obtener una lectura más precisa.'}</AppText></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' }, content: { paddingBottom: 28, gap: 14 }, hero: { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF66', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }, heroWide: { paddingHorizontal: 22, paddingVertical: 16 }, heroCopy: { flex: 1 }, badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { fontSize: 11, fontWeight: '800' }, heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 13 }, heroText: { color: '#FFFFFFE6', fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 650 }, patientLabel: { color: '#FFFFFFD9', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 7 }, scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: '#FFFFFF99', backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' }, scoreValue: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', lineHeight: 25 }, scoreUnit: { color: '#FFFFFFD9', fontSize: 10 },
  patientRow: { gap: 8 }, patientChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, patientChipActive: { backgroundColor: '#0B6FEA', borderColor: '#0B6FEA' }, patientText: { fontSize: 12, fontWeight: '700' }, patientTextActive: { color: '#FFFFFF' }, loader: { marginVertical: 8 }, error: { color: '#E64A66', textAlign: 'center' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }, sectionTitle: { fontSize: 17, fontWeight: '900' }, sectionMeta: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, card: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minHeight: 106, borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }, cardWide: { minHeight: 106 }, cardIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, cardInfo: { flex: 1, minWidth: 0, gap: 4 }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, cardTitle: { fontSize: 14, fontWeight: '900', flex: 1 }, cardScore: { fontSize: 12, fontWeight: '900' }, cardDetail: { fontSize: 11, lineHeight: 16 },
  tipCard: { flexDirection: 'row', gap: 11, borderWidth: 1, borderRadius: 16, padding: 15 }, tipCopy: { flex: 1 }, tipTitle: { fontSize: 13, fontWeight: '900' }, tipText: { fontSize: 12, lineHeight: 17, marginTop: 3 },
});
