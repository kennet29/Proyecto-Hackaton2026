import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from './AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useBackgroundMode } from '../context/BackgroundModeContext';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { getTokenPacienteId } from '../utils/jwt';
import { getNanoAppearance, NanoAppearancePreview } from './NanoAppearancePreview';
import { NanoSectionIllustration, NanoSection } from './NanoSectionIllustration';
import { toLocalDateOnlyString } from '../utils/localDate';

type PhysicalSummary = { peso?: { actual: number | null; cambio: number | null }; ejercicio?: { minutosTotales: number | null; pasosPromedio: number | null } };
type MentalStats = { promedioSemanal?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null }; weekly?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null } };
type MentalHistory = { historialPorFecha?: Array<{ hidratacionLitros?: number | null }> };
type HabitRecord = { pacienteId: number; tipohabitoId: number; cantidad?: number | null; unidad?: string | null; inicio?: string | null };
type HabitType = { tipohabitoId: number; nombre: string; categoria?: string | null };
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
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [habitTypes, setHabitTypes] = useState<HabitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const headers = useMemo<Record<string, string>>(() => { const result: Record<string, string> = {}; if (token) result.Authorization = `Bearer ${token}`; return result; }, [token]);

  const load = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true); setError(null);
    try {
      const linked = await fetchLinkedPatients(headers, { forceRefresh: true });
      const me = token ? await fetch(`${API_URL}/auth/me`, { headers }) : null;
      const profile = me?.ok ? await me.json() as { pacienteId?: number | null; pacienteIds?: number[] } : null;
      if (currentRequestId !== requestId.current) return;
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
        ? [{ pacienteId: preferredId, displayName: 'Persona principal', esPrincipal: true }, ...linked]
        : linked;
      setPatients(available);
      const patientId = selectedId && available.some((item) => item.pacienteId === selectedId)
        ? selectedId
        : linkedPrincipal?.pacienteId ?? preferredId ?? available[0]?.pacienteId ?? null;
      setSelectedId(patientId);
      if (!patientId) { setPhysical(null); setMental(null); setHistory(null); setHabits([]); setHabitTypes([]); return; }
      const [physicalResponse, mentalResponse, historyResponse, habitsResponse, habitTypesResponse] = await Promise.all([
        fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/resumen`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/estadisticas`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/historial`, { headers }),
        fetch(`${API_URL}/habitoespecifico`, { headers }),
        fetch(`${API_URL}/tipohabito`, { headers }),
      ]);
      if (currentRequestId !== requestId.current) return;
      setPhysical(physicalResponse.ok ? await physicalResponse.json() : null);
      setMental(mentalResponse.ok ? await mentalResponse.json() : null);
      setHistory(historyResponse.ok ? await historyResponse.json() : null);
      const habitRecords = habitsResponse.ok ? await habitsResponse.json() : [];
      const typeRecords = habitTypesResponse.ok ? await habitTypesResponse.json() : [];
      setHabits(Array.isArray(habitRecords) ? habitRecords : []);
      setHabitTypes(Array.isArray(typeRecords) ? typeRecords : []);
    } catch {
      if (currentRequestId === requestId.current) setError('No se pudo actualizar el dashboard. Intenta nuevamente.');
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [headers, selectedId, token, user?.pacienteId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const weekly = mental?.promedioSemanal ?? mental?.weekly;
  const physicalScore = clamp(((physical?.ejercicio?.minutosTotales ?? 0) / 150) * 55 + ((physical?.ejercicio?.pasosPromedio ?? 0) / 8000) * 45);
  const mentalScore = clamp(((weekly?.estadoAnimo ?? 0) / 5) * 70 + (1 - Math.min((weekly?.estres ?? 5) / 5, 1)) * 30);
  const hydrationTypeIds = new Set(habitTypes
    .filter((type) => /agua|hidrat/i.test(`${type.nombre} ${type.categoria ?? ''}`))
    .map((type) => type.tipohabitoId));
  const hydrationRecords = habits.filter((record) =>
    record.pacienteId === selectedId && hydrationTypeIds.has(record.tipohabitoId));
  const hydrationDate = hydrationRecords.some((record) => record.inicio === toLocalDateOnlyString())
    ? toLocalDateOnlyString()
    : hydrationRecords.map((record) => record.inicio ?? '').sort().at(-1) ?? '';
  const hydrationFromHabits = hydrationRecords
    .filter((record) => record.inicio === hydrationDate)
    .reduce((total, record) => {
      const amount = Number(record.cantidad ?? 0);
      return total + ((record.unidad ?? '').toLowerCase().includes('ml') ? amount / 1000 : amount);
    }, 0);
  const legacyHydration = history?.historialPorFecha?.[0]?.hidratacionLitros ?? null;
  const hydration = hydrationFromHabits > 0 ? hydrationFromHabits : legacyHydration;
  const hydrationScore = hydration === null ? null : clamp((hydration / 2) * 100);
  const sleepHours = weekly?.horasSueno ?? null;
  const sleepScore = sleepHours === null ? null : clamp(Math.min(sleepHours / 8, 1) * 100);
  const healthyHabitValues = [hydrationScore, sleepScore].filter((value): value is number => value !== null);
  const healthyHabitsScore = healthyHabitValues.length
    ? clamp(healthyHabitValues.reduce((total, value) => total + value, 0) / healthyHabitValues.length)
    : null;
  const overallScore = clamp((physicalScore + mentalScore + (healthyHabitsScore ?? 50)) / 3);
  const dashboardColor = scoreColor(overallScore);
  const cards: Array<{ title: string; score: number | null; icon: keyof typeof Ionicons.glyphMap; nanoSection?: NanoSection; color: string; detail: string; route: string }> = [
    { title: 'Salud mental', score: mentalScore, icon: 'heart-outline', nanoSection: 'salud-mental', color: '#A78BFA', detail: `Ánimo ${valueLabel(weekly?.estadoAnimo, '/5')} · Estrés ${valueLabel(weekly?.estres, '/5')}`, route: 'SaludMental' },
    { title: 'Actividad y ejercicio', score: physicalScore, icon: 'fitness-outline', nanoSection: 'seguimiento-fisico', color: '#38D996', detail: `${valueLabel(physical?.ejercicio?.minutosTotales, ' min')} · ${valueLabel(physical?.ejercicio?.pasosPromedio, ' pasos')}`, route: 'SeguimientoFisico' },
    { title: 'Hábitos saludables', score: healthyHabitsScore, icon: 'leaf-outline', color: '#29B6FF', detail: `Sueño ${valueLabel(sleepHours, ' h')} · Agua ${hydration === null ? 'Sin datos' : `${Number(hydration).toFixed(2)} L`}`, route: 'Habitos' },
    { title: 'Alimentación y peso', score: null, icon: 'nutrition-outline', nanoSection: 'alimentacion', color: '#F5B942', detail: `Analiza tus comidas con Nano · Peso ${valueLabel(physical?.peso?.actual, ' kg')}`, route: 'NanoConsejero' },
  ];

  if (!loading && !error && patients.length === 0) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, styles.emptyContent]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#0B6FEA" />}
      >
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.nanoHalo}>
            <NanoAppearancePreview appearance={getNanoAppearance('base')} size={92} />
          </View>
          <View style={styles.emptyCopy}>
            <AppText style={[styles.emptyEyebrow, { color: theme.muted }]}>NANO TE AYUDA</AppText>
            <AppText style={[styles.emptyTitle, { color: theme.title }]}>Primero registra a una persona</AppText>
            <AppText style={[styles.emptyText, { color: theme.text }]}>
              Aún no tienes a ninguna persona registrada. Necesito esos datos para personalizar el panel y cuidar su información de salud.
            </AppText>
            <View style={styles.stepsRow}>
              {[
                ['1', 'Datos básicos'],
                ['2', 'Contacto'],
                ['3', 'Vínculo'],
              ].map(([number, label]) => (
                <View key={number} style={styles.stepItem}>
                  <View style={styles.stepNumber}><AppText style={styles.stepNumberText}>{number}</AppText></View>
                  <AppText style={[styles.stepLabel, { color: theme.text }]}>{label}</AppText>
                </View>
              ))}
            </View>
            <AppText style={[styles.emptyHelp, { color: theme.muted }]}>Te acompañaré paso a paso. Solo te pediré primero los datos indispensables.</AppText>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('PacienteEditor')}
              accessibilityRole="button"
              accessibilityLabel="Registrar la primera persona con ayuda de Nano"
            >
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <AppText style={styles.emptyButtonText}>Registrar persona</AppText>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
  <View style={styles.dashboard}>
  <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#0B6FEA" />}>
    <View style={[styles.hero, isWide ? styles.heroWide : styles.heroCompact, { backgroundColor: dashboardColor }]}><NanoSectionIllustration section="prime" size={isWide ? 76 : 60} /><View style={[styles.heroCopy, !isWide && styles.heroCopyCompact]}><AppText style={[styles.heroTitle, !isWide && styles.heroTitleCompact]}>Bienestar Prime</AppText><AppText style={styles.heroText}>Resumen de actividad física, bienestar emocional y hábitos saludables.</AppText></View><View style={[styles.scoreRing, !isWide && styles.scoreRingCompact]}><AppText style={styles.scoreValue}>{overallScore}</AppText><AppText style={styles.scoreUnit}>/100</AppText></View></View>
    {patients.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientRow}>{patients.map((patient) => <TouchableOpacity key={patient.pacienteId} onPress={() => { setSelectedId(patient.pacienteId); setPhysical(null); setMental(null); setHistory(null); }} style={[styles.patientChip, { backgroundColor: theme.chip, borderColor: theme.chipBorder }, patient.pacienteId === selectedId && styles.patientChipActive]}><AppText style={[styles.patientText, { color: theme.text }, patient.pacienteId === selectedId && styles.patientTextActive]}>{patient.displayName}</AppText></TouchableOpacity>)}</ScrollView> : null}
    {loading ? <ActivityIndicator size="large" color="#0B6FEA" style={styles.loader} /> : null}{error ? <AppText style={styles.error}>{error}</AppText> : null}
    <View style={styles.sectionHeader}><NanoSectionIllustration section="dashboard-indicadores" size={isWide ? 52 : 44} /><View style={[styles.sectionHeaderCopy, !isWide && styles.sectionHeaderCopyCompact]}><AppText style={[styles.sectionTitle, { color: theme.title }]}>Indicadores de bienestar</AppText><AppText style={[styles.sectionMeta, { color: theme.muted }]}>4 áreas disponibles</AppText></View></View>
    <View style={styles.grid}>{cards.map((card) => <TouchableOpacity key={card.title} style={[styles.card, isWide && styles.cardWide, { backgroundColor: theme.card, borderColor: card.color }]} onPress={() => navigation.navigate(card.route)}><View style={[styles.cardIcon, { backgroundColor: card.nanoSection ? '#FFFFFF' : `${card.color}20` }]}>{card.nanoSection ? <NanoSectionIllustration section={card.nanoSection} size={46} /> : <Ionicons name={card.icon} size={23} color={card.color} />}</View><View style={styles.cardInfo}><View style={styles.cardTitleRow}><AppText style={[styles.cardTitle, { color: theme.title }]}>{card.title}</AppText><AppText style={[styles.cardScore, { color: card.color }]}>{card.score == null ? '—' : `${card.score}%`}</AppText></View><AppText style={[styles.cardDetail, { color: theme.text }]} numberOfLines={2}>{card.detail}</AppText></View><Ionicons name="chevron-forward" size={20} color={theme.muted} /></TouchableOpacity>)}</View>
    <View style={[styles.tipCard, { backgroundColor: theme.tip, borderColor: theme.tipBorder }]}><Ionicons name="sparkles-outline" size={22} color="#28B879" /><View style={styles.tipCopy}><AppText style={[styles.tipTitle, { color: theme.tipTitle }]}>Recomendación de hoy</AppText><AppText style={[styles.tipText, { color: theme.tipText }]}>{overallScore >= 70 ? 'Vas bien: mantén la constancia con tus registros diarios.' : 'Registra actividad, estado emocional, sueño y agua en sus secciones correspondientes.'}</AppText></View></View>
  </ScrollView>
  <TouchableOpacity
    style={[styles.addPersonFab, isWide && styles.addPersonFabWide]}
    onPress={() => navigation.navigate('PacienteEditor')}
    accessibilityRole="button"
    accessibilityLabel="Agregar una nueva persona"
    accessibilityHint="Abre el formulario para registrar una persona"
    activeOpacity={0.86}
  >
    <NanoAppearancePreview appearance={getNanoAppearance('agregar')} size={isWide ? 54 : 48} />
    {isWide ? <AppText style={styles.addPersonFabText}>Nueva persona</AppText> : null}
  </TouchableOpacity>
  </View>
  );
}

const styles = StyleSheet.create({
  dashboard: { flex: 1, width: '100%', position: 'relative' },
  scroll: { flex: 1, width: '100%' }, content: { paddingBottom: 110, gap: 14 }, hero: { borderRadius: 20, borderWidth: 1, borderColor: '#FFFFFF66', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }, heroWide: { paddingHorizontal: 22, paddingVertical: 16 }, heroCompact: { padding: 15, gap: 10 }, heroCopy: { flex: 1 }, heroCopyCompact: { minWidth: 105 }, badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6 }, badgeText: { fontSize: 11, fontWeight: '800' }, heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' }, heroTitleCompact: { fontSize: 20, lineHeight: 23 }, heroText: { color: '#FFFFFFE6', fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 650 }, scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: '#FFFFFF99', backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' }, scoreRingCompact: { width: 66, height: 66, borderRadius: 33, borderWidth: 5 }, scoreValue: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', lineHeight: 25 }, scoreUnit: { color: '#FFFFFFD9', fontSize: 10 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  emptyCard: { width: '100%', maxWidth: 920, alignSelf: 'center', borderWidth: 1, borderRadius: 24, padding: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24 },
  nanoHalo: { width: 132, height: 132, borderRadius: 66, backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BBD9FA' },
  emptyCopy: { flex: 1, minWidth: 260, maxWidth: 620 },
  emptyEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  emptyTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  emptyText: { fontSize: 14, lineHeight: 21 },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: '#EAF4FF', paddingVertical: 7, paddingHorizontal: 10 },
  stepNumber: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#0B6FEA', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  stepLabel: { fontSize: 12, fontWeight: '800' },
  emptyHelp: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  emptyButton: { alignSelf: 'flex-start', minHeight: 48, marginTop: 18, borderRadius: 14, paddingHorizontal: 17, backgroundColor: '#0B6FEA', flexDirection: 'row', alignItems: 'center', gap: 9 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  patientRow: { gap: 8 }, patientChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 }, patientChipActive: { backgroundColor: '#0B6FEA', borderColor: '#0B6FEA' }, patientText: { fontSize: 12, fontWeight: '700' }, patientTextActive: { color: '#FFFFFF' }, loader: { marginVertical: 8 }, error: { color: '#E64A66', textAlign: 'center' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }, sectionHeaderCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionHeaderCopyCompact: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 2 }, sectionTitle: { fontSize: 17, fontWeight: '900' }, sectionMeta: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, card: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minHeight: 106, borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }, cardWide: { minHeight: 106 }, cardIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, cardInfo: { flex: 1, minWidth: 0, gap: 4 }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, cardTitle: { fontSize: 14, fontWeight: '900', flex: 1 }, cardScore: { fontSize: 12, fontWeight: '900' }, cardDetail: { fontSize: 11, lineHeight: 16 },
  tipCard: { flexDirection: 'row', gap: 11, borderWidth: 1, borderRadius: 16, padding: 15 }, tipCopy: { flex: 1 }, tipTitle: { fontSize: 13, fontWeight: '900' }, tipText: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  addPersonFab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 7,
    backgroundColor: '#0B6FEA',
    borderWidth: 2,
    borderColor: '#8DCAFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
    zIndex: 20,
  },
  addPersonFabWide: {
    width: 'auto',
    minWidth: 190,
    paddingHorizontal: 8,
    paddingRight: 20,
    flexDirection: 'row',
    gap: 10,
  },
  addPersonFabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
