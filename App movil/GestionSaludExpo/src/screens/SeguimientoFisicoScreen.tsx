import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { AppText } from '../components/AppText';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { RootStackParamList } from '../navigation/types';
import { toLocalDateOnlyString } from '../utils/localDate';

type SeguimientoRecord = {
  seguimientoFisicoId: number;
  pacienteId: number;
  fecha: string;
  peso: number | null;
  minutosEjercicio: number | null;
  tipoEjercicio: string | null;
  intensidad: string | null;
  pasos: number | null;
  caloriasQuemadas: number | null;
  distanciaKm: number | null;
  notas: string | null;
};

type SeguimientoHistorial = {
  pacienteId: number;
  totalRegistros: number;
  registros: SeguimientoRecord[];
};

type SeguimientoResumen = {
  totalRegistros: number;
  ultimoRegistro: SeguimientoRecord | null;
  peso?: {
    inicial: number | null;
    actual: number | null;
    cambio: number | null;
  };
  ejercicio?: {
    minutosTotales: number | null;
    minutosPromedio: number | null;
    caloriasTotales: number | null;
    pasosPromedio: number | null;
  };
};

type PesoProgress = {
  pacienteId: number;
  puntos: Array<{
    fecha: string;
    peso: number;
  }>;
};

type AchievementCategory = 'constancia' | 'actividad' | 'seguimiento';

type AchievementStatus = {
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number;
  unit: string;
  unlocked: boolean;
  progress: number;
  progressPercent: number;
  progressLabel: string;
};

type AchievementSummary = {
  pacienteId: number;
  total: number;
  desbloqueados: number;
  progresoResumen: {
    totalRegistros: number;
    diasRegistrados: number;
    rachaActual: number;
    rachaMaxima: number;
    minutosMaximos: number;
    pasosMaximos: number;
    distanciaAcumulada: number;
    tiposEjercicioUnicos: number;
    sesionesIntensas: number;
    registrosCompletos: number;
    registrosConPeso: number;
  };
  logros: AchievementStatus[];
  proximos: AchievementStatus[];
};

type CalendarMarks = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
};

type TrendRangeKey = '7d' | '15d' | '1m' | '6m' | '1y';
type Props = NativeStackScreenProps<RootStackParamList, 'SeguimientoFisico'>;

const intensidadOptions = [
  { label: 'Sin definir', value: '' },
  { label: 'Leve', value: 'leve' },
  { label: 'Moderada', value: 'moderada' },
  { label: 'Intensa', value: 'intensa' },
];

const trendRangeOptions: Array<{ label: string; value: TrendRangeKey }> = [
  { label: '7 días', value: '7d' },
  { label: 'Quincenal', value: '15d' },
  { label: 'Mensual', value: '1m' },
  { label: 'Semestral', value: '6m' },
  { label: 'Anual', value: '1y' },
];

const CHART_CANVAS_HEIGHT = 210;
const CHART_PLOT_TOP = 18;
const CHART_PLOT_HEIGHT = 128;
const CHART_PLOT_BOTTOM = CHART_PLOT_TOP + CHART_PLOT_HEIGHT;
const CHART_SIDE_PADDING = 18;
const CHART_POINT_GAP = 58;
const CHART_LINE_THICKNESS = 3;

const today = () => toLocalDateOnlyString();

const parseDateOnly = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const addYears = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + amount);
  return next;
};

const buildDemoRecords = (pacienteId: number, endDateValue: string): SeguimientoRecord[] => {
  const endDate = parseDateOnly(endDateValue) ?? new Date();
  const weights = [81.6, 81.3, 81.4, 81, 80.8, 80.9, 80.5, 80.3, 80.4, 80, 79.8, 79.9, 79.5, 79.3, 79.1];
  const calories = [180, 240, 210, 320, 275, 360, 225, 410, 350, 290, 430, 380, 470, 420, 510];
  const steps = [5200, 6800, 6100, 8400, 7300, 9100, 6400, 10200, 8800, 7600, 11000, 9400, 12100, 10500, 12800];

  return weights.map((peso, index) => ({
    seguimientoFisicoId: -(index + 1),
    pacienteId,
    fecha: toLocalDateOnlyString(addDays(endDate, index - (weights.length - 1))),
    peso,
    minutosEjercicio: 25 + (index % 5) * 8,
    tipoEjercicio: index % 3 === 0 ? 'Caminata' : index % 3 === 1 ? 'Fuerza' : 'Bicicleta',
    intensidad: index % 4 === 0 ? 'intensa' : index % 2 === 0 ? 'moderada' : 'leve',
    pasos: steps[index] ?? null,
    caloriasQuemadas: calories[index] ?? null,
    distanciaKm: Math.round(((steps[index] ?? 0) * 0.00072) * 100) / 100,
    notas: 'Dato temporal de demostración',
  }));
};

const getTrendWindowStart = (endDate: Date, range: TrendRangeKey) => {
  if (range === '7d') return addDays(endDate, -6);
  if (range === '15d') return addDays(endDate, -14);
  if (range === '1m') return addMonths(endDate, -1);
  if (range === '6m') return addMonths(endDate, -6);
  return addYears(endDate, -1);
};

const getTrendTickStep = (range: TrendRangeKey, total: number) => {
  if (total <= 8) return 1;
  if (range === '7d') return 1;
  if (range === '15d') return total <= 10 ? 1 : 2;
  if (range === '1m') return total <= 12 ? 1 : 4;
  if (range === '6m') return total <= 18 ? 2 : 14;
  return total <= 24 ? 3 : 30;
};

const shouldShowTrendMarkerLabel = (index: number, total: number, range: TrendRangeKey) => {
  if (total <= 8) return true;
  if (index === 0 || index === total - 1) return true;
  const step = getTrendTickStep(range, total);
  return index % step === 0;
};

const formatTrendTick = (value: string, range: TrendRangeKey) => {
  const parsed = parseDateOnly(value);
  if (!parsed) return value;

  if (range === '6m' || range === '1y') {
    return parsed.toLocaleDateString('es-NI', {
      month: 'short',
      year: '2-digit',
    });
  }

  return parsed.toLocaleDateString('es-NI', {
    day: '2-digit',
    month: '2-digit',
  });
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '--';
  const parsed = parseDateOnly(value);
  if (!parsed) return value.slice(5);
  return parsed.toLocaleDateString('es-NI', {
    day: '2-digit',
    month: '2-digit',
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseDateOnly(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatNumber = (value?: number | null, suffix = '') => {
  if (value === null || value === undefined) return 'N/D';
  return `${value}${suffix}`;
};

const formatAxisNumber = (value: number, suffix = '') => {
  const rounded = Math.round(value * 10) / 10;
  const label = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${label}${suffix}`;
};

const getIntensityRank = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'intensa') return 3;
  if (normalized === 'moderada') return 2;
  if (normalized === 'leve') return 1;
  return 0;
};

const getIntensityColor = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'intensa') return '#FF4D73';
  if (normalized === 'moderada') return '#F9A826';
  if (normalized === 'leve') return '#38E28E';
  return '#9FB3C8';
};

const getIntensityLabel = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'intensa') return 'Intensa';
  if (normalized === 'moderada') return 'Moderada';
  if (normalized === 'leve') return 'Leve';
  return 'Sin definir';
};

const getAchievementCategoryLabel = (value: AchievementCategory) => {
  if (value === 'constancia') return 'Constancia';
  if (value === 'actividad') return 'Actividad';
  return 'Seguimiento';
};

const getAchievementCategoryColor = (value: AchievementCategory) => {
  if (value === 'constancia') return '#29B6FF';
  if (value === 'actividad') return '#38E28E';
  return '#FF4D73';
};

export function SeguimientoFisicoScreen({ navigation }: Props) {
  const { token } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today());
  const [historial, setHistorial] = useState<SeguimientoHistorial | null>(null);
  const [resumen, setResumen] = useState<SeguimientoResumen | null>(null);
  const [pesoProgress, setPesoProgress] = useState<PesoProgress | null>(null);
  const [logros, setLogros] = useState<AchievementSummary | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trendRange, setTrendRange] = useState<TrendRangeKey>('7d');
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showPesoProgress, setShowPesoProgress] = useState(false);
  const [showHistorialReciente, setShowHistorialReciente] = useState(false);
  const [showDemoData, setShowDemoData] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

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
        setResumen(null);
        setPesoProgress(null);
        setLogros(null);
        return;
      }

      if (useRefresh) {
        setRefreshing(true);
      } else {
        setLoadingData(true);
      }
      setDataError(null);

      try {
        const [historialResponse, resumenResponse, pesoResponse, logrosResponse] = await Promise.all([
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/historial`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/resumen`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/progreso-peso`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/logros`, {
            headers: authHeaders,
          }),
        ]);

        const historialBody = await historialResponse.json().catch(() => null);
        const resumenBody = await resumenResponse.json().catch(() => null);
        const pesoBody = await pesoResponse.json().catch(() => null);
        const logrosBody = await logrosResponse.json().catch(() => null);

        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }

        setHistorial(historialBody);
        setResumen(resumenResponse.ok ? resumenBody : null);
        setPesoProgress(pesoResponse.ok ? pesoBody : null);
        setLogros(logrosResponse.ok ? logrosBody : null);
      } catch (error) {
        setDataError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos del modulo',
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

  useFocusEffect(
    useCallback(() => {
      if (selectedPatientId) {
        loadData(selectedPatientId, true);
      }
    }, [loadData, selectedPatientId]),
  );

  useEffect(() => {
    const availableDates = historial?.registros?.map((item) => item.fecha).filter(Boolean) ?? [];
    if (availableDates.length === 0) {
      return;
    }
    if (!selectedCalendarDate) {
      setSelectedCalendarDate(availableDates[availableDates.length - 1] ?? today());
    }
  }, [historial?.registros, selectedCalendarDate]);

  const markedDates = useMemo<CalendarMarks>(() => {
    const marks: CalendarMarks = {};
    (historial?.registros ?? []).forEach((record) => {
      const existing = marks[record.fecha] ?? {};
      const existingRank = getIntensityRank(
        existing.dotColor === '#FF4D73'
          ? 'intensa'
          : existing.dotColor === '#F9A826'
            ? 'moderada'
            : existing.dotColor === '#38E28E'
              ? 'leve'
              : null,
      );
      const currentRank = getIntensityRank(record.intensidad);
      marks[record.fecha] = {
        ...existing,
        marked: true,
        dotColor: currentRank >= existingRank ? getIntensityColor(record.intensidad) : existing.dotColor ?? '#29B6FF',
      };
    });
    if (selectedCalendarDate) {
      marks[selectedCalendarDate] = {
        ...(marks[selectedCalendarDate] ?? {}),
        selected: true,
        selectedColor: '#29B6FF',
        selectedTextColor: '#F4F8FF',
        marked: marks[selectedCalendarDate]?.marked ?? false,
        dotColor: marks[selectedCalendarDate]?.dotColor ?? '#29B6FF',
      };
    }
    return marks;
  }, [historial?.registros, selectedCalendarDate]);

  const selectedDayRecord = useMemo(() => {
    return (historial?.registros ?? []).find((item) => item.fecha === selectedCalendarDate) ?? null;
  }, [historial?.registros, selectedCalendarDate]);

  const unlockedAchievements = useMemo(() => {
    return (logros?.logros ?? []).filter((achievement) => achievement.unlocked);
  }, [logros?.logros]);

  const demoRecords = useMemo(() => {
    const newestDate = (historial?.registros ?? [])
      .map((item) => item.fecha)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right))
      .at(-1) ?? today();
    return buildDemoRecords(Number(selectedPatientId) || 0, newestDate);
  }, [historial?.registros, selectedPatientId]);

  const chartData = useMemo(() => {
    const source = showDemoData ? demoRecords : (historial?.registros ?? []);
    const sorted = source.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    const endDate = parseDateOnly(sorted[sorted.length - 1]?.fecha) ?? parseDateOnly(today());
    if (!endDate) {
      return sorted;
    }
    const startDate = getTrendWindowStart(endDate, trendRange);
    return sorted.filter((item) => {
      const itemDate = parseDateOnly(item.fecha);
      if (!itemDate) {
        return false;
      }
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [demoRecords, historial?.registros, showDemoData, trendRange]);

  const trendRangeLabel = useMemo(() => {
    return trendRangeOptions.find((option) => option.value === trendRange)?.label ?? '7 días';
  }, [trendRange]);

  const maxCalories = useMemo(() => {
    const values = chartData
      .map((item) => item.caloriasQuemadas ?? 0)
      .filter((value) => value > 0);
    return values.length ? Math.max(...values) : 0;
  }, [chartData]);

  const weightBounds = useMemo(() => {
    const values = chartData
      .map((item) => item.peso)
      .filter((value): value is number => value !== null && value !== undefined);
    if (!values.length) {
      return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = max === min ? Math.max(max * 0.02, 1) : Math.max((max - min) * 0.2, 0.5);
    const displayMin = Math.max(0, min - padding);
    const displayMax = max + padding;
    return {
      min,
      max,
      displayMin,
      displayMax,
      range: Math.max(displayMax - displayMin, 1),
    };
  }, [chartData]);

  const calorieBounds = useMemo(() => {
    if (maxCalories <= 0) {
      return null;
    }
    const displayMax = Math.max(Math.ceil(maxCalories * 1.15), 100);
    return {
      displayMin: 0,
      displayMax,
      range: displayMax,
    };
  }, [maxCalories]);

  const weightSeries = useMemo(() => {
    const total = chartData.length;
    return chartData.map((item, index) => ({
      ...item,
      x: CHART_SIDE_PADDING + index * CHART_POINT_GAP,
      y:
        typeof item.peso === 'number'
          ? weightBounds
            ? CHART_PLOT_BOTTOM -
              ((item.peso - weightBounds.displayMin) / weightBounds.range) * CHART_PLOT_HEIGHT
            : CHART_PLOT_BOTTOM
          : null,
      label: typeof item.peso === 'number' ? `${item.peso} kg` : 'N/D',
      showMarkerLabel: shouldShowTrendMarkerLabel(index, total, trendRange),
    }));
  }, [chartData, weightBounds]);

  const caloriesSeries = useMemo(() => {
    const total = chartData.length;
    return chartData.map((item, index) => {
      const calories = item.caloriasQuemadas ?? 0;
      return {
        ...item,
        x: CHART_SIDE_PADDING + index * CHART_POINT_GAP,
        y:
          calorieBounds && calories > 0
            ? CHART_PLOT_BOTTOM -
              ((calories - calorieBounds.displayMin) / calorieBounds.range) * CHART_PLOT_HEIGHT
            : null,
        label: formatNumber(item.caloriasQuemadas),
        showMarkerLabel: shouldShowTrendMarkerLabel(index, total, trendRange),
      };
    });
  }, [calorieBounds, chartData, trendRange]);

  const chartContentWidth = useMemo(() => {
    const minWidth = CHART_SIDE_PADDING * 2 + CHART_POINT_GAP;
    const dynamicWidth =
      CHART_SIDE_PADDING * 2 + Math.max((chartData.length - 1) * CHART_POINT_GAP, 0);
    return Math.max(dynamicWidth, minWidth, 260);
  }, [chartData.length]);

  const weightAxisTicks = useMemo(() => {
    if (!weightBounds) {
      return [];
    }
    const mid = weightBounds.displayMin + weightBounds.range / 2;
    return [
      formatAxisNumber(weightBounds.displayMax, ' kg'),
      formatAxisNumber(mid, ' kg'),
      formatAxisNumber(weightBounds.displayMin, ' kg'),
    ];
  }, [weightBounds]);

  const calorieAxisTicks = useMemo(() => {
    if (!calorieBounds) {
      return [];
    }
    return [
      formatAxisNumber(calorieBounds.displayMax),
      formatAxisNumber(calorieBounds.displayMax / 2),
      '0',
    ];
  }, [calorieBounds]);

  const handleCalendarDayPress = (day: DateData) => {
    setSelectedCalendarDate(day.dateString);
  };

  const buildLineStyle = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return {
      left: (startX + endX) / 2 - length / 2,
      top: (startY + endY) / 2 - CHART_LINE_THICKNESS / 2,
      width: length,
      transform: [{ rotate: `${angle}deg` }],
    } as const;
  };

  const toggleExpandableSection = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter((prev) => !prev);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
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
            <Ionicons name="fitness-outline" size={26} color="#29B6FF" />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroEyebrow}>BIENESTAR Y ACTIVIDAD</AppText>
            <AppText style={styles.heroTitle}>Seguimiento físico</AppText>
            <AppText style={styles.heroText}>
              Peso, ejercicio y actividad diaria en una sola vista.
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.heroAddButton}
            onPress={() =>
              navigation.navigate('SeguimientoFisicoForm', {
                patientId: selectedPatientId ? Number(selectedPatientId) : undefined,
              })
            }
          >
            <Ionicons name="add" size={20} color="#071120" />
            <AppText style={styles.heroAddButtonText}>Nuevo registro</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.patientSelectorCard}>
          <View style={styles.patientSelectorIcon}>
            <Ionicons name="person-outline" size={20} color="#29B6FF" />
          </View>
          <View style={styles.patientSelectorCopy}>
            <AppText style={styles.fieldEyebrow}>PACIENTE</AppText>
          {loadingPatients ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#29B6FF" />
              <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
            </View>
          ) : patients.length === 0 ? (
            <AppText style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</AppText>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPatientId}
                onValueChange={(value) => setSelectedPatientId(String(value))}
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
          <View style={styles.cardHeading}>
            <View>
              <AppText style={styles.sectionTitle}>Panorama actual</AppText>
              <AppText style={styles.sectionSubtitle}>Indicadores acumulados del paciente</AppText>
            </View>
            <View style={styles.recordCountBadge}>
              <AppText style={styles.recordCountValue}>{resumen?.totalRegistros ?? 0}</AppText>
              <AppText style={styles.recordCountLabel}>registros</AppText>
            </View>
          </View>
          {loadingData ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#29B6FF" />
              <AppText style={styles.loadingText}>Cargando resumen...</AppText>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                <SummaryMetric
                  icon="scale-outline"
                  label="Peso actual"
                  value={formatNumber(resumen?.peso?.actual, ' kg')}
                  color="#29B6FF"
                />
                <SummaryMetric
                  icon="swap-vertical-outline"
                  label="Cambio"
                  value={formatNumber(resumen?.peso?.cambio, ' kg')}
                  color="#A78BFA"
                />
                <SummaryMetric
                  icon="timer-outline"
                  label="Ejercicio"
                  value={formatNumber(resumen?.ejercicio?.minutosTotales, ' min')}
                  color="#38E28E"
                />
                <SummaryMetric
                  icon="footsteps-outline"
                  label="Pasos promedio"
                  value={formatNumber(resumen?.ejercicio?.pasosPromedio)}
                  color="#F9A826"
                />
                <SummaryMetric
                  icon="flame-outline"
                  label="Calorías"
                  value={formatNumber(resumen?.ejercicio?.caloriasTotales)}
                  color="#FF4D73"
                />
                <SummaryMetric
                  icon="flag-outline"
                  label="Peso inicial"
                  value={formatNumber(resumen?.peso?.inicial, ' kg')}
                  color="#2DD4BF"
                />
              </View>
              {dataError ? <AppText style={styles.errorText}>{dataError}</AppText> : null}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <View>
              <AppText style={styles.sectionTitle}>Calendario de registros</AppText>
              <AppText style={styles.calendarSubtitle}>
                Explora el mes y toca un día marcado para ver el detalle.
              </AppText>
            </View>
            <View style={styles.calendarPill}>
              <AppText style={styles.calendarPillText}>
                {historial?.totalRegistros ?? 0} registros
              </AppText>
            </View>
          </View>

          <View style={styles.calendarPanel}>
            <Calendar
              markedDates={markedDates}
              onDayPress={handleCalendarDayPress}
              initialDate={selectedCalendarDate}
              enableSwipeMonths
              firstDay={1}
              theme={{
                calendarBackground: '#F4F8FF',
                todayTextColor: '#29B6FF',
                arrowColor: '#29B6FF',
                selectedDayBackgroundColor: '#29B6FF',
                selectedDayTextColor: '#F4F8FF',
                monthTextColor: '#071120',
                textDayFontFamily: 'SpaceGrotesk_400Regular',
                textMonthFontFamily: 'Nunito_700Bold',
                textDayHeaderFontFamily: 'SpaceGrotesk_600SemiBold',
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#38E28E' }]} />
              <AppText style={styles.legendText}>Leve</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F9A826' }]} />
              <AppText style={styles.legendText}>Moderada</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF4D73' }]} />
              <AppText style={styles.legendText}>Intensa</AppText>
            </View>
          </View>

          {selectedDayRecord ? (
            <View style={styles.dayDetailBox}>
              <View style={styles.dayDetailHeader}>
                <View>
                  <AppText style={styles.dayDetailEyebrow}>Detalle del día</AppText>
                  <AppText style={styles.dayDetailTitle}>{formatDate(selectedDayRecord.fecha)}</AppText>
                </View>
                <View
                  style={[
                    styles.dayIntensityBadge,
                    { backgroundColor: getIntensityColor(selectedDayRecord.intensidad) },
                  ]}
                >
                  <AppText style={styles.dayIntensityBadgeText}>
                    {getIntensityLabel(selectedDayRecord.intensidad)}
                  </AppText>
                </View>
              </View>

              <View style={styles.dayDetailMetricsRow}>
                <View style={styles.dayDetailMetricCard}>
                  <AppText style={styles.dayDetailMetricLabel}>Calorias</AppText>
                  <AppText style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.caloriasQuemadas)}
                  </AppText>
                </View>
                <View style={styles.dayDetailMetricCard}>
                  <AppText style={styles.dayDetailMetricLabel}>Minutos</AppText>
                  <AppText style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.minutosEjercicio, ' min')}
                  </AppText>
                </View>
              </View>

              <View style={styles.dayDetailMetricsRow}>
                <View style={styles.dayDetailMetricCard}>
                  <AppText style={styles.dayDetailMetricLabel}>Pasos</AppText>
                  <AppText style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.pasos)}
                  </AppText>
                </View>
                <View style={styles.dayDetailMetricCard}>
                  <AppText style={styles.dayDetailMetricLabel}>Peso</AppText>
                  <AppText style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.peso, ' kg')}
                  </AppText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.calendarEmptyBox}>
              <AppText style={styles.emptyText}>
                Selecciona un día marcado para ver el detalle del registro.
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider}>
          <AppText style={styles.sectionDividerTitle}>Diagrama combinado</AppText>
          <AppText style={styles.sectionDividerText}>
            Vista unificada para comparar peso y calorías por fecha.
          </AppText>
        </View>

        <View style={[styles.card, styles.chartCard]}>
          <View style={styles.chartHeading}>
            <AppText style={styles.sectionTitle}>Tendencia en el tiempo</AppText>
            <TouchableOpacity
              style={[styles.demoButton, showDemoData && styles.demoButtonActive]}
              onPress={() => setShowDemoData((previous) => !previous)}
              accessibilityRole="button"
              accessibilityLabel={showDemoData ? 'Volver a datos reales' : 'Probar gráfica con datos demo'}
            >
              <Ionicons
                name={showDemoData ? 'server-outline' : 'flask-outline'}
                size={16}
                color={showDemoData ? '#071120' : '#F9A826'}
              />
              <AppText style={[styles.demoButtonText, showDemoData && styles.demoButtonTextActive]}>
                {showDemoData ? 'Datos reales' : 'Ver demo'}
              </AppText>
            </TouchableOpacity>
          </View>
          <AppText style={styles.chartSubtitle}>
            Selecciona el rango para ver la tendencia por fecha en 7 días, quincenal, mensual, semestral o anual.
          </AppText>
          {showDemoData ? (
            <View style={styles.demoNotice}>
              <Ionicons name="information-circle-outline" size={17} color="#F9A826" />
              <AppText style={styles.demoNoticeText}>
                Modo demostración: estos 15 registros son temporales y no se guardan en el expediente.
              </AppText>
            </View>
          ) : null}
          <View style={styles.trendRangeRow}>
            {trendRangeOptions.map((option) => {
              const active = option.value === trendRange;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.trendRangeChip, active && styles.trendRangeChipActive]}
                  onPress={() => setTrendRange(option.value)}
                >
                  <AppText style={[styles.trendRangeChipText, active && styles.trendRangeChipTextActive]}>
                    {option.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <AppText style={styles.trendSummaryText}>
            Periodo activo: {trendRangeLabel}. Registros mostrados: {chartData.length}.
          </AppText>
          {chartData.length ? (
            <View style={styles.trendBlock}>
              <AppText style={styles.trendTitle}>Peso y calorías por fecha</AppText>
              <View style={styles.combinedLegendRow}>
                <View style={styles.combinedLegendItem}>
                  <View style={[styles.combinedLegendSwatch, { backgroundColor: '#29B6FF' }]} />
                  <AppText style={styles.combinedLegendText}>Peso</AppText>
                </View>
                <View style={styles.combinedLegendItem}>
                  <View style={[styles.combinedLegendSwatch, { backgroundColor: '#FF4D73' }]} />
                  <AppText style={styles.combinedLegendText}>Calorias</AppText>
                </View>
              </View>
              <View style={styles.barChartFrame}>
                <View style={styles.barChartYAxis}>
                  {weightAxisTicks.map((tick) => (
                    <AppText key={`weight-${tick}`} style={styles.barChartAxisLabel}>
                      {tick}
                    </AppText>
                  ))}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.barChartCanvas, { width: chartContentWidth }]}>
                    <View style={[styles.barChartGridLine, styles.barChartGridTop]} />
                    <View style={[styles.barChartGridLine, styles.barChartGridMiddle]} />
                    <View style={[styles.barChartGridLine, styles.barChartGridBottom]} />
                    {weightSeries.map((item, index) => {
                      const next = weightSeries[index + 1];
                      if (item.y === null || !next || next.y === null) {
                        return null;
                      }
                      return (
                        <View
                          key={`weight-line-${item.seguimientoFisicoId}-${next.seguimientoFisicoId}`}
                          style={[
                            styles.lineChartSegment,
                            styles.lineChartWeightSegment,
                            buildLineStyle(item.x, item.y, next.x, next.y),
                          ]}
                        />
                      );
                    })}
                    {caloriesSeries.map((item, index) => {
                      const next = caloriesSeries[index + 1];
                      if (item.y === null || !next || next.y === null) {
                        return null;
                      }
                      return (
                        <View
                          key={`calories-line-${item.seguimientoFisicoId}-${next.seguimientoFisicoId}`}
                          style={[
                            styles.lineChartSegment,
                            styles.lineChartCaloriesSegment,
                            buildLineStyle(item.x, item.y, next.x, next.y),
                          ]}
                        />
                      );
                    })}
                    {weightSeries.map((item) => (
                      <View key={`weight-point-${item.seguimientoFisicoId}`}>
                        {item.y !== null ? (
                          <>
                            <View
                              style={[
                                styles.lineChartPoint,
                                styles.lineChartWeightPoint,
                                { left: item.x - 6, top: item.y - 6 },
                              ]}
                            />
                            {item.showMarkerLabel ? (
                              <AppText
                                style={[
                                  styles.lineChartValueLabel,
                                  styles.lineChartWeightLabel,
                                  { left: item.x - 30, top: Math.max(item.y - 28, 0) },
                                ]}
                              >
                                P: {item.label}
                              </AppText>
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    ))}
                    {caloriesSeries.map((item) => (
                      <View key={`calories-point-${item.seguimientoFisicoId}`}>
                        {item.y !== null ? (
                          <>
                            <View
                              style={[
                                styles.lineChartPoint,
                                styles.lineChartCaloriesPoint,
                                { left: item.x - 6, top: item.y - 6 },
                              ]}
                            />
                            {item.showMarkerLabel ? (
                              <AppText
                                style={[
                                  styles.lineChartValueLabel,
                                  styles.lineChartCaloriesLabel,
                                  { left: item.x - 30, top: Math.min(item.y + 12, CHART_PLOT_BOTTOM - 10) },
                                ]}
                              >
                                C: {item.label}
                              </AppText>
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    ))}
                    {chartData.map((item, index) => (
                      <AppText
                        key={`date-label-${item.seguimientoFisicoId}`}
                        style={[
                          styles.lineChartDateLabel,
                          { left: CHART_SIDE_PADDING + index * CHART_POINT_GAP - 24, top: CHART_PLOT_BOTTOM + 10 },
                        ]}
                      >
                        {formatTrendTick(item.fecha, trendRange)}
                      </AppText>
                    ))}
                  </View>
                </ScrollView>
                <View style={[styles.barChartYAxis, styles.barChartYAxisRight]}>
                  {calorieAxisTicks.map((tick) => (
                    <AppText key={`calorie-${tick}`} style={[styles.barChartAxisLabel, styles.barChartAxisLabelRight]}>
                      {tick}
                    </AppText>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <AppText style={styles.emptyText}>Todavía no hay datos suficientes para el diagrama.</AppText>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleExpandableSection(setShowPesoProgress)}
            activeOpacity={0.85}
          >
            <AppText style={styles.sectionTitle}>Progreso de peso</AppText>
            <View style={styles.collapsibleAction}>
              <AppText style={styles.collapsibleActionText}>
                {showPesoProgress ? 'Ocultar' : 'Mostrar'}
              </AppText>
              <Ionicons
                name={showPesoProgress ? 'chevron-up' : 'chevron-down'}
                size={17}
                color="#29B6FF"
              />
            </View>
          </TouchableOpacity>
          {showPesoProgress ? (
            pesoProgress?.puntos?.length ? (
              pesoProgress.puntos.slice(-6).map((point) => (
                <View key={`${point.fecha}-${point.peso}`} style={styles.listItem}>
                  <AppText style={styles.itemTitle}>{formatDate(point.fecha)}</AppText>
                  <AppText style={styles.itemText}>{point.peso} kg</AppText>
                </View>
              ))
            ) : (
              <AppText style={styles.emptyText}>Todavía no hay suficientes datos de peso.</AppText>
            )
          ) : (
            <AppText style={styles.collapsedHint}>Despliega esta sección para ver el progreso.</AppText>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleExpandableSection(setShowHistorialReciente)}
            activeOpacity={0.85}
          >
            <AppText style={styles.sectionTitle}>Historial reciente</AppText>
            <View style={styles.collapsibleAction}>
              <AppText style={styles.collapsibleActionText}>
                {showHistorialReciente ? 'Ocultar' : 'Mostrar'}
              </AppText>
              <Ionicons
                name={showHistorialReciente ? 'chevron-up' : 'chevron-down'}
                size={17}
                color="#29B6FF"
              />
            </View>
          </TouchableOpacity>
          {showHistorialReciente ? (
            historial?.registros?.length ? (
              historial.registros
                .slice()
                .reverse()
                .slice(0, 6)
                .map((item) => (
                  <View key={item.seguimientoFisicoId} style={styles.listItem}>
                    <AppText style={styles.itemTitle}>{formatDate(item.fecha)}</AppText>
                    <AppText style={styles.itemText}>
                      Peso: {formatNumber(item.peso, ' kg')} - Ejercicio:{' '}
                      {formatNumber(item.minutosEjercicio, ' min')}
                    </AppText>
                    <AppText style={styles.itemText}>
                      Pasos: {formatNumber(item.pasos)} - Calorias:{' '}
                      {formatNumber(item.caloriasQuemadas)}
                    </AppText>
                    <AppText style={styles.itemText}>
                      Distancia: {formatNumber(item.distanciaKm, ' km')} - Intensidad:{' '}
                      {item.intensidad ?? 'N/D'}
                    </AppText>
                    {item.tipoEjercicio ? (
                      <AppText style={styles.itemText}>Actividad: {item.tipoEjercicio}</AppText>
                    ) : null}
                    {item.notas ? <AppText style={styles.itemText}>Nota: {item.notas}</AppText> : null}
                  </View>
                ))
            ) : (
              <AppText style={styles.emptyText}>Todavía no hay registros para este paciente.</AppText>
            )
          ) : (
            <AppText style={styles.collapsedHint}>Despliega esta sección para ver el historial.</AppText>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Logros</AppText>
          {loadingData ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#29B6FF" />
              <AppText style={styles.loadingText}>Cargando logros...</AppText>
            </View>
          ) : logros?.logros?.length ? (
            <>
              <View style={styles.achievementSummaryGrid}>
                <AchievementStat
                  label="Desbloqueados"
                  value={`${logros.desbloqueados}/${logros.total}`}
                />
                <AchievementStat
                  label="Racha actual"
                  value={`${logros.progresoResumen.rachaActual} días`}
                />
                <AchievementStat
                  label="Racha máxima"
                  value={`${logros.progresoResumen.rachaMaxima} días`}
                />
                <AchievementStat
                  label="Distancia"
                  value={formatNumber(logros.progresoResumen.distanciaAcumulada, ' km')}
                />
              </View>

              {unlockedAchievements.length ? (
                <>
                  <AppText style={styles.subsectionTitle}>Desbloqueados</AppText>
                  <View style={styles.achievementGrid}>
                    {unlockedAchievements.map((achievement) => {
                      const accentColor = getAchievementCategoryColor(achievement.category);
                      return (
                        <View
                          key={achievement.code}
                          style={[styles.achievementBadge, { borderColor: accentColor }]}
                        >
                          <AppText style={[styles.achievementCategoryTag, { color: accentColor }]}>
                            {getAchievementCategoryLabel(achievement.category)}
                          </AppText>
                          <AppText style={styles.achievementTitle}>{achievement.title}</AppText>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {logros.proximos.length ? (
                <>
                  <AppText style={styles.subsectionTitle}>Proximos objetivos</AppText>
                  {logros.proximos.map((achievement) => {
                    const accentColor = getAchievementCategoryColor(achievement.category);
                    return (
                      <View key={achievement.code} style={styles.achievementProgressCard}>
                        <View style={styles.achievementProgressHeader}>
                          <View style={styles.achievementProgressTextGroup}>
                            <AppText style={styles.achievementTitle}>{achievement.title}</AppText>
                            <AppText style={styles.achievementDescription}>
                              {achievement.description}
                            </AppText>
                          </View>
                          <AppText style={[styles.achievementCategoryTag, { color: accentColor }]}>
                            {achievement.progressPercent}%
                          </AppText>
                        </View>
                        <AppText style={styles.achievementProgressText}>
                          {achievement.progressLabel}
                        </AppText>
                        <View style={styles.achievementProgressTrack}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              {
                                width: `${achievement.progressPercent}%`,
                                backgroundColor: accentColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('SeguimientoFisicoForm', {
            patientId: selectedPatientId ? Number(selectedPatientId) : undefined,
          })
        }
      >
        <Ionicons name="add" size={25} color="#071120" />
      </TouchableOpacity>
    </View>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryMetric}>
      <View style={[styles.summaryMetricIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <AppText style={styles.summaryMetricValue}>{value}</AppText>
      <AppText style={styles.summaryMetricLabel}>{label}</AppText>
    </View>
  );
}

function AchievementStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.achievementStat}>
      <AppText style={styles.achievementStatValue}>{value}</AppText>
      <AppText style={styles.achievementStatLabel}>{label}</AppText>
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
    paddingBottom: 110,
    backgroundColor: '#071120',
    gap: 16,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#182A44',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27496D',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 13,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#29B6FF18',
    borderWidth: 1,
    borderColor: '#29B6FF55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  heroEyebrow: {
    color: '#29B6FF',
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
  heroAddButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#38E28E',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  heroAddButtonText: {
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
    backgroundColor: '#29B6FF18',
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  calendarSubtitle: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  calendarPill: {
    backgroundColor: '#29B6FF18',
    borderWidth: 1,
    borderColor: '#29B6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendarPillText: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarPanel: {
    backgroundColor: '#F4F8FF',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#C9D7E8',
  },
  calendar: {
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#9FB3C8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  recordCountBadge: {
    minWidth: 64,
    borderRadius: 14,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#27496D',
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  recordCountValue: {
    color: '#F4F8FF',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },
  recordCountLabel: {
    color: '#9FB3C8',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryMetric: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 145,
    minHeight: 115,
    backgroundColor: '#071120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1B3355',
    padding: 13,
  },
  summaryMetricIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  summaryMetricValue: {
    color: '#F4F8FF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  summaryMetricLabel: {
    color: '#9FB3C8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  subsectionTitle: {
    color: '#F4F8FF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  collapsibleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#29B6FF12',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#29B6FF45',
  },
  collapsibleActionText: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
  },
  collapsedHint: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
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
    backgroundColor: '#F4F8FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#071120',
  },
  textArea: {
    minHeight: 92,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
  },
  fieldGroupHalf: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
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
  metricText: {
    color: '#F4F8FF',
    fontSize: 14,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  achievementStat: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 130,
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 12,
  },
  achievementStatValue: {
    color: '#F4F8FF',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  achievementStatLabel: {
    color: '#9FB3C8',
    fontSize: 10,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  achievementBadge: {
    minWidth: '48%',
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  achievementCategoryTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  achievementTitle: {
    color: '#F4F8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  achievementDescription: {
    color: '#C9D7E8',
    fontSize: 12,
    lineHeight: 18,
  },
  achievementProgressCard: {
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 12,
    gap: 8,
  },
  achievementProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  achievementProgressTextGroup: {
    flex: 1,
    gap: 4,
  },
  achievementProgressText: {
    color: '#9FB3C8',
    fontSize: 12,
    fontWeight: '600',
  },
  achievementProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#132238',
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionDivider: {
    paddingTop: 6,
    gap: 4,
  },
  sectionDividerTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDividerText: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
  },
  chartCard: {
    marginTop: 2,
  },
  chartHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartSubtitle: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  demoButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#F9A826',
    backgroundColor: '#F9A82612',
  },
  demoButtonActive: {
    backgroundColor: '#F9A826',
  },
  demoButtonText: {
    color: '#F9A826',
    fontSize: 11,
    fontWeight: '900',
  },
  demoButtonTextActive: {
    color: '#071120',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9A82612',
    borderWidth: 1,
    borderColor: '#F9A82645',
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
  },
  demoNoticeText: {
    color: '#C9D7E8',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  trendRangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  trendRangeChip: {
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#071120',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  trendRangeChipActive: {
    backgroundColor: '#29B6FF',
    borderColor: '#29B6FF',
  },
  trendRangeChipText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  trendRangeChipTextActive: {
    color: '#071120',
  },
  trendSummaryText: {
    color: '#C9D7E8',
    fontSize: 12,
    marginBottom: 12,
  },
  barChartFrame: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  barChartYAxis: {
    width: 50,
    height: 210,
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingTop: 10,
  },
  barChartYAxisRight: {
    alignItems: 'flex-end',
  },
  barChartAxisLabel: {
    color: '#9FB3C8',
    fontSize: 11,
    fontWeight: '700',
  },
  barChartAxisLabelRight: {
    textAlign: 'right',
  },
  barChartCanvas: {
    position: 'relative',
    height: CHART_CANVAS_HEIGHT,
    paddingTop: 10,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  barChartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#27496D',
  },
  barChartGridTop: {
    top: 18,
  },
  barChartGridMiddle: {
    top: 93,
  },
  barChartGridBottom: {
    bottom: 24,
  },
  lineChartSegment: {
    position: 'absolute',
    height: CHART_LINE_THICKNESS,
    borderRadius: 999,
    zIndex: 1,
  },
  lineChartWeightSegment: {
    backgroundColor: '#29B6FF',
  },
  lineChartCaloriesSegment: {
    backgroundColor: '#FF4D73',
  },
  lineChartPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#F4F8FF',
    zIndex: 3,
  },
  lineChartWeightPoint: {
    backgroundColor: '#29B6FF',
  },
  lineChartCaloriesPoint: {
    backgroundColor: '#FF4D73',
  },
  lineChartEmptyPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#9FB3C8',
    zIndex: 2,
  },
  lineChartValueLabel: {
    position: 'absolute',
    width: 60,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 4,
  },
  lineChartWeightLabel: {
    color: '#29B6FF',
  },
  lineChartCaloriesLabel: {
    color: '#FF4D73',
  },
  lineChartDateLabel: {
    position: 'absolute',
    width: 48,
    color: '#9FB3C8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '600',
  },
  dayDetailBox: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dayDetailEyebrow: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dayDetailTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  dayIntensityBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 88,
    alignItems: 'center',
  },
  dayIntensityBadgeText: {
    color: '#F4F8FF',
    fontSize: 12,
    fontWeight: '800',
  },
  dayDetailMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayDetailMetricCard: {
    flex: 1,
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#132238',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  dayDetailMetricLabel: {
    color: '#9FB3C8',
    fontSize: 12,
    fontWeight: '700',
  },
  dayDetailMetricValue: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '800',
  },
  calendarEmptyBox: {
    backgroundColor: '#071120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 14,
  },
  trendBlock: {
    gap: 10,
  },
  trendTitle: {
    color: '#F4F8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  combinedLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  combinedLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  combinedLegendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  combinedLegendText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  trendChart: {
    position: 'relative',
    backgroundColor: '#071120',
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 12,
    minHeight: 188,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  trendBaseline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 52,
    height: 1,
    backgroundColor: '#27496D',
  },
  trendPlotArea: {
    position: 'relative',
    height: 150,
    marginHorizontal: 14,
  },
  trendPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F4F8FF',
    marginLeft: -6,
    marginBottom: -6,
    zIndex: 3,
  },
  trendCaloriesPoint: {
    backgroundColor: '#FF4D73',
  },
  trendLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 999,
    marginLeft: 0,
    marginBottom: 0,
    zIndex: 1,
  },
  trendPointValue: {
    position: 'absolute',
    color: '#C9D7E8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: 56,
    marginLeft: -28,
  },
  trendDateTick: {
    position: 'absolute',
    color: '#9FB3C8',
    fontSize: 11,
    fontWeight: '600',
    bottom: 0,
    width: 40,
    marginLeft: -20,
    textAlign: 'center',
  },
  trendHiddenLabel: {
    opacity: 0,
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    backgroundColor: '#071120',
  },
  itemTitle: {
    color: '#F4F8FF',
    fontWeight: '700',
  },
  itemText: {
    color: '#C9D7E8',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#38E28E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
});
