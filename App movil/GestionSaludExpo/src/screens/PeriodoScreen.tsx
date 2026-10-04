/**
 * @file App movil/GestionSaludExpo/src/screens/PeriodoScreen.tsx
 * @description TypeScript module implementation.
 */

import { RecordActions } from '../components/RecordActions';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { AppColors, useAppColors } from '../theme/useAppColors';
import NanoSaludFemenina from '../svg/Nano salud femenina.svg';

type PeriodoRecord = {
  periodoId: number;
  pacienteId: number;
  fechaInicio: string;
  fechaFin: string | null;
  duracionDias: number | null;
  cicloDias: number | null;
  flujo: string | null;
  dolor: string | null;
  sintomas: string[];
  observaciones: string | null;
};

type PeriodoHistorial = {
  pacienteId: number;
  totalRegistros: number;
  promedioDuracionDias: number | null;
  promedioCicloDias: number | null;
  ultimoPeriodo: PeriodoRecord | null;
  registros: PeriodoRecord[];
};

type PeriodoPrediction = {
  confianza?: string | null;
  proximoPeriodo?: {
    fechaInicio: string;
    fechaFin: string;
    duracionDias: number;
    cicloDias: number;
  } | null;
  ventanaFertil?: {
    inicio: string;
    fin: string;
  } | null;
  ovulacionEstimada?: string | null;
};

const today = () => toLocalDateOnlyString();

const dateFromToday = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toLocalDateOnlyString(date);
};

type Props = NativeStackScreenProps<RootStackParamList, 'Periodo'>;

const dateRange = (startValue?: string | null, endValue?: string | null) => {
  const start = parseCalendarDate(startValue);
  const end = parseCalendarDate(endValue ?? startValue);
  if (!start || !end || end < start) return [];

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < 40) {
    dates.push(toLocalDateOnlyString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const shiftDate = (value: string, days: number) => {
  const date = parseCalendarDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toLocalDateOnlyString(date);
};

const periodEndDate = (record: PeriodoRecord) => {
  if (record.fechaFin) return record.fechaFin;
  const start = parseCalendarDate(record.fechaInicio);
  if (!start) return record.fechaInicio;
  start.setDate(start.getDate() + Math.max((record.duracionDias ?? 1) - 1, 0));
  return toLocalDateOnlyString(start);
};

const createDemoData = (patientId: number): {
  historial: PeriodoHistorial;
  prediction: PeriodoPrediction;
} => {
  const registros: PeriodoRecord[] = [
    {
      periodoId: -1,
      pacienteId: patientId,
      fechaInicio: dateFromToday(-14),
      fechaFin: dateFromToday(-10),
      duracionDias: 5,
      cicloDias: 28,
      flujo: 'moderado',
      dolor: 'leve',
      sintomas: ['cólicos leves', 'cansancio'],
      observaciones: 'Registro de demostración',
    },
    {
      periodoId: -2,
      pacienteId: patientId,
      fechaInicio: dateFromToday(-42),
      fechaFin: dateFromToday(-38),
      duracionDias: 5,
      cicloDias: 28,
      flujo: 'moderado',
      dolor: 'moderado',
      sintomas: ['dolor lumbar', 'cambios de ánimo'],
      observaciones: 'Registro de demostración',
    },
    {
      periodoId: -3,
      pacienteId: patientId,
      fechaInicio: dateFromToday(-70),
      fechaFin: dateFromToday(-66),
      duracionDias: 5,
      cicloDias: 28,
      flujo: 'leve',
      dolor: 'leve',
      sintomas: ['sensibilidad'],
      observaciones: 'Registro de demostración',
    },
  ];

  return {
    historial: {
      pacienteId: patientId,
      totalRegistros: registros.length,
      promedioDuracionDias: 5,
      promedioCicloDias: 28,
      ultimoPeriodo: registros[0],
      registros,
    },
    prediction: {
      confianza: 'demo',
      proximoPeriodo: {
        fechaInicio: dateFromToday(14),
        fechaFin: dateFromToday(18),
        duracionDias: 5,
        cicloDias: 28,
      },
      ventanaFertil: {
        inicio: dateFromToday(0),
        fin: dateFromToday(5),
      },
      ovulacionEstimada: dateFromToday(4),
    },
  };
};

const normalizeSexo = (value?: string | null) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
};

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

const formatEnum = (value?: string | null) => {
  if (!value) return 'No registrado';
  return value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
};

export function PeriodoScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const isCalendarWide = width >= 900;

  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? colors.background : colors.text;
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historial, setHistorial] = useState<PeriodoHistorial | null>(null);
  const [prediction, setPrediction] = useState<PeriodoPrediction | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoVisible, setDemoVisible] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fechaInicio: today(),
    fechaFin: '',
    duracionDias: '',
    cicloDias: '',
    flujo: 'moderado',
    dolor: 'leve',
    sintomas: '',
    observaciones: '',
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
      const femalePatients = items.filter((item) => normalizeSexo(item.sexo) === 'F');

      setPatients(femalePatients);
      const defaultPatient = femalePatients[0]?.pacienteId
        ? String(femalePatients[0].pacienteId)
        : '';
      setSelectedPatientId((prev) =>
        femalePatients.some((patient) => String(patient.pacienteId) === prev)
          ? prev
          : defaultPatient,
      );
      setForm((prev) => ({
        ...prev,
        pacienteId: femalePatients.some(
          (patient) => String(patient.pacienteId) === prev.pacienteId,
        )
          ? prev.pacienteId
          : defaultPatient,
      }));
    } catch (error) {
      setPatientError(
        error instanceof Error ? error.message : 'No se pudieron cargar las pacientes',
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const loadData = useCallback(
    async (patientId: string, useRefresh = false) => {
      if (!patientId || !token) {
        setHistorial(null);
        setPrediction(null);
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
          `${API_URL}/periodo/paciente/${patientId}/historial`,
          { headers: authHeaders },
        );
        const historialBody = await historialResponse.json().catch(() => null);

        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }

        setHistorial(historialBody);

        const predictionResponse = await fetch(
          `${API_URL}/periodo/paciente/${patientId}/prediccion`,
          { headers: authHeaders },
        );
        const predictionBody = await predictionResponse.json().catch(() => null);

        if (predictionResponse.ok) {
          setPrediction(predictionBody);
        } else {
          setPrediction(null);
        }
      } catch (error) {
        setDataError(
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del módulo',
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
    if (!patients.length) {
      Alert.alert(
        'Módulo bloqueado',
        'Debes tener al menos una paciente femenina vinculada para usar este módulo.',
      );
      return;
    }

    if (!form.pacienteId || !form.fechaInicio) {
      Alert.alert('Campos requeridos', 'Paciente y fecha de inicio son obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
          pacienteId: Number(form.pacienteId),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || undefined,
          duracionDias: form.duracionDias ? Number(form.duracionDias) : undefined,
          cicloDias: form.cicloDias ? Number(form.cicloDias) : undefined,
          flujo: form.flujo || undefined,
          dolor: form.dolor || undefined,
          sintomas: form.sintomas
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          observaciones: form.observaciones || undefined,
          creadoPor: user?.username ?? undefined,
        };
      const result = await submitJsonWithOfflineFallback({ token, path: '/periodo', method: 'POST', body: payload, description: 'registrar período' });
      if (result.status === 'queued') Alert.alert('Guardado sin conexión', 'El período se sincronizará automáticamente al recuperar internet.');

      if (result.status === 'online') Alert.alert('Registro creado', 'El periodo se guardó correctamente');
      setForm((prev) => ({
        ...prev,
        fechaInicio: today(),
        fechaFin: '',
        duracionDias: '',
        cicloDias: '',
        flujo: 'moderado',
        dolor: 'leve',
        sintomas: '',
        observaciones: '',
      }));
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientLabel = useMemo(
    () => patients.find((item) => String(item.pacienteId) === selectedPatientId)?.displayName,
    [patients, selectedPatientId],
  );
  const hasFemalePatients = patients.length > 0;
  const demoData = useMemo(
    () => createDemoData(Number(selectedPatientId) || 0),
    [selectedPatientId],
  );
  const hasDemoFallback = Boolean(
    selectedPatientId &&
      historial &&
      historial.registros.length === 0 &&
      !dataError,
  );
  const showingDemoData = hasDemoFallback && demoVisible;
  const displayedHistorial = showingDemoData ? demoData.historial : historial;
  const displayedPrediction = showingDemoData ? demoData.prediction : prediction;
  const calendarData = useMemo(() => {
    type CalendarMark = {
      customStyles: {
        container: {
          backgroundColor: string;
          borderRadius: number;
          borderWidth?: number;
          borderColor?: string;
        };
        text: { color: string; fontWeight: '800' };
      };
    };
    type StageInfo = { label: string; color: string; priority: number };

    const marks: Record<string, CalendarMark> = {};
    const stages: Record<string, StageInfo> = {};
    const addStage = (date: string, stage: StageInfo, textColor = '#FFFFFF') => {
      if ((stages[date]?.priority ?? -1) > stage.priority) return;
      stages[date] = stage;
      marks[date] = {
        customStyles: {
          container: {
            backgroundColor: stage.color,
            borderRadius: 10,
            ...(date === today()
              ? { borderWidth: 2, borderColor: colors.text }
              : {}),
          },
          text: { color: textColor, fontWeight: '800' },
        },
      };
    };

    displayedHistorial?.registros.forEach((record) => {
      dateRange(record.fechaInicio, periodEndDate(record)).forEach((date) =>
        addStage(date, { label: 'Menstruación', color: colors.accent, priority: 5 }),
      );
    });

    const nextPeriod = displayedPrediction?.proximoPeriodo;
    if (nextPeriod) {
      dateRange(nextPeriod.fechaInicio, nextPeriod.fechaFin).forEach((date) =>
        addStage(date, { label: 'Próximo período', color: '#FDBA74', priority: 4 }, '#172B4D'),
      );
    }

    const fertileWindow = displayedPrediction?.ventanaFertil;
    if (fertileWindow) {
      dateRange(fertileWindow.inicio, fertileWindow.fin).forEach((date) =>
        addStage(date, { label: 'Ventana fértil', color: colors.success, priority: 3 }),
      );
    }

    const latestPeriod = displayedHistorial?.registros[0];
    if (latestPeriod && fertileWindow) {
      dateRange(
        shiftDate(periodEndDate(latestPeriod), 1),
        shiftDate(fertileWindow.inicio, -1),
      ).forEach((date) =>
        addStage(date, { label: 'Fase folicular', color: '#8B5CF6', priority: 1 }),
      );
    }

    if (fertileWindow && nextPeriod) {
      dateRange(
        shiftDate(fertileWindow.fin, 1),
        shiftDate(nextPeriod.fechaInicio, -1),
      ).forEach((date) =>
        addStage(date, { label: 'Fase lútea', color: '#F59E0B', priority: 2 }, '#172B4D'),
      );
    }

    if (displayedPrediction?.ovulacionEstimada) {
      addStage(
        displayedPrediction.ovulacionEstimada,
        { label: 'Ovulación estimada', color: colors.info, priority: 6 },
      );
    }

    return { marks, todayStage: stages[today()] ?? null };
  }, [colors.accent, colors.info, colors.success, colors.text, displayedHistorial, displayedPrediction]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(selectedPatientId, true)}
          tintColor={colors.text}
        />
      }
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('MenuPrincipal')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Volver al menú principal"
      >
        <Ionicons name="arrow-back" size={19} color={colors.text} />
        <AppText style={styles.backButtonText}>Volver al menú</AppText>
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <NanoSaludFemenina width={44} height={44} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroEyebrow}>Bienestar femenino</AppText>
            <AppText style={styles.heroTitle}>Salud Femenina</AppText>
          </View>
        </View>
        <AppText style={styles.heroText}>
          Registra ciclos, síntomas y revisa la predicción del siguiente periodo.
        </AppText>
        <View style={styles.heroChips}>
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <AppText style={styles.chipText}>Ciclos</AppText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="pulse-outline" size={14} color={colors.info} />
            <AppText style={styles.chipText}>Síntomas</AppText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="analytics-outline" size={14} color={colors.success} />
            <AppText style={styles.chipText}>Predicción</AppText>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText style={styles.sectionLabel}>Acceso</AppText>
            <AppText style={styles.sectionTitle}>Activación automática</AppText>
          </View>
          <View
            style={[
              styles.statusBadge,
              hasFemalePatients ? styles.statusBadgeSuccess : styles.statusBadgeLocked,
            ]}
          >
            <Ionicons
              name={hasFemalePatients ? 'checkmark-circle-outline' : 'information-circle-outline'}
              size={14}
              color={hasFemalePatients ? colors.success : colors.accent}
            />
            <AppText
              style={[
                styles.statusBadgeText,
                hasFemalePatients ? styles.statusBadgeTextSuccess : styles.statusBadgeTextLocked,
              ]}
            >
              {hasFemalePatients ? 'Activo' : 'No disponible'}
            </AppText>
          </View>
        </View>
        {!hasFemalePatients ? (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <AppText style={styles.errorText}>
              Este módulo se habilita cuando existe una persona vinculada con género femenino.
            </AppText>
          </View>
        ) : (
          <AppText style={styles.successText}>
            Acceso habilitado automáticamente para {selectedPatientLabel ?? 'la paciente vinculada'}.
          </AppText>
        )}
      </View>

      {!hasFemalePatients ? null : (
        <>
      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Paciente</AppText>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : patients.length === 0 ? (
          <AppText style={styles.emptyText}>
            No hay pacientes femeninas vinculadas para este módulo.
          </AppText>
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
                      ? `${patient.displayName} · ${patient.parentesco}`
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

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText style={styles.sectionLabel}>Seguimiento mensual</AppText>
            <AppText style={styles.sectionTitle}>Calendario del ciclo</AppText>
          </View>
          {hasDemoFallback ? (
            <TouchableOpacity
              style={styles.demoToggle}
              onPress={() => setDemoVisible((current) => !current)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={showingDemoData ? 'Ocultar datos de demostración' : 'Mostrar datos de demostración'}
            >
              <Ionicons
                name={showingDemoData ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={colors.info}
              />
              <AppText style={styles.demoToggleText}>
                {showingDemoData ? 'Ocultar demo' : 'Mostrar demo'}
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
        {calendarData.todayStage ? (
          <View style={[styles.currentStage, { borderColor: calendarData.todayStage.color }]}>
            <View style={[styles.currentStageIcon, { backgroundColor: calendarData.todayStage.color }]}>
              <Ionicons name="today-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.currentStageCopy}>
              <AppText style={styles.currentStageLabel}>Etapa de hoy</AppText>
              <AppText style={styles.currentStageValue}>{calendarData.todayStage.label}</AppText>
            </View>
          </View>
        ) : null}
        <View style={[styles.calendarLayout, isCalendarWide && styles.calendarLayoutWide]}>
          <View style={styles.calendarShell}>
            <Calendar
              key={`${colors.mode}-${selectedPatientId}`}
              initialDate={today()}
              markingType="custom"
              markedDates={calendarData.marks}
              enableSwipeMonths
              firstDay={1}
              theme={{
                calendarBackground: colors.surface,
                dayTextColor: colors.text,
                todayTextColor: colors.info,
                arrowColor: colors.accent,
                monthTextColor: colors.text,
                textSectionTitleColor: colors.textMuted,
                textDisabledColor: colors.border,
                textMonthFontSize: 17,
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '700',
                textDayFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
          <View style={[styles.calendarLegend, isCalendarWide && styles.calendarLegendWide]}>
            {[
              ['Menstruación registrada', colors.accent, 'Fechas guardadas por la usuaria'],
              ['Fase folicular', '#8B5CF6', 'Etapa posterior al período'],
              ['Ventana fértil', colors.success, 'Días con mayor fertilidad estimada'],
              ['Ovulación estimada', colors.info, 'Día aproximado de ovulación'],
              ['Fase lútea', '#F59E0B', 'Etapa previa al siguiente período'],
              ['Próximo período', '#FDBA74', 'Fechas calculadas según el historial'],
            ].map(([label, color, description]) => (
              <View key={label} style={[styles.legendItem, { borderColor: color }]}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <View style={styles.legendCopy}>
                  <AppText style={styles.legendTitle}>{label}</AppText>
                  <AppText style={styles.legendText}>{description}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Nuevo registro</AppText>
        <AppTextInput
          style={styles.input}
          value={form.fechaInicio}
          onChangeText={(value) => handleChange('fechaInicio', value)}
          placeholder="Fecha inicio (YYYY-MM-DD)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <AppTextInput
          style={styles.input}
          value={form.fechaFin}
          onChangeText={(value) => handleChange('fechaFin', value)}
          placeholder="Fecha fin (opcional)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <AppTextInput
            style={[styles.input, styles.halfInput]}
            value={form.duracionDias}
            onChangeText={(value) => handleChange('duracionDias', value)}
            placeholder="Duración"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <AppTextInput
            style={[styles.input, styles.halfInput]}
            value={form.cicloDias}
            onChangeText={(value) => handleChange('cicloDias', value)}
            placeholder="Ciclo"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.flujo} onValueChange={(value) => handleChange('flujo', String(value))}>
              <Picker.Item label="Flujo leve" value="leve" color={pickerItemColor} />
              <Picker.Item label="Flujo moderado" value="moderado" color={pickerItemColor} />
              <Picker.Item label="Flujo abundante" value="abundante" color={pickerItemColor} />
            </Picker>
          </View>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.dolor} onValueChange={(value) => handleChange('dolor', String(value))}>
              <Picker.Item label="Dolor leve" value="leve" color={pickerItemColor} />
              <Picker.Item label="Dolor moderado" value="moderado" color={pickerItemColor} />
              <Picker.Item label="Dolor intenso" value="intenso" color={pickerItemColor} />
              <Picker.Item label="Sin dolor" value="sin_dolor" color={pickerItemColor} />
            </Picker>
          </View>
        </View>
        <AppTextInput
          style={styles.input}
          value={form.sintomas}
          onChangeText={(value) => handleChange('sintomas', value)}
          placeholder="Síntomas separados por coma"
          placeholderTextColor={colors.textMuted}
        />
        <AppTextInput
          style={[styles.input, styles.textArea]}
          value={form.observaciones}
          onChangeText={(value) => handleChange('observaciones', value)}
          placeholder="Observaciones"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.onAccent} />
              <AppText style={styles.primaryBtnText}>Guardar periodo</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Resumen</AppText>
          {showingDemoData ? (
            <View style={styles.demoBadge}>
              <Ionicons name="sparkles-outline" size={13} color={colors.info} />
              <AppText style={styles.demoBadgeText}>Demo</AppText>
            </View>
          ) : null}
        </View>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <AppText style={styles.loadingText}>Cargando historial...</AppText>
          </View>
        ) : !selectedPatientId ? (
          <AppText style={styles.emptyText}>Selecciona una paciente para ver información.</AppText>
        ) : (
          <>
            <AppText style={styles.metricText}>Paciente: {selectedPatientLabel ?? `#${selectedPatientId}`}</AppText>
            <AppText style={styles.metricText}>
              Total de registros: {displayedHistorial?.totalRegistros ?? 0}
            </AppText>
            <AppText style={styles.metricText}>
              Promedio de duración: {displayedHistorial?.promedioDuracionDias ?? 'Sin dato'} días
            </AppText>
            <AppText style={styles.metricText}>
              Promedio de ciclo: {displayedHistorial?.promedioCicloDias ?? 'Sin dato'} días
            </AppText>
            {showingDemoData ? (
              <View style={styles.demoNotice}>
                <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                <AppText style={styles.demoNoticeText}>
                  Información ilustrativa. Se reemplazará automáticamente al guardar el primer periodo.
                </AppText>
              </View>
            ) : null}
            {displayedPrediction?.proximoPeriodo ? (
              <View style={styles.highlightBox}>
                <AppText style={styles.highlightTitle}>Siguiente predicción</AppText>
                <AppText style={styles.highlightText}>
                  Inicio: {formatDate(displayedPrediction.proximoPeriodo.fechaInicio)}
                </AppText>
                <AppText style={styles.highlightText}>
                  Fin: {formatDate(displayedPrediction.proximoPeriodo.fechaFin)}
                </AppText>
                <AppText style={styles.highlightText}>
                  Ovulación estimada: {formatDate(displayedPrediction.ovulacionEstimada)}
                </AppText>
                {displayedPrediction.ventanaFertil ? (
                  <AppText style={styles.highlightText}>
                    Ventana fértil: {formatDate(displayedPrediction.ventanaFertil.inicio)} al{' '}
                    {formatDate(displayedPrediction.ventanaFertil.fin)}
                  </AppText>
                ) : null}
              </View>
            ) : null}
            {dataError ? <AppText style={styles.errorText}>{dataError}</AppText> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Historial reciente</AppText>
        {displayedHistorial?.registros?.length ? (
          displayedHistorial.registros.slice(0, 6).map((item) => (
<View key={item.periodoId} style={styles.listItem}>
{showingDemoData ? null : <RecordActions resource="periodo" recordId={item.periodoId} onChanged={() => loadData(selectedPatientId, true)} />}
              <AppText style={styles.itemTitle}>
                {formatDate(item.fechaInicio)} {item.fechaFin ? `- ${formatDate(item.fechaFin)}` : ''}
              </AppText>
              <AppText style={styles.itemText}>
                Flujo: {formatEnum(item.flujo)} · Dolor: {formatEnum(item.dolor)}
              </AppText>
              <AppText style={styles.itemText}>
                Duración: {item.duracionDias ?? 'N/D'} días · Ciclo: {item.cicloDias ?? 'N/D'} días
              </AppText>
              {item.sintomas?.length ? (
                <AppText style={styles.itemText}>Síntomas: {item.sintomas.join(', ')}</AppText>
              ) : null}
            </View>
          ))
        ) : (
          <AppText style={styles.emptyText}>Todavía no hay registros para esta paciente.</AppText>
        )}
      </View>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: 'transparent',
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, 'CC'),
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, '65'),
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  heroText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colorAlpha(colors.backgroundMuted, 'C8'),
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colorAlpha(colors.border, '9A'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: colorAlpha(colors.success, '18'),
    borderColor: colorAlpha(colors.success, '6B'),
  },
  statusBadgeLocked: {
    backgroundColor: colorAlpha(colors.accent, '18'),
    borderColor: colorAlpha(colors.accent, '6B'),
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadgeTextSuccess: {
    color: colors.success,
  },
  statusBadgeTextLocked: {
    color: colors.accent,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colorAlpha(colors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.info, '55'),
  },
  demoBadgeText: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: colorAlpha(colors.info, '12'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.info, '55'),
  },
  demoToggleText: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colorAlpha(colors.info, '12'),
  },
  demoNoticeText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  currentStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.surfaceStrong,
  },
  currentStageIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStageCopy: {
    gap: 1,
  },
  currentStageLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  currentStageValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  calendarLayout: {
    gap: 14,
  },
  calendarLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  calendarShell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    padding: 10,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendar: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarLegendWide: {
    width: 320,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 58,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surfaceStrong,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 4,
    marginTop: 3,
  },
  legendCopy: {
    flex: 1,
    gap: 2,
  },
  legendTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colorAlpha(colors.accent, '12'),
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 92,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.onAccent,
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
    color: colors.textSoft,
    marginTop: 8,
  },
  emptyText: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  errorText: {
    color: colors.accent,
    flex: 1,
    lineHeight: 20,
    fontWeight: '700',
  },
  successText: {
    color: colors.success,
    lineHeight: 20,
    fontWeight: '700',
  },
  helperText: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  metricText: {
    color: colors.text,
    fontSize: 14,
  },
  highlightBox: {
    backgroundColor: colorAlpha(colors.accent, '18'),
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, '4D'),
  },
  highlightTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  highlightText: {
    color: colors.accent,
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: colorAlpha(colors.backgroundMuted, '88'),
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  itemText: {
    color: colors.textSoft,
  },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colorAlpha(colors.backgroundMuted, '80'),
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
