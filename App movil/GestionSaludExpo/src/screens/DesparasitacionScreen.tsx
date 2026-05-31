import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, type DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';

type DesparasitacionRecord = {
  desparasitacionId: number;
  pacienteId: number;
  fecha?: string | null;
  producto?: string | null;
  dosis?: string | null;
  proximafecha?: string | null;
  observaciones?: string | null;
  creadoen?: string | null;
};

type FormState = {
  pacienteId: string;
  fecha: string;
  producto: string;
  dosis: string;
  proximafecha: string;
  observaciones: string;
};

type DesparasitacionScreenProps = {
  mode?: 'list' | 'create';
};

type CalendarMarks = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dots?: Array<{ key: string; color: string }>;
  };
};

type DayEntry = DesparasitacionRecord & {
  dayType: 'aplicacion' | 'proxima';
};

const toDateOnlyString = (value?: Date | string | null): string => {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string | null) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part: number) => !Number.isNaN(part))) {
    return new Date(parts[0], (parts[1] ?? 1) - 1, parts[2]);
  }
  return new Date();
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return 'Selecciona una fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const normalizeRecord = (item: Record<string, unknown>): DesparasitacionRecord | null => {
  const desparasitacionId = Number(item.desparasitacionId ?? item.desparasitacionid ?? item.id ?? 0);
  const pacienteId = Number(item.pacienteId ?? item.pacienteid ?? 0);

  if (
    !Number.isFinite(desparasitacionId) ||
    desparasitacionId <= 0 ||
    !Number.isFinite(pacienteId) ||
    pacienteId <= 0
  ) {
    return null;
  }

  return {
    desparasitacionId,
    pacienteId,
    fecha: toDateOnlyString(item.fecha as string | null | undefined) || null,
    producto: normalizeText(item.producto),
    dosis: normalizeText(item.dosis),
    proximafecha: toDateOnlyString(item.proximafecha as string | null | undefined) || null,
    observaciones: normalizeText(item.observaciones),
    creadoen: normalizeText(item.creadoen),
  };
};

export function DesparasitacionScreen({ mode = 'list' }: DesparasitacionScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const { token, user } = useAuth();
  const defaultPacienteId = useMemo(
    () => (user?.pacienteId ? String(user.pacienteId) : ''),
    [user?.pacienteId],
  );

  const buildInitialForm = useCallback(
    (): FormState => ({
      pacienteId: defaultPacienteId,
      fecha: '',
      producto: '',
      dosis: '',
      proximafecha: '',
      observaciones: '',
    }),
    [defaultPacienteId],
  );

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<DesparasitacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateOnlyString(new Date()));
  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [showIOSFechaPicker, setShowIOSFechaPicker] = useState(false);
  const [showIOSProximaPicker, setShowIOSProximaPicker] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, pacienteId: prev.pacienteId || defaultPacienteId }));
  }, [defaultPacienteId]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
    setLoadingPatients(true);
    try {
      let normalized = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }
      setPatientOptions(normalized);
      setForm((prev) =>
        prev.pacienteId || normalized.length === 0
          ? prev
          : { ...prev, pacienteId: String(normalized[0].pacienteId) },
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

  const fetchRecords = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/desparasitacion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo cargar el historial');
      }
      const items = Array.isArray(body)
        ? body
            .map((item) => normalizeRecord((item ?? {}) as Record<string, unknown>))
            .filter((item): item is DesparasitacionRecord => Boolean(item))
            .sort(
              (a, b) =>
                new Date(b.fecha ?? b.proximafecha ?? 0).getTime() -
                new Date(a.fecha ?? a.proximafecha ?? 0).getTime(),
            )
        : [];
      setRecords(items);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar el historial');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    void fetchPatients();
    void fetchRecords();
  }, [fetchPatients, fetchRecords]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const visibleRecords = useMemo(() => {
    const pacienteId = Number(selectedPatientId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      return records;
    }
    return records.filter((record) => record.pacienteId === pacienteId);
  }, [records, selectedPatientId]);

  const metrics = useMemo(() => {
    const upcomingCount = visibleRecords.filter((record) => {
      const nextDate = toDateOnlyString(record.proximafecha);
      return nextDate && nextDate >= toDateOnlyString(new Date());
    }).length;

    return {
      total: visibleRecords.length,
      patients: new Set(visibleRecords.map((record) => record.pacienteId)).size,
      withNextDate: visibleRecords.filter((record) => Boolean(record.proximafecha)).length,
      upcomingCount,
    };
  }, [visibleRecords]);

  const nextUpcomingRecord = useMemo(() => {
    return visibleRecords
      .filter((record) => Boolean(toDateOnlyString(record.proximafecha)))
      .sort(
        (a, b) =>
          new Date(a.proximafecha ?? 0).getTime() - new Date(b.proximafecha ?? 0).getTime(),
      )[0] ?? null;
  }, [visibleRecords]);

  const markedDates = useMemo<CalendarMarks>(() => {
    const marks: CalendarMarks = {};

    visibleRecords.forEach((record) => {
      const applicationDate = toDateOnlyString(record.fecha);
      if (applicationDate) {
        const existing = marks[applicationDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `app-${record.desparasitacionId}`)) {
          dots.push({ key: `app-${record.desparasitacionId}`, color: '#38F28E' });
        }
        marks[applicationDate] = { ...existing, marked: true, dots };
      }

      const nextDate = toDateOnlyString(record.proximafecha);
      if (nextDate) {
        const existing = marks[nextDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `next-${record.desparasitacionId}`)) {
          dots.push({ key: `next-${record.desparasitacionId}`, color: '#FF4D73' });
        }
        marks[nextDate] = { ...existing, marked: true, dots };
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: '#29B6FF',
        selectedTextColor: '#F4F8FF',
        marked: marks[selectedDate]?.marked ?? false,
      };
    }

    return marks;
  }, [selectedDate, visibleRecords]);

  const dayEntries = useMemo<DayEntry[]>(() => {
    if (!selectedDate) return [];
    const entries: DayEntry[] = [];

    visibleRecords.forEach((record) => {
      if (toDateOnlyString(record.fecha) === selectedDate) {
        entries.push({ ...record, dayType: 'aplicacion' });
      }
      if (toDateOnlyString(record.proximafecha) === selectedDate) {
        entries.push({ ...record, dayType: 'proxima' });
      }
    });

    return entries.sort((a, b) => a.desparasitacionId - b.desparasitacionId);
  }, [selectedDate, visibleRecords]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = useCallback(() => {
    setForm(buildInitialForm());
    setShowIOSFechaPicker(false);
    setShowIOSProximaPicker(false);
  }, [buildInitialForm]);

  const handleDateConfirm = (key: 'fecha' | 'proximafecha', value: Date) => {
    handleChange(key, toDateOnlyString(value));
    if (Platform.OS === 'ios') {
      if (key === 'fecha') {
        setShowIOSFechaPicker(false);
      } else {
        setShowIOSProximaPicker(false);
      }
    }
  };

  const openDatePicker = (key: 'fecha' | 'proximafecha') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[key]),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selectedDateValue) => {
          if (event.type === 'set' && selectedDateValue) {
            handleDateConfirm(key, selectedDateValue);
          }
        },
      });
      return;
    }

    if (key === 'fecha') {
      setShowIOSFechaPicker(true);
    } else {
      setShowIOSProximaPicker(true);
    }
  };

  const handleSubmit = async () => {
    const pacienteId = Number(form.pacienteId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0 || !form.fecha || !form.producto.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha y producto son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/desparasitacion',
        method: 'POST',
        description: 'registrar desparasitacion',
        body: {
          pacienteId,
          fecha: form.fecha,
          producto: form.producto.trim(),
          dosis: form.dosis.trim() || undefined,
          proximafecha: form.proximafecha || undefined,
          observaciones: form.observaciones.trim() || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Control en cola',
          'No habia conexion. El control de desparasitacion quedo guardado y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert('Control guardado', 'La desparasitacion fue registrada correctamente');
      }

      resetForm();
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        void fetchRecords();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          !isCreateMode ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchRecords();
              }}
            />
          ) : undefined
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>CONTROL PREVENTIVO</Text>
          <Text style={styles.title}>
            {isCreateMode ? 'Nuevo control de desparasitacion' : 'Desparasitacion'}
          </Text>
          <Text style={styles.subtitle}>
            {isCreateMode
              ? 'Registra la aplicacion, la dosis y deja programada la siguiente fecha si ya esta definida.'
              : 'Consulta aplicaciones pasadas, proximas fechas y el calendario preventivo por persona.'}
          </Text>
        </View>

        {isCreateMode ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Registrar control</Text>

            <Text style={styles.label}>Paciente</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.pacienteId}
                onValueChange={(value) => handleChange('pacienteId', String(value))}
                enabled={!loadingPatients}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item
                  label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'}
                  value=""
                  color={pickerItemColor}
                />
                {patientOptions.map((patient) => (
                  <Picker.Item
                    key={patient.pacienteId}
                    label={patient.displayName}
                    value={String(patient.pacienteId)}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Fecha de aplicacion</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fecha')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSFechaPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  value={parseDateForPicker(form.fecha)}
                  onChange={(_, selectedDateValue) => {
                    if (selectedDateValue) {
                      handleDateConfirm('fecha', selectedDateValue);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowIOSFechaPicker(false)}
                >
                  <Text style={styles.secondaryButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Producto utilizado"
              placeholderTextColor="#9FB3C8"
              value={form.producto}
              onChangeText={(value) => handleChange('producto', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Dosis"
              placeholderTextColor="#9FB3C8"
              value={form.dosis}
              onChangeText={(value) => handleChange('dosis', value)}
            />

            <Text style={styles.label}>Proxima fecha</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('proximafecha')}
            >
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.proximafecha)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSProximaPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  value={parseDateForPicker(form.proximafecha)}
                  onChange={(_, selectedDateValue) => {
                    if (selectedDateValue) {
                      handleDateConfirm('proximafecha', selectedDateValue);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowIOSProximaPicker(false)}
                >
                  <Text style={styles.secondaryButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Observaciones"
              placeholderTextColor="#9FB3C8"
              value={form.observaciones}
              onChangeText={(value) => handleChange('observaciones', value)}
              multiline
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  if (navigation.canGoBack()) navigation.goBack();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting ? styles.disabledButton : null]}
                disabled={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#F4F8FF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.total}</Text>
                <Text style={styles.metricLabel}>Controles</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.patients}</Text>
                <Text style={styles.metricLabel}>Pacientes</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.withNextDate}</Text>
                <Text style={styles.metricLabel}>Con proxima fecha</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.upcomingCount}</Text>
                <Text style={styles.metricLabel}>Pendientes</Text>
              </View>
            </View>

            <View style={styles.filterCard}>
              <Text style={styles.label}>Filtrar por paciente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={selectedPatientId}
                  onValueChange={(value) => setSelectedPatientId(String(value))}
                  enabled={!loadingPatients}
                  dropdownIconColor="#F4F8FF"
                >
                  <Picker.Item
                    label={loadingPatients ? 'Cargando pacientes...' : 'Todos los pacientes'}
                    value=""
                    color={pickerItemColor}
                  />
                  {patientOptions.map((patient) => (
                    <Picker.Item
                      key={patient.pacienteId}
                      label={patient.displayName}
                      value={String(patient.pacienteId)}
                      color={pickerItemColor}
                    />
                  ))}
                </Picker>
              </View>

              {nextUpcomingRecord ? (
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightLabel}>Proximo control sugerido</Text>
                  <Text style={styles.highlightTitle}>
                    {nextUpcomingRecord.producto ?? 'Producto sin nombre'}
                  </Text>
                  <Text style={styles.highlightText}>
                    {`${patientNameById[nextUpcomingRecord.pacienteId] ?? `Paciente #${nextUpcomingRecord.pacienteId}`} | ${formatRecordDate(nextUpcomingRecord.proximafecha)}`}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Calendario preventivo</Text>
              <Text style={styles.sectionSubtitle}>
                Verde: aplicacion realizada. Amarillo: siguiente fecha.
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#29B6FF" />
                <Text style={styles.loadingText}>Cargando calendario...</Text>
              </View>
            ) : (
              <View style={styles.calendarCard}>
                <Calendar
                  current={selectedDate}
                  markedDates={markedDates}
                  markingType="multi-dot"
                  onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                  theme={{
                    calendarBackground: '#071120',
                    dayTextColor: '#F4F8FF',
                    monthTextColor: '#F4F8FF',
                    arrowColor: '#29B6FF',
                    textDisabledColor: '#9FB3C8',
                    todayTextColor: '#29B6FF',
                    textSectionTitleColor: '#9FB3C8',
                    selectedDayBackgroundColor: '#29B6FF',
                    selectedDayTextColor: '#F4F8FF',
                  }}
                />
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actividad del dia</Text>
              <Text style={styles.sectionSubtitle}>{formatDisplayDate(selectedDate)}</Text>
            </View>

            {loading ? null : dayEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No hay eventos en esta fecha</Text>
                <Text style={styles.emptyText}>
                  Selecciona otro dia del calendario para revisar aplicaciones o proximas fechas.
                </Text>
              </View>
            ) : (
              dayEntries.map((entry) => (
                <View key={`${entry.desparasitacionId}-${entry.dayType}`} style={styles.dayCard}>
                  <View style={styles.recordTopRow}>
                    <Text style={styles.recordTitle}>
                      {entry.producto ?? 'Producto no definido'}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        entry.dayType === 'aplicacion' ? styles.badgeSuccess : styles.badgeWarning,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          entry.dayType === 'aplicacion'
                            ? styles.badgeTextSuccess
                            : styles.badgeTextWarning,
                        ]}
                      >
                        {entry.dayType === 'aplicacion' ? 'Aplicacion' : 'Proxima fecha'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recordText}>
                    Paciente: {patientNameById[entry.pacienteId] ?? `Paciente #${entry.pacienteId}`}
                  </Text>
                  <Text style={styles.recordText}>
                    Dosis: {entry.dosis ?? 'Sin dato'}
                  </Text>
                  {entry.observaciones ? (
                    <Text style={styles.recordText}>Observaciones: {entry.observaciones}</Text>
                  ) : null}
                </View>
              ))
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial completo</Text>
              <Text style={styles.sectionSubtitle}>{`${visibleRecords.length} registros`}</Text>
            </View>

            {loading ? null : visibleRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sin registros</Text>
                <Text style={styles.emptyText}>
                  Todavia no hay controles de desparasitacion para este paciente.
                </Text>
              </View>
            ) : (
              visibleRecords.map((record) => (
                <View key={record.desparasitacionId} style={styles.recordCard}>
                  <Text style={styles.recordTitle}>
                    {record.producto ?? 'Producto no definido'}
                  </Text>
                  <Text style={styles.recordText}>
                    Paciente: {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                  </Text>
                  <Text style={styles.recordText}>
                    Aplicado: {formatRecordDate(record.fecha)}
                  </Text>
                  <Text style={styles.recordText}>
                    Dosis: {record.dosis ?? 'Sin dato'}
                  </Text>
                  <Text style={styles.recordText}>
                    Proxima fecha: {formatRecordDate(record.proximafecha)}
                  </Text>
                  {record.observaciones ? (
                    <Text style={styles.recordText}>Observaciones: {record.observaciones}</Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('DesparasitacionCreate')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 120,
    backgroundColor: '#071120',
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  eyebrow: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#F4F8FF',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 10,
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    marginHorizontal: -5,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  metricLabel: {
    marginTop: 6,
    color: '#C9D7E8',
    fontSize: 13,
  },
  filterCard: {
    backgroundColor: '#071120',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 18,
  },
  label: {
    color: '#F4F8FF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  highlightCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#29B6FF18',
    borderWidth: 1,
    borderColor: '#29B6FF',
  },
  highlightLabel: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  highlightTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  highlightText: {
    marginTop: 4,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  loadingCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#C9D7E8',
  },
  calendarCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 18,
    backgroundColor: '#071120',
  },
  emptyCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: '#9FB3C8',
    lineHeight: 20,
  },
  dayCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  recordCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    paddingRight: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  badgeSuccess: {
    backgroundColor: '#38F28E18',
    borderColor: '#38F28E',
  },
  badgeWarning: {
    backgroundColor: '#FF4D7318',
    borderColor: '#FF4D73',
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  badgeTextSuccess: {
    color: '#38F28E',
  },
  badgeTextWarning: {
    color: '#FF4D73',
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#071120',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#071120',
    marginRight: 6,
  },
  cancelButtonText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#29B6FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginLeft: 6,
  },
  primaryButtonText: {
    color: '#F4F8FF',
    fontWeight: '900',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
  },
});
