import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { RootStackParamList } from '../navigation/types';

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
  { label: '7 dias', value: '7d' },
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

const today = () => new Date().toISOString().slice(0, 10);

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
  if (normalized === 'intensa') return '#ef4444';
  if (normalized === 'moderada') return '#f59e0b';
  if (normalized === 'leve') return '#22c55e';
  return '#64748b';
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
  if (value === 'constancia') return '#38bdf8';
  if (value === 'actividad') return '#22c55e';
  return '#f59e0b';
};

export function SeguimientoFisicoScreen({ navigation }: Props) {
  const { token } = useAuth();
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
      const existingRank = getIntensityRank(existing.dotColor === '#ef4444' ? 'intensa' : existing.dotColor === '#f59e0b' ? 'moderada' : existing.dotColor === '#22c55e' ? 'leve' : null);
      const currentRank = getIntensityRank(record.intensidad);
      marks[record.fecha] = {
        ...existing,
        marked: true,
        dotColor: currentRank >= existingRank ? getIntensityColor(record.intensidad) : existing.dotColor ?? '#38bdf8',
      };
    });
    if (selectedCalendarDate) {
      marks[selectedCalendarDate] = {
        ...(marks[selectedCalendarDate] ?? {}),
        selected: true,
        selectedColor: '#0284c7',
        selectedTextColor: '#fff',
        marked: marks[selectedCalendarDate]?.marked ?? false,
        dotColor: marks[selectedCalendarDate]?.dotColor ?? '#38bdf8',
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

  const chartData = useMemo(() => {
    const sorted = (historial?.registros ?? []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
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
  }, [historial?.registros, trendRange]);

  const trendRangeLabel = useMemo(() => {
    return trendRangeOptions.find((option) => option.value === trendRange)?.label ?? '7 dias';
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
            tintColor="#fff"
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Seguimiento Fisico</Text>
          <Text style={styles.heroText}>
            Registra ejercicio, peso, pasos, calorias y distancia para el control diario.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Paciente</Text>
          {loadingPatients ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#38bdf8" />
              <Text style={styles.loadingText}>Cargando pacientes...</Text>
            </View>
          ) : patients.length === 0 ? (
            <Text style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</Text>
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
                  />
                ))}
              </Picker>
            </View>
          )}
          {patientError ? <Text style={styles.errorText}>{patientError}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen</Text>
          {loadingData ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#38bdf8" />
              <Text style={styles.loadingText}>Cargando resumen...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.metricText}>
                Total de registros: {resumen?.totalRegistros ?? 0}
              </Text>
              <Text style={styles.metricText}>
                Peso inicial: {formatNumber(resumen?.peso?.inicial, ' kg')}
              </Text>
              <Text style={styles.metricText}>
                Peso actual: {formatNumber(resumen?.peso?.actual, ' kg')}
              </Text>
              <Text style={styles.metricText}>
                Cambio de peso: {formatNumber(resumen?.peso?.cambio, ' kg')}
              </Text>
              <Text style={styles.metricText}>
                Minutos totales de ejercicio:{' '}
                {formatNumber(resumen?.ejercicio?.minutosTotales, ' min')}
              </Text>
              <Text style={styles.metricText}>
                Promedio de pasos: {formatNumber(resumen?.ejercicio?.pasosPromedio)}
              </Text>
              <Text style={styles.metricText}>
                Calorias totales: {formatNumber(resumen?.ejercicio?.caloriasTotales)}
              </Text>
              {dataError ? <Text style={styles.errorText}>{dataError}</Text> : null}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.sectionTitle}>Calendario de registros</Text>
              <Text style={styles.calendarSubtitle}>
                Explora el mes y toca un dia marcado para ver el detalle.
              </Text>
            </View>
            <View style={styles.calendarPill}>
              <Text style={styles.calendarPillText}>
                {historial?.totalRegistros ?? 0} registros
              </Text>
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
                calendarBackground: '#f8fafc',
                todayTextColor: '#0284c7',
                arrowColor: '#0284c7',
                selectedDayBackgroundColor: '#0284c7',
                selectedDayTextColor: '#fff',
                monthTextColor: '#0f172a',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Leve</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Moderada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Intensa</Text>
            </View>
          </View>

          {selectedDayRecord ? (
            <View style={styles.dayDetailBox}>
              <View style={styles.dayDetailHeader}>
                <View>
                  <Text style={styles.dayDetailEyebrow}>Detalle del dia</Text>
                  <Text style={styles.dayDetailTitle}>{formatDate(selectedDayRecord.fecha)}</Text>
                </View>
                <View
                  style={[
                    styles.dayIntensityBadge,
                    { backgroundColor: getIntensityColor(selectedDayRecord.intensidad) },
                  ]}
                >
                  <Text style={styles.dayIntensityBadgeText}>
                    {getIntensityLabel(selectedDayRecord.intensidad)}
                  </Text>
                </View>
              </View>

              <View style={styles.dayDetailMetricsRow}>
                <View style={styles.dayDetailMetricCard}>
                  <Text style={styles.dayDetailMetricLabel}>Calorias</Text>
                  <Text style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.caloriasQuemadas)}
                  </Text>
                </View>
                <View style={styles.dayDetailMetricCard}>
                  <Text style={styles.dayDetailMetricLabel}>Minutos</Text>
                  <Text style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.minutosEjercicio, ' min')}
                  </Text>
                </View>
              </View>

              <View style={styles.dayDetailMetricsRow}>
                <View style={styles.dayDetailMetricCard}>
                  <Text style={styles.dayDetailMetricLabel}>Pasos</Text>
                  <Text style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.pasos)}
                  </Text>
                </View>
                <View style={styles.dayDetailMetricCard}>
                  <Text style={styles.dayDetailMetricLabel}>Peso</Text>
                  <Text style={styles.dayDetailMetricValue}>
                    {formatNumber(selectedDayRecord.peso, ' kg')}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.calendarEmptyBox}>
              <Text style={styles.emptyText}>
                Selecciona un dia marcado para ver el detalle del registro.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionDividerTitle}>Diagrama combinado</Text>
          <Text style={styles.sectionDividerText}>
            Vista unificada para comparar peso y calorias por fecha.
          </Text>
        </View>

        <View style={[styles.card, styles.chartCard]}>
          <Text style={styles.sectionTitle}>Tendencia en el tiempo</Text>
          <Text style={styles.chartSubtitle}>
            Selecciona el rango para ver la tendencia por fecha en 7 dias, quincenal, mensual, semestral o anual.
          </Text>
          <View style={styles.trendRangeRow}>
            {trendRangeOptions.map((option) => {
              const active = option.value === trendRange;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.trendRangeChip, active && styles.trendRangeChipActive]}
                  onPress={() => setTrendRange(option.value)}
                >
                  <Text style={[styles.trendRangeChipText, active && styles.trendRangeChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.trendSummaryText}>
            Periodo activo: {trendRangeLabel}. Registros mostrados: {chartData.length}.
          </Text>
          {chartData.length ? (
            <View style={styles.trendBlock}>
              <Text style={styles.trendTitle}>Peso y calorias por fecha</Text>
              <View style={styles.combinedLegendRow}>
                <View style={styles.combinedLegendItem}>
                  <View style={[styles.combinedLegendSwatch, { backgroundColor: '#38bdf8' }]} />
                  <Text style={styles.combinedLegendText}>Peso</Text>
                </View>
                <View style={styles.combinedLegendItem}>
                  <View style={[styles.combinedLegendSwatch, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.combinedLegendText}>Calorias</Text>
                </View>
              </View>
              <View style={styles.barChartFrame}>
                <View style={styles.barChartYAxis}>
                  {weightAxisTicks.map((tick) => (
                    <Text key={`weight-${tick}`} style={styles.barChartAxisLabel}>
                      {tick}
                    </Text>
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
                            <Text
                              style={[
                                styles.lineChartValueLabel,
                                styles.lineChartWeightLabel,
                                { left: item.x - 30, top: Math.max(item.y - 28, 0) },
                              ]}
                            >
                              P: {item.label}
                            </Text>
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
                            <Text
                              style={[
                                styles.lineChartValueLabel,
                                styles.lineChartCaloriesLabel,
                                { left: item.x - 30, top: Math.min(item.y + 12, CHART_PLOT_BOTTOM - 10) },
                              ]}
                            >
                              C: {item.label}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    ))}
                    {chartData.map((item, index) => (
                      <Text
                        key={`date-label-${item.seguimientoFisicoId}`}
                        style={[
                          styles.lineChartDateLabel,
                          { left: CHART_SIDE_PADDING + index * CHART_POINT_GAP - 24, top: CHART_PLOT_BOTTOM + 10 },
                        ]}
                      >
                        {formatTrendTick(item.fecha, trendRange)}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
                <View style={[styles.barChartYAxis, styles.barChartYAxisRight]}>
                  {calorieAxisTicks.map((tick) => (
                    <Text key={`calorie-${tick}`} style={[styles.barChartAxisLabel, styles.barChartAxisLabelRight]}>
                      {tick}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Todavia no hay datos suficientes para el diagrama.</Text>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleExpandableSection(setShowPesoProgress)}
            activeOpacity={0.85}
          >
            <Text style={styles.sectionTitle}>Progreso de peso</Text>
            <Text style={styles.collapsibleAction}>
              {showPesoProgress ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
          {showPesoProgress ? (
            pesoProgress?.puntos?.length ? (
              pesoProgress.puntos.slice(-6).map((point) => (
                <View key={`${point.fecha}-${point.peso}`} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{formatDate(point.fecha)}</Text>
                  <Text style={styles.itemText}>{point.peso} kg</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Todavia no hay suficientes datos de peso.</Text>
            )
          ) : (
            <Text style={styles.collapsedHint}>Despliega esta seccion para ver el progreso.</Text>
          )}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleExpandableSection(setShowHistorialReciente)}
            activeOpacity={0.85}
          >
            <Text style={styles.sectionTitle}>Historial reciente</Text>
            <Text style={styles.collapsibleAction}>
              {showHistorialReciente ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
          {showHistorialReciente ? (
            historial?.registros?.length ? (
              historial.registros
                .slice()
                .reverse()
                .slice(0, 6)
                .map((item) => (
                  <View key={item.seguimientoFisicoId} style={styles.listItem}>
                    <Text style={styles.itemTitle}>{formatDate(item.fecha)}</Text>
                    <Text style={styles.itemText}>
                      Peso: {formatNumber(item.peso, ' kg')} - Ejercicio:{' '}
                      {formatNumber(item.minutosEjercicio, ' min')}
                    </Text>
                    <Text style={styles.itemText}>
                      Pasos: {formatNumber(item.pasos)} - Calorias:{' '}
                      {formatNumber(item.caloriasQuemadas)}
                    </Text>
                    <Text style={styles.itemText}>
                      Distancia: {formatNumber(item.distanciaKm, ' km')} - Intensidad:{' '}
                      {item.intensidad ?? 'N/D'}
                    </Text>
                    {item.tipoEjercicio ? (
                      <Text style={styles.itemText}>Actividad: {item.tipoEjercicio}</Text>
                    ) : null}
                    {item.notas ? <Text style={styles.itemText}>Nota: {item.notas}</Text> : null}
                  </View>
                ))
            ) : (
              <Text style={styles.emptyText}>Todavia no hay registros para este paciente.</Text>
            )
          ) : (
            <Text style={styles.collapsedHint}>Despliega esta seccion para ver el historial.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Logros</Text>
          {loadingData ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#38bdf8" />
              <Text style={styles.loadingText}>Cargando logros...</Text>
            </View>
          ) : logros?.logros?.length ? (
            <>
              <Text style={styles.metricText}>
                Desbloqueados: {logros.desbloqueados} de {logros.total}
              </Text>
              <Text style={styles.metricText}>
                Racha actual: {logros.progresoResumen.rachaActual} dias
              </Text>
              <Text style={styles.metricText}>
                Racha maxima: {logros.progresoResumen.rachaMaxima} dias
              </Text>
              <Text style={styles.metricText}>
                Distancia acumulada: {formatNumber(logros.progresoResumen.distanciaAcumulada, ' km')}
              </Text>

              {unlockedAchievements.length ? (
                <>
                  <Text style={styles.subsectionTitle}>Desbloqueados</Text>
                  <View style={styles.achievementGrid}>
                    {unlockedAchievements.map((achievement) => {
                      const accentColor = getAchievementCategoryColor(achievement.category);
                      return (
                        <View
                          key={achievement.code}
                          style={[styles.achievementBadge, { borderColor: accentColor }]}
                        >
                          <Text style={[styles.achievementCategoryTag, { color: accentColor }]}>
                            {getAchievementCategoryLabel(achievement.category)}
                          </Text>
                          <Text style={styles.achievementTitle}>{achievement.title}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {logros.proximos.length ? (
                <>
                  <Text style={styles.subsectionTitle}>Proximos objetivos</Text>
                  {logros.proximos.map((achievement) => {
                    const accentColor = getAchievementCategoryColor(achievement.category);
                    return (
                      <View key={achievement.code} style={styles.achievementProgressCard}>
                        <View style={styles.achievementProgressHeader}>
                          <View style={styles.achievementProgressTextGroup}>
                            <Text style={styles.achievementTitle}>{achievement.title}</Text>
                            <Text style={styles.achievementDescription}>
                              {achievement.description}
                            </Text>
                          </View>
                          <Text style={[styles.achievementCategoryTag, { color: accentColor }]}>
                            {achievement.progressPercent}%
                          </Text>
                        </View>
                        <Text style={styles.achievementProgressText}>
                          {achievement.progressLabel}
                        </Text>
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
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    paddingBottom: 110,
    backgroundColor: '#0f172a',
    gap: 16,
  },
  hero: {
    backgroundColor: '#082f49',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroText: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  calendarSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  calendarPill: {
    backgroundColor: '#082f49',
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendarPillText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarPanel: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  calendar: {
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subsectionTitle: {
    color: '#f8fafc',
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
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  collapsedHint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
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
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
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
    color: '#cbd5e1',
    marginTop: 8,
  },
  emptyText: {
    color: '#cbd5e1',
    lineHeight: 20,
  },
  errorText: {
    color: '#fca5a5',
    lineHeight: 20,
  },
  metricText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementBadge: {
    minWidth: '48%',
    backgroundColor: '#0f172a',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  achievementDescription: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  achievementProgressCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  achievementProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1e293b',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDividerText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  chartCard: {
    marginTop: 2,
  },
  chartSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
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
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  trendRangeChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#38bdf8',
  },
  trendRangeChipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  trendRangeChipTextActive: {
    color: '#082f49',
  },
  trendSummaryText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 12,
  },
  barChartFrame: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#94a3b8',
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
    backgroundColor: '#334155',
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
    backgroundColor: '#38bdf8',
  },
  lineChartCaloriesSegment: {
    backgroundColor: '#f97316',
  },
  lineChartPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    zIndex: 3,
  },
  lineChartWeightPoint: {
    backgroundColor: '#38bdf8',
  },
  lineChartCaloriesPoint: {
    backgroundColor: '#f97316',
  },
  lineChartEmptyPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#475569',
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
    color: '#7dd3fc',
  },
  lineChartCaloriesLabel: {
    color: '#fdba74',
  },
  lineChartDateLabel: {
    position: 'absolute',
    width: 48,
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  dayDetailBox: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dayDetailEyebrow: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  dayDetailTitle: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  dayDetailMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dayDetailMetricCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  dayDetailMetricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  dayDetailMetricValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  calendarEmptyBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  trendBlock: {
    gap: 10,
  },
  trendTitle: {
    color: '#f8fafc',
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
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  trendChart: {
    position: 'relative',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 12,
    minHeight: 188,
    borderWidth: 1,
    borderColor: '#334155',
  },
  trendBaseline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 52,
    height: 1,
    backgroundColor: '#334155',
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
    borderColor: '#e2e8f0',
    marginLeft: -6,
    marginBottom: -6,
    zIndex: 3,
  },
  trendCaloriesPoint: {
    backgroundColor: '#f97316',
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
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: 56,
    marginLeft: -28,
  },
  trendDateTick: {
    position: 'absolute',
    color: '#94a3b8',
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
    borderColor: '#334155',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  itemTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  itemText: {
    color: '#cbd5e1',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
