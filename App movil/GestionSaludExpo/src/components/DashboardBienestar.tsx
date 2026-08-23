/**
 * @file App movil/GestionSaludExpo/src/components/DashboardBienestar.tsx
 * @description Resume indicadores de bienestar obtenidos de los seguimientos registrados.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from './AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { getTokenPacienteId } from '../utils/jwt';

type PhysicalSummary = {
  peso?: { actual: number | null; cambio: number | null };
  ejercicio?: { minutosTotales: number | null; pasosPromedio: number | null };
};

type MentalStats = {
  promedioSemanal?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null };
  weekly?: { estadoAnimo?: number | null; estres?: number | null; horasSueno?: number | null };
};

type MentalHistory = {
  historialPorFecha?: Array<{ hidratacionLitros?: number | null }>;
};

type Props = {
  navigation: { navigate: (screen: string) => void };
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const numberLabel = (value?: number | null, suffix = '') =>
  value === null || value === undefined ? 'Sin datos' : `${value}${suffix}`;

export function DashboardBienestar({ navigation }: Props) {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [physical, setPhysical] = useState<PhysicalSummary | null>(null);
  const [mental, setMental] = useState<MentalStats | null>(null);
  const [mentalHistory, setMentalHistory] = useState<MentalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo<Record<string, string>>(
    () => {
      const result: Record<string, string> = {};
      if (token) result.Authorization = `Bearer ${token}`;
      return result;
    },
    [token],
  );
  const selectedPatient = patients.find((patient) => patient.pacienteId === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const linked = await fetchLinkedPatients(headers);
      const sessionResponse = token
        ? await fetch(`${API_URL}/auth/me`, { headers })
        : null;
      const sessionProfile = sessionResponse?.ok
        ? await sessionResponse.json() as { pacienteId?: number | null }
        : null;
      // La sesión web puede haberse guardado antes de que el campo pacienteId
      // se añadiera a su perfil. El backend es la fuente vigente en ese caso.
      const preferredPatientId = Number(
        sessionProfile?.pacienteId ?? user?.pacienteId ?? getTokenPacienteId(token),
      );
      const hasSessionPatient = Number.isInteger(preferredPatientId) && preferredPatientId > 0;
      const availablePatients = hasSessionPatient && !linked.some((item) => item.pacienteId === preferredPatientId)
        ? [{
            pacienteId: preferredPatientId,
            displayName: 'Paciente principal',
            esPrincipal: true,
          }, ...linked]
        : linked;
      setPatients(availablePatients);
      const principalPatientId = availablePatients.find((item) => item.esPrincipal)?.pacienteId;
      const patientId = selectedId && availablePatients.some((item) => item.pacienteId === selectedId)
        ? selectedId
        : hasSessionPatient
          ? preferredPatientId
          : principalPatientId ?? availablePatients[0]?.pacienteId ?? null;
      setSelectedId(patientId);
      if (!patientId) {
        setPhysical(null);
        setMental(null);
        setMentalHistory(null);
        return;
      }
      const [physicalResponse, mentalResponse, historyResponse] = await Promise.all([
        fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/resumen`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/estadisticas`, { headers }),
        fetch(`${API_URL}/salud-mental/paciente/${patientId}/historial`, { headers }),
      ]);
      setPhysical(physicalResponse.ok ? await physicalResponse.json() : null);
      setMental(mentalResponse.ok ? await mentalResponse.json() : null);
      setMentalHistory(historyResponse.ok ? await historyResponse.json() : null);
    } catch {
      setError('No se pudo actualizar el dashboard. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [headers, selectedId, token, user?.pacienteId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const weekly = mental?.promedioSemanal ?? mental?.weekly;
  const physicalScore = clamp(((physical?.ejercicio?.minutosTotales ?? 0) / 150) * 55 + ((physical?.ejercicio?.pasosPromedio ?? 0) / 8000) * 45);
  const mentalScore = clamp(((weekly?.estadoAnimo ?? 0) / 5) * 55 + (1 - Math.min((weekly?.estres ?? 5) / 5, 1)) * 25 + Math.min((weekly?.horasSueno ?? 0) / 8, 1) * 20);
  const hydration = mentalHistory?.historialPorFecha?.[0]?.hidratacionLitros ?? null;
  const nutritionScore = hydration === null ? null : clamp((hydration / 2) * 100);
  const overallScore = clamp((physicalScore + mentalScore + (nutritionScore ?? 50)) / 3);

  const cards = [
    { title: 'Estado fisico', score: physicalScore, icon: 'body-outline' as const, color: '#29B6FF', detail: `${numberLabel(physical?.peso?.actual, ' kg')} actual` , route: 'SeguimientoFisico' },
    { title: 'Salud mental', score: mentalScore, icon: 'heart-outline' as const, color: '#A78BFA', detail: `Animo ${numberLabel(weekly?.estadoAnimo, '/5')} · Sueno ${numberLabel(weekly?.horasSueno, ' h')}`, route: 'SaludMental' },
    { title: 'Actividad y ejercicio', score: physicalScore, icon: 'fitness-outline' as const, color: '#38E28E', detail: `${numberLabel(physical?.ejercicio?.minutosTotales, ' min')} · ${numberLabel(physical?.ejercicio?.pasosPromedio, ' pasos')}`, route: 'SeguimientoFisico' },
    { title: 'Alimentacion y peso', score: nutritionScore, icon: 'nutrition-outline' as const, color: '#F5B942', detail: nutritionScore === null ? 'Registra tu hidratacion para calcularlo' : `Hidratacion ${hydration} L · ${numberLabel(physical?.peso?.cambio, ' kg')}`, route: 'NanoConsejero' },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#29B6FF" />}
    >
      <View style={styles.scoreCard}>
        <View style={styles.scoreCopy}>
          <AppText style={styles.eyebrow}>TU PANORAMA DE BIENESTAR</AppText>
          <AppText style={styles.scoreTitle}>{selectedPatient?.displayName ?? 'Selecciona un paciente'}</AppText>
          <AppText style={styles.scoreText}>Indicador orientativo calculado con tus registros mas recientes.</AppText>
        </View>
        <View style={styles.scoreRing}>
          <AppText style={styles.scoreValue}>{overallScore}</AppText>
          <AppText style={styles.scoreUnit}>/100</AppText>
        </View>
      </View>

      {patients.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientRow}>
          {patients.map((patient) => (
            <TouchableOpacity key={patient.pacienteId} onPress={() => setSelectedId(patient.pacienteId)} style={[styles.patientChip, patient.pacienteId === selectedId && styles.patientChipActive]}>
              <AppText style={[styles.patientText, patient.pacienteId === selectedId && styles.patientTextActive]}>{patient.displayName}</AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {loading ? <ActivityIndicator size="large" color="#29B6FF" style={styles.loader} /> : null}
      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity key={card.title} style={[styles.card, { borderColor: `${card.color}66` }]} onPress={() => navigation.navigate(card.route)}>
            <View style={[styles.cardIcon, { backgroundColor: `${card.color}20` }]}><Ionicons name={card.icon} size={21} color={card.color} /></View>
            <View style={styles.cardHead}><AppText style={styles.cardTitle}>{card.title}</AppText><AppText style={[styles.cardScore, { color: card.color }]}>{card.score ?? '—'}{card.score === null ? '' : '%'}</AppText></View>
            <View style={styles.progressTrack}><View style={[styles.progress, { width: `${card.score ?? 0}%`, backgroundColor: card.color }]} /></View>
            <AppText style={styles.cardDetail} numberOfLines={2}>{card.detail}</AppText>
            <AppText style={[styles.openText, { color: card.color }]}>Ver detalle</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="sparkles-outline" size={22} color="#38E28E" />
        <View style={styles.tipCopy}><AppText style={styles.tipTitle}>Recomendacion de hoy</AppText><AppText style={styles.tipText}>{overallScore >= 70 ? 'Vas bien: manten la constancia con tus registros diarios.' : 'Completa un registro de actividad, animo e hidratacion para obtener una lectura mas precisa.'}</AppText></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' }, content: { paddingBottom: 28, gap: 14 },
  scoreCard: { borderRadius: 22, backgroundColor: '#10284A', borderWidth: 1, borderColor: '#2B65A0', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreCopy: { flex: 1 }, eyebrow: { color: '#74C6FF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, scoreTitle: { color: '#F4F8FF', fontSize: 21, fontWeight: '900', marginTop: 4 }, scoreText: { color: '#B9CBE0', fontSize: 12, lineHeight: 17, marginTop: 5 },
  scoreRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: '#29B6FF', alignItems: 'center', justifyContent: 'center' }, scoreValue: { color: '#F4F8FF', fontSize: 23, fontWeight: '900', lineHeight: 25 }, scoreUnit: { color: '#9FB3C8', fontSize: 10 },
  patientRow: { gap: 8 }, patientChip: { borderRadius: 999, backgroundColor: '#162B46', borderWidth: 1, borderColor: '#294865', paddingHorizontal: 12, paddingVertical: 8 }, patientChipActive: { backgroundColor: '#29B6FF', borderColor: '#29B6FF' }, patientText: { color: '#B8CAE0', fontSize: 12, fontWeight: '700' }, patientTextActive: { color: '#071120' },
  loader: { marginVertical: 8 }, error: { color: '#FF7C99', textAlign: 'center' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { flexGrow: 1, flexShrink: 1, flexBasis: 230, minHeight: 168, backgroundColor: '#132238', borderRadius: 18, borderWidth: 1, padding: 14, gap: 9 }, cardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, cardTitle: { color: '#F4F8FF', fontSize: 14, fontWeight: '900', flex: 1 }, cardScore: { fontSize: 17, fontWeight: '900' }, progressTrack: { height: 6, backgroundColor: '#223B58', borderRadius: 99, overflow: 'hidden' }, progress: { height: '100%', borderRadius: 99 }, cardDetail: { color: '#9FB3C8', fontSize: 11, lineHeight: 16, flex: 1 }, openText: { fontSize: 11, fontWeight: '900' },
  tipCard: { flexDirection: 'row', gap: 11, backgroundColor: '#123326', borderColor: '#38E28E55', borderWidth: 1, borderRadius: 17, padding: 14 }, tipCopy: { flex: 1 }, tipTitle: { color: '#F4F8FF', fontSize: 13, fontWeight: '900' }, tipText: { color: '#C3DBC9', fontSize: 12, lineHeight: 17, marginTop: 3 },
});
