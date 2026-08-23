/**
 * @file App movil/GestionSaludExpo/src/screens/SaludMentalScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';

type SaludMentalRecord = {
  saludmentalId: number;
  pacienteId: number;
  fecha: string;
  estadoAnimo: number;
  estres: number;
  ansiedad: number;
  horasSueno: number | null;
  notaPersonal: string | null;
  ejercicioMinutos: number | null;
  hidratacionLitros: number | null;
  descansoHoras: number | null;
  tiempoSocialMinutos: number | null;
  pausasDigitales: number | null;
};

type SaludMentalHistorial = {
  pacienteId: number;
  totalRegistros: number;
  historialPorFecha: SaludMentalRecord[];
};

type SaludMentalStats = {
  promedioSemanal?: {
    registros: number;
    estadoAnimo: number | null;
    estres: number | null;
    ansiedad: number | null;
    horasSueno: number | null;
  };
  tendenciaMensual?: Array<{
    mes: string;
    registros: number;
    estadoAnimoPromedio: number | null;
    estresPromedio: number | null;
    ansiedadPromedio: number | null;
    horasSuenoPromedio: number | null;
  }>;
};

type SaludMentalAlerts = {
  totalAlertas: number;
  alertas: Array<{
    tipo: string;
    severidad: 'media' | 'alta';
    fecha: string;
    detalle: string;
  }>;
};

const today = () => toLocalDateOnlyString();

const scoreOptions = [
  { label: '1 - Muy bajo', value: '1' },
  { label: '2 - Bajo', value: '2' },
  { label: '3 - Medio', value: '3' },
  { label: '4 - Alto', value: '4' },
  { label: '5 - Muy alto', value: '5' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseCalendarDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getScoreLabel = (value?: string | number | null) => {
  const normalized = String(value ?? '3');
  return scoreOptions.find((item) => item.value === normalized)?.label ?? '3 - Medio';
};

const getScoreColor = (value?: string | number | null, inverse = false) => {
  const score = Number(value ?? 3);
  if (inverse) {
    if (score >= 4) return '#FF4D73';
    if (score === 3) return '#F9A826';
    return '#38E28E';
  }
  if (score <= 2) return '#FF4D73';
  if (score === 3) return '#F9A826';
  return '#38E28E';
};

const formatAlertTitle = (value: string) => {
  const labels: Record<string, string> = {
    estres_alto: 'Estrés alto',
    poco_sueno: 'Descanso insuficiente',
    cambio_fuerte_animo: 'Cambio marcado de ánimo',
  };
  return labels[value] ?? value.replace(/_/g, ' ');
};

export function SaludMentalScreen() {
  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historial, setHistorial] = useState<SaludMentalHistorial | null>(null);
  const [stats, setStats] = useState<SaludMentalStats | null>(null);
  const [alerts, setAlerts] = useState<SaludMentalAlerts | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: today(),
    estadoAnimo: '3',
    estres: '3',
    ansiedad: '3',
    horasSueno: '',
    ejercicioMinutos: '',
    hidratacionLitros: '',
    descansoHoras: '',
    tiempoSocialMinutos: '',
    pausasDigitales: '',
    notaPersonal: '',
  });

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'pacienteId') {
      setSelectedPatientId(value);
    }
  };

  const loadPatients = useCallback(async () => {
    if (!token) {
      setPatients([]);
      setSelectedPatientId('');
      return;
    }

    setLoadingPatients(true);
    setPatientError(null);

    try {
      const items = await fetchLinkedPatients(authHeaders);
      setPatients(items);
      const defaultPatient = items[0]?.pacienteId ? String(items[0].pacienteId) : '';
      setSelectedPatientId((prev) => prev || defaultPatient);
      setForm((prev) => ({
        ...prev,
        pacienteId: prev.pacienteId || defaultPatient,
      }));
    } catch (error) {
      setPatientError(
        error instanceof Error ? error.message : 'No se pudieron cargar los pacientes',
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const loadData = useCallback(
    async (patientId: string, useRefresh = false) => {
      if (!patientId || !token) {
        setHistorial(null);
        setStats(null);
        setAlerts(null);
        return;
      }

      if (useRefresh) {
        setRefreshing(true);
      } else {
        setLoadingData(true);
      }
      setDataError(null);

      try {
        const historialResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/historial`,
          { headers: authHeaders },
        );
        const historialBody = await historialResponse.json().catch(() => null);
        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }
        setHistorial(historialBody);

        const statsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/estadisticas`,
          { headers: authHeaders },
        );
        const statsBody = await statsResponse.json().catch(() => null);
        setStats(statsResponse.ok ? statsBody : null);

        const alertsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/alertas`,
          { headers: authHeaders },
        );
        const alertsBody = await alertsResponse.json().catch(() => null);
        setAlerts(alertsResponse.ok ? alertsBody : null);
      } catch (error) {
        setDataError(
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del modulo',
        );
      } finally {
        if (useRefresh) {
          setRefreshing(false);
        } else {
          setLoadingData(false);
        }
      }
    },
    [authHeaders, token],
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadData(selectedPatientId);
    }
  }, [loadData, selectedPatientId]);

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha) {
      Alert.alert('Campos requeridos', 'Paciente y fecha son obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/salud-mental`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          fecha: form.fecha,
          estadoAnimo: Number(form.estadoAnimo),
          estres: Number(form.estres),
          ansiedad: Number(form.ansiedad),
          horasSueno: form.horasSueno ? Number(form.horasSueno) : undefined,
          ejercicioMinutos: form.ejercicioMinutos ? Number(form.ejercicioMinutos) : undefined,
          hidratacionLitros: form.hidratacionLitros
            ? Number(form.hidratacionLitros)
            : undefined,
          descansoHoras: form.descansoHoras ? Number(form.descansoHoras) : undefined,
          tiempoSocialMinutos: form.tiempoSocialMinutos
            ? Number(form.tiempoSocialMinutos)
            : undefined,
          pausasDigitales: form.pausasDigitales ? Number(form.pausasDigitales) : undefined,
          notaPersonal: form.notaPersonal || undefined,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar el registro');
      }

      Alert.alert('Registro creado', 'La entrada de salud mental se guardó correctamente');
      setForm((prev) => ({
        ...prev,
        fecha: today(),
        estadoAnimo: '3',
        estres: '3',
        ansiedad: '3',
        horasSueno: '',
        ejercicioMinutos: '',
        hidratacionLitros: '',
        descansoHoras: '',
        tiempoSocialMinutos: '',
        pausasDigitales: '',
        notaPersonal: '',
      }));
      setShowForm(false);
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const statsSummary = useMemo(() => {
    const weekly = stats?.promedioSemanal ?? null;
    const monthly = Array.isArray(stats?.tendenciaMensual)
      ? stats.tendenciaMensual[stats.tendenciaMensual.length - 1]
      : null;
    return { weekly, monthly };
  }, [stats]);

  const latestRecord = historial?.historialPorFecha?.[0] ?? null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(selectedPatientId, true)}
          tintColor="#F4F8FF"
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="happy-outline" size={26} color="#A78BFA" />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.heroEyebrow}>BIENESTAR EMOCIONAL</AppText>
          <AppText style={styles.heroTitle}>Salud mental</AppText>
          <AppText style={styles.heroText}>
            Estado de ánimo, descanso y hábitos diarios en una sola vista.
          </AppText>
        </View>
        <TouchableOpacity style={styles.heroAction} onPress={() => setShowForm((current) => !current)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#071120" />
          <AppText style={styles.heroActionText}>{showForm ? 'Cerrar' : 'Nuevo registro'}</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.patientSelectorCard}>
        <View style={styles.patientSelectorIcon}>
          <Ionicons name="person-outline" size={20} color="#A78BFA" />
        </View>
        <View style={styles.patientSelectorCopy}>
          <AppText style={styles.fieldEyebrow}>PACIENTE</AppText>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38E28E" />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : patients.length === 0 ? (
          <AppText style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</AppText>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
            >
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={
                    patient.parentesco
                      ? `${patient.displayName} - ${patient.parentesco}`
                      : patient.displayName
                  }
                  value={String(patient.pacienteId)}
                  color={pickerItemColor}
                />
              ))}
            </Picker>
          </View>
        )}
        {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.formToggle}
          onPress={() => setShowForm((current) => !current)}
          activeOpacity={0.82}
        >
          <View style={styles.formToggleIcon}>
            <Ionicons name="create-outline" size={20} color="#A78BFA" />
          </View>
          <View style={styles.formToggleCopy}>
            <AppText style={styles.sectionTitle}>Nuevo registro diario</AppText>
            <AppText style={styles.sectionSubtitle}>
              Añade contexto emocional, descanso y hábitos.
            </AppText>
          </View>
          <Ionicons
            name={showForm ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9FB3C8"
          />
        </TouchableOpacity>

        {showForm ? (
          <>
        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Fecha</AppText>
          <AppText style={styles.fieldLabel}>Día del registro</AppText>
          <AppTextInput
            style={styles.input}
            value={form.fecha}
            onChangeText={(value) => handleChange('fecha', value)}
            placeholderTextColor="#9FB3C8"
            placeholder="Fecha (YYYY-MM-DD)"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Estado emocional</AppText>
          <AppText style={styles.scaleHint}>
            Usa la escala del 1 al 5 para registrar cómo se sintió la persona hoy.
          </AppText>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <View style={styles.fieldLabelRow}>
                <AppText style={styles.fieldLabel}>Ánimo</AppText>
                <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.estadoAnimo) }]}>
                  <AppText style={styles.scorePillText}>{getScoreLabel(form.estadoAnimo)}</AppText>
                </View>
              </View>
              <View style={[styles.pickerWrapper, styles.halfInput]}>
                <Picker
                  selectedValue={form.estadoAnimo}
                  onValueChange={(value) => handleChange('estadoAnimo', String(value))}
                >
                  {scoreOptions.map((item) => (
                    <Picker.Item key={`animo-${item.value}`} label={item.label} value={item.value} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.fieldGroupHalf}>
              <View style={styles.fieldLabelRow}>
                <AppText style={styles.fieldLabel}>Estrés</AppText>
                <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.estres, true) }]}>
                  <AppText style={styles.scorePillText}>{getScoreLabel(form.estres)}</AppText>
                </View>
              </View>
              <View style={[styles.pickerWrapper, styles.halfInput]}>
                <Picker
                  selectedValue={form.estres}
                  onValueChange={(value) => handleChange('estres', String(value))}
                >
                  {scoreOptions.map((item) => (
                    <Picker.Item key={`estres-${item.value}`} label={item.label} value={item.value} color={pickerItemColor} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <AppText style={styles.fieldLabel}>Ansiedad</AppText>
              <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.ansiedad, true) }]}>
                <AppText style={styles.scorePillText}>{getScoreLabel(form.ansiedad)}</AppText>
              </View>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.ansiedad}
                onValueChange={(value) => handleChange('ansiedad', String(value))}
              >
                {scoreOptions.map((item) => (
                  <Picker.Item
                    key={`ansiedad-${item.value}`}
                    label={item.label}
                    value={item.value}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Sueño y descanso</AppText>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Horas de sueño</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.horasSueno}
                onChangeText={(value) => handleChange('horasSueno', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Ej. 7.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Horas de descanso</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.descansoHoras}
                onChangeText={(value) => handleChange('descansoHoras', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Ej. 2"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Hábitos del día</AppText>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Ejercicio en minutos</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.ejercicioMinutos}
                onChangeText={(value) => handleChange('ejercicioMinutos', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Ej. 30"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Tiempo social en minutos</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.tiempoSocialMinutos}
                onChangeText={(value) => handleChange('tiempoSocialMinutos', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Ej. 45"
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Hidratación en litros</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.hidratacionLitros}
                onChangeText={(value) => handleChange('hidratacionLitros', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Ej. 2"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.fieldLabel}>Pausas digitales</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.pausasDigitales}
                onChangeText={(value) => handleChange('pausasDigitales', value)}
                placeholderTextColor="#9FB3C8"
                placeholder="Cantidad"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Reflexión personal</AppText>
          <AppText style={styles.fieldLabel}>Nota personal</AppText>
          <AppTextInput
            style={[styles.input, styles.textArea]}
            value={form.notaPersonal}
            onChangeText={(value) => handleChange('notaPersonal', value)}
            placeholderTextColor="#9FB3C8"
            placeholder="Escribe observaciones, detonantes o algo importante del día"
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <AppText style={styles.primaryBtnText}>Guardar registro</AppText>
          )}
        </TouchableOpacity>
          </>
        ) : (
          <View style={styles.formCollapsedHint}>
            <Ionicons name="information-circle-outline" size={17} color="#9FB3C8" />
            <AppText style={styles.formCollapsedText}>
              Abre esta sección cuando quieras registrar cómo se siente el paciente.
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.summaryHeading}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Panorama emocional</AppText>
            <AppText style={styles.sectionSubtitle}>Lectura rápida del seguimiento actual.</AppText>
          </View>
          <View style={styles.recordBadge}>
            <AppText style={styles.recordBadgeValue}>{historial?.totalRegistros ?? 0}</AppText>
            <AppText style={styles.recordBadgeLabel}>registros</AppText>
          </View>
        </View>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38E28E" />
            <AppText style={styles.loadingText}>Cargando estadísticas...</AppText>
          </View>
        ) : (
          <>
            {latestRecord ? (
              <View style={styles.latestRecordBox}>
                <View style={styles.latestRecordHeader}>
                  <View>
                    <AppText style={styles.latestRecordEyebrow}>ÚLTIMO REGISTRO</AppText>
                    <AppText style={styles.latestRecordTitle}>{formatDate(latestRecord.fecha)}</AppText>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#A78BFA" />
                </View>
                <View style={styles.mentalMetricGrid}>
                  <MentalMetric label="Ánimo" value={latestRecord.estadoAnimo} color={getScoreColor(latestRecord.estadoAnimo)} />
                  <MentalMetric label="Estrés" value={latestRecord.estres} color={getScoreColor(latestRecord.estres, true)} />
                  <MentalMetric label="Ansiedad" value={latestRecord.ansiedad} color={getScoreColor(latestRecord.ansiedad, true)} />
                  <MentalMetric label="Sueño" value={latestRecord.horasSueno ?? 'N/D'} suffix={latestRecord.horasSueno !== null ? ' h' : ''} color="#29B6FF" />
                </View>
              </View>
            ) : null}

            {statsSummary.weekly ? (
              <>
                <AppText style={styles.subsectionTitle}>Promedio de los últimos 7 días</AppText>
                <View style={styles.mentalMetricGrid}>
                  <MentalMetric label="Ánimo" value={statsSummary.weekly.estadoAnimo ?? 'N/D'} color={getScoreColor(statsSummary.weekly.estadoAnimo)} />
                  <MentalMetric label="Estrés" value={statsSummary.weekly.estres ?? 'N/D'} color={getScoreColor(statsSummary.weekly.estres, true)} />
                  <MentalMetric label="Ansiedad" value={statsSummary.weekly.ansiedad ?? 'N/D'} color={getScoreColor(statsSummary.weekly.ansiedad, true)} />
                  <MentalMetric label="Sueño" value={statsSummary.weekly.horasSueno ?? 'N/D'} suffix={statsSummary.weekly.horasSueno !== null ? ' h' : ''} color="#29B6FF" />
                </View>
              </>
            ) : null}

            {statsSummary.monthly ? (
              <View style={styles.monthlyBox}>
                <Ionicons name="trending-up-outline" size={20} color="#38E28E" />
                <View style={styles.monthlyCopy}>
                  <AppText style={styles.monthlyTitle}>Tendencia de {statsSummary.monthly.mes}</AppText>
                  <AppText style={styles.monthlyText}>
                    {statsSummary.monthly.registros} registros · ánimo {statsSummary.monthly.estadoAnimoPromedio ?? 'N/D'} · estrés {statsSummary.monthly.estresPromedio ?? 'N/D'} · ansiedad {statsSummary.monthly.ansiedadPromedio ?? 'N/D'}
                  </AppText>
                </View>
              </View>
            ) : null}

            {dataError ? <AppText style={styles.errorText}>{dataError}</AppText> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Alertas</AppText>
          <AppText style={styles.sectionSubtitle}>Mensajes que merecen seguimiento cercano.</AppText>
        </View>
        {alerts?.alertas?.length ? (
          alerts.alertas.map((item, index) => (
            <View
              key={`${item.tipo}-${item.fecha}-${index}`}
              style={[
                styles.alertItem,
                item.severidad === 'alta' ? styles.alertHigh : styles.alertMedium,
              ]}
            >
              <View style={styles.alertIcon}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={item.severidad === 'alta' ? '#FF4D73' : '#F9A826'}
                />
              </View>
              <View style={styles.alertCopy}>
                <View style={styles.alertHeader}>
                  <AppText style={styles.alertTitle}>
                    {formatAlertTitle(item.tipo)}
                  </AppText>
                  <AppText style={styles.alertDate}>{formatDate(item.fecha)}</AppText>
                </View>
                <AppText style={styles.alertText}>{item.detalle}</AppText>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.healthyState}>
            <Ionicons name="checkmark-circle-outline" size={23} color="#38E28E" />
            <AppText style={styles.healthyText}>No hay alertas que requieran atención por ahora.</AppText>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Historial reciente</AppText>
          <AppText style={styles.sectionSubtitle}>Últimas entradas registradas para este paciente.</AppText>
        </View>
        {historial?.historialPorFecha?.length ? (
          historial.historialPorFecha.slice(0, 6).map((item) => (
            <View key={item.saludmentalId} style={styles.listItem}>
              <AppText style={styles.itemTitle}>{formatDate(item.fecha)}</AppText>
              <View style={styles.historyScoreRow}>
                <HistoryScore label="Ánimo" value={item.estadoAnimo} color={getScoreColor(item.estadoAnimo)} />
                <HistoryScore label="Estrés" value={item.estres} color={getScoreColor(item.estres, true)} />
                <HistoryScore label="Ansiedad" value={item.ansiedad} color={getScoreColor(item.ansiedad, true)} />
              </View>
              <AppText style={styles.itemText}>
                Sueño: {item.horasSueno ?? 'N/D'} h · Descanso: {item.descansoHoras ?? 'N/D'} h
              </AppText>
              <AppText style={styles.itemText}>
                Ejercicio: {item.ejercicioMinutos ?? 'N/D'} min · Hidratación: {item.hidratacionLitros ?? 'N/D'} L
              </AppText>
              <AppText style={styles.itemText}>
                Tiempo social: {item.tiempoSocialMinutos ?? 'N/D'} min · Pausas digitales: {item.pausasDigitales ?? 'N/D'}
              </AppText>
              {item.notaPersonal ? (
                <AppText style={styles.itemText}>Nota: {item.notaPersonal}</AppText>
              ) : null}
            </View>
          ))
        ) : (
          <AppText style={styles.emptyText}>Todavía no hay registros para este paciente.</AppText>
        )}
      </View>
    </ScrollView>
  );
}

function MentalMetric({
  label,
  value,
  suffix = '',
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) {
  return (
    <View style={styles.mentalMetric}>
      <View style={[styles.mentalMetricAccent, { backgroundColor: color }]} />
      <AppText style={styles.mentalMetricValue}>{String(value)}{suffix}</AppText>
      <AppText style={styles.mentalMetricLabel}>{label}</AppText>
    </View>
  );
}

function HistoryScore({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.historyScore, { borderColor: `${color}55`, backgroundColor: `${color}12` }]}>
      <AppText style={[styles.historyScoreValue, { color }]}>{value}</AppText>
      <AppText style={styles.historyScoreLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: '#0A1628',
    gap: 16,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    minHeight: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#132B48',
  },
  hero: {
    backgroundColor: '#182A44',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27496D',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#A78BFA18',
    borderWidth: 1,
    borderColor: '#A78BFA55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  heroEyebrow: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  heroTitle: {
    color: '#F4F8FF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  heroText: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  heroAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  heroActionText: {
    color: '#071120',
    fontSize: 12,
    fontWeight: '900',
  },
  patientSelectorCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientSelectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#A78BFA18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientSelectorCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldEyebrow: {
    color: '#9FB3C8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: '#071120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 14,
    gap: 10,
  },
  formSectionTitle: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '800',
  },
  formToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  formToggleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#A78BFA18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formToggleCopy: {
    flex: 1,
  },
  formCollapsedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B3355',
    padding: 12,
  },
  formCollapsedText: {
    color: '#9FB3C8',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  scaleHint: {
    color: '#9FB3C8',
    fontSize: 12,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldGroupHalf: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    gap: 8,
  },
  fieldLabel: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scorePillText: {
    color: '#071120',
    fontSize: 11,
    fontWeight: '800',
  },
  pickerWrapper: {
    minHeight: 48,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#1B3355',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#071120',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#1B3355',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F4F8FF',
  },
  textArea: {
    minHeight: 110,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#C9D7E8',
    marginTop: 8,
  },
  emptyText: {
    color: '#C9D7E8',
    lineHeight: 20,
  },
  errorText: {
    color: '#FF4D73',
    lineHeight: 20,
  },
  latestRecordBox: {
    backgroundColor: '#071120',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 14,
    gap: 12,
  },
  latestRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestRecordEyebrow: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  latestRecordTitle: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordBadge: {
    minWidth: 64,
    borderRadius: 14,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#27496D',
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  recordBadgeValue: {
    color: '#F4F8FF',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },
  recordBadgeLabel: {
    color: '#9FB3C8',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subsectionTitle: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  mentalMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  mentalMetric: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
    minHeight: 80,
    backgroundColor: '#132238',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B3355',
    padding: 11,
  },
  mentalMetricAccent: {
    width: 22,
    height: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  mentalMetricValue: {
    color: '#F4F8FF',
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900',
  },
  mentalMetricLabel: {
    color: '#9FB3C8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  monthlyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#38E28E0D',
    borderWidth: 1,
    borderColor: '#38E28E45',
    borderRadius: 15,
    padding: 13,
  },
  monthlyCopy: {
    flex: 1,
  },
  monthlyTitle: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '800',
  },
  monthlyText: {
    color: '#C9D7E8',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },
  alertHigh: {
    borderColor: '#FF4D7355',
    backgroundColor: '#FF4D7312',
  },
  alertMedium: {
    borderColor: '#F9A82655',
    backgroundColor: '#F9A82612',
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#071120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertTitle: {
    color: '#F4F8FF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  alertDate: {
    color: '#9FB3C8',
    fontSize: 10,
  },
  alertText: {
    color: '#C9D7E8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  healthyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#38E28E0D',
    borderWidth: 1,
    borderColor: '#38E28E45',
    borderRadius: 14,
    padding: 13,
  },
  healthyText: {
    color: '#C9D7E8',
    fontSize: 12,
    flex: 1,
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    backgroundColor: '#071120',
  },
  historyScoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginVertical: 3,
  },
  historyScore: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  historyScoreValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  historyScoreLabel: {
    color: '#C9D7E8',
    fontSize: 10,
  },
  itemTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
  },
  itemText: {
    color: '#C9D7E8',
    lineHeight: 19,
  },
});
