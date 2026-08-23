/**
 * @file App movil/GestionSaludExpo/src/screens/VacunaFormScreen.tsx
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
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { parseCalendarDate } from '../utils/localDate';
import { WebTimeInput } from '../components/WebTimeInput';
import { getJsonWithOfflineFallback } from '../utils/offlineReadCache';

const webPickerInputStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 52,
  borderRadius: 14,
  border: '1px solid #27496D',
  backgroundColor: '#071120',
  color: '#F4F8FF',
  padding: '0 14px',
  fontFamily: '"SpaceGrotesk_400Regular", "Segoe UI", Arial, sans-serif',
  fontSize: 15,
  fontWeight: 700,
  outline: 'none',
  colorScheme: 'dark',
};

type PickerField = 'fecha' | 'proximaDosis' | 'notificationDate' | 'notificationTime';

type VacunaRecord = {
  vacunaId: number;
  pacienteId: number;
  nombre: string;
  fechaaplicacion?: string | null;
  lote?: string | null;
  proximadosis?: string | null;
  creadoen?: string | null;
};

type CalendarMarks = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dots?: Array<{
      key: string;
      color: string;
    }>;
  };
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return '';
    }
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateOnlyString(parsed);
  }
  return '';
};

const parseDateForPicker = (value?: string) => {
  return parseCalendarDate(value) ?? new Date();
};

const parseTimeForPicker = (value?: string) => {
  const base = new Date();
  base.setSeconds(0, 0);
  const segments = value?.split(':').map((segment) => Number(segment)) ?? [];
  if (segments.length === 2 && segments.every((segment) => !Number.isNaN(segment))) {
    base.setHours(segments[0], segments[1], 0, 0);
    return base;
  }
  base.setHours(8, 0, 0, 0);
  return base;
};

const formatDisplayDate = (value?: string, fallbackLabel = 'Selecciona fecha') => {
  if (!value) {
    return fallbackLabel;
  }
  const parsed = parseCalendarDate(value);
  if (parsed) {
    return parsed.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return value;
};

const formatDisplayTime = (value?: string) => {
  if (!value) {
    return 'Selecciona hora';
  }
  return parseTimeForPicker(value).toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRecordDate = (value?: string | null) =>
  formatDisplayDate(value ?? undefined, 'Sin fecha registrada');

const formatNextDose = (value?: string | null) =>
  value ? formatDisplayDate(value ?? undefined, 'Sin fecha programada') : 'Sin proxima dosis';

const composeDateTime = (dateValue?: string, timeValue?: string) => {
  if (!dateValue || !timeValue) {
    return '';
  }
  return `${dateValue}T${timeValue}`;
};

const todayString = () => toDateOnlyString(new Date());

export function VacunaFormScreen() {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 900;
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const [form, setForm] = useState({
    pacienteId: '',
    nombre: '',
    fecha: '',
    lote: '',
    proximaDosis: '',
  });
  const [filterPacienteId, setFilterPacienteId] = useState('');
  const [notificationForm, setNotificationForm] = useState({
    mensaje: 'Recordatorio de proxima dosis de vacuna',
  });
  const [notificationDate, setNotificationDate] = useState('');
  const [notificationTime, setNotificationTime] = useState('08:00');
  const { token, user } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [showIOSFechaPicker, setShowIOSFechaPicker] = useState(false);
  const [showIOSProximaPicker, setShowIOSProximaPicker] = useState(false);
  const [showIOSNotificationDatePicker, setShowIOSNotificationDatePicker] = useState(false);
  const [showIOSNotificationTimePicker, setShowIOSNotificationTimePicker] = useState(false);
  const [records, setRecords] = useState<VacunaRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [showDaySection, setShowDaySection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: keyof typeof notificationForm, value: string) => {
    setNotificationForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }

    setLoadingPatients(true);
    setPatientError(null);
    try {
      const items = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      setPatientOptions(items);
    } catch (error) {
      setPatientError(error instanceof Error ? error.message : 'Fallo al cargar personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const mapRecords = (payload: any[]): VacunaRecord[] =>
    payload
      .map((item) => {
        const rawId = item?.pacienteId ?? item?.pacienteid;
        const pacienteId = Number(rawId);
        if (!Number.isFinite(pacienteId)) {
          return null;
        }
        return {
          vacunaId: item?.vacunaId ?? item?.vacunaid ?? item?.id ?? Math.random(),
          pacienteId,
          nombre: item?.nombre ?? 'Vacuna sin nombre',
          fechaaplicacion: item?.fechaaplicacion ?? item?.fechaAplicacion ?? null,
          lote: item?.lote ?? null,
          proximadosis: item?.proximadosis ?? item?.proximaDosis ?? null,
          creadoen: item?.creadoen ?? item?.creadoEn ?? null,
        } as VacunaRecord;
      })
      .filter((item): item is VacunaRecord => Boolean(item));

  const fetchVaccines = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setLoadingRecords(false);
      setRefreshing(false);
      return;
    }

    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const { data: body } = await getJsonWithOfflineFallback<unknown>(
        '/vacuna',
        authHeaders,
      );
      const data = Array.isArray(body) ? mapRecords(body) : [];
      setRecords(data);
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'No se pudieron cargar las vacunas');
      setRecords([]);
    } finally {
      setLoadingRecords(false);
      setRefreshing(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchVaccines();
  }, [fetchVaccines]);

  useEffect(() => {
    if (!form.pacienteId && patientOptions.length > 0) {
      handleChange('pacienteId', String(patientOptions[0].pacienteId));
    }
  }, [patientOptions, form.pacienteId]);

  useEffect(() => {
    if (form.proximaDosis && !notificationDate) {
      setNotificationDate(form.proximaDosis);
    }
  }, [form.proximaDosis, notificationDate]);

  useEffect(() => {
    if (!form.proximaDosis) {
      setShowNotificationForm(false);
      setNotificationDate('');
      setNotificationTime('08:00');
    }
  }, [form.proximaDosis]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const activePatientId = filterPacienteId ? Number(filterPacienteId) : null;

  const visibleRecords = useMemo(() => {
    if (!activePatientId) {
      return records;
    }
    return records.filter((record) => record.pacienteId === activePatientId);
  }, [records, activePatientId]);

  const markedDates = useMemo<CalendarMarks>(() => {
    const marks: CalendarMarks = {};

    visibleRecords.forEach((record) => {
      const applicationDate = toDateOnlyString(record.fechaaplicacion);
      if (applicationDate) {
        const existing = marks[applicationDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `application-${record.vacunaId}`)) {
          dots.push({ key: `application-${record.vacunaId}`, color: '#38E28E' });
        }
        marks[applicationDate] = {
          ...existing,
          marked: true,
          dots,
        };
      }

      const nextDoseDate = toDateOnlyString(record.proximadosis);
      if (nextDoseDate) {
        const existing = marks[nextDoseDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `next-dose-${record.vacunaId}`)) {
          dots.push({ key: `next-dose-${record.vacunaId}`, color: '#FF4D73' });
        }
        marks[nextDoseDate] = {
          ...existing,
          marked: true,
          dots,
        };
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

  const recordsForSelectedDay = useMemo(() => {
    if (!selectedDate) {
      return [] as Array<
        VacunaRecord & {
          dayType: 'aplicacion' | 'proxima';
        }
      >;
    }

    const entries: Array<
      VacunaRecord & {
        dayType: 'aplicacion' | 'proxima';
      }
    > = [];

    visibleRecords.forEach((record) => {
      if (toDateOnlyString(record.fechaaplicacion) === selectedDate) {
        entries.push({ ...record, dayType: 'aplicacion' });
      }
      if (toDateOnlyString(record.proximadosis) === selectedDate) {
        entries.push({ ...record, dayType: 'proxima' });
      }
    });

    return entries;
  }, [selectedDate, visibleRecords]);

  const hasDayRecords = recordsForSelectedDay.length > 0;
  const hasHistoryRecords = visibleRecords.length > 0;

  useEffect(() => {
    if (!hasDayRecords && showDaySection) {
      setShowDaySection(false);
    }
  }, [hasDayRecords, showDaySection]);

  useEffect(() => {
    if (!hasHistoryRecords && showHistorySection) {
      setShowHistorySection(false);
    }
  }, [hasHistoryRecords, showHistorySection]);

  const showPicker = (field: PickerField) => {
    const isNotificationField = field === 'notificationDate' || field === 'notificationTime';
    const isTimeField = field === 'notificationTime';
    const currentDateValue = isNotificationField ? notificationDate : form[field];
    const currentTimeValue = notificationTime;

    if (Platform.OS === 'web') {
      const handled = openWebDateTimePicker(
        isTimeField ? 'time' : 'date',
        isTimeField ? currentTimeValue : currentDateValue,
        (value) => {
          if (isTimeField) {
            setNotificationTime(value);
            return;
          }
          if (field === 'notificationDate') {
            setNotificationDate(value);
          } else {
            handleChange(field, value);
          }
        },
      );
      if (handled) return;
    }

    if (Platform.OS === 'android') {
      if (!isTimeField) {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(currentDateValue),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) {
              return;
            }
            const formatted = toDateOnlyString(selected);
            if (field === 'notificationDate') {
              setNotificationDate(formatted);
            } else {
              handleChange(field, formatted);
            }
          },
        });
        return;
      }

      DateTimePickerAndroid.open({
        value: parseTimeForPicker(currentTimeValue),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            setNotificationTime(
              `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
            );
          }
        },
      });
      return;
    }

    if (field === 'fecha') setShowIOSFechaPicker(true);
    if (field === 'proximaDosis') setShowIOSProximaPicker(true);
    if (field === 'notificationDate') setShowIOSNotificationDatePicker(true);
    if (field === 'notificationTime') setShowIOSNotificationTimePicker(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVaccines();
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.nombre || !form.fecha) {
      Alert.alert('Faltan Datos', 'Paciente, nombre y fecha son requeridos');
      return;
    }

    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/vacuna',
        method: 'POST',
        description: 'registrar vacuna',
        body: {
          pacienteId: Number(form.pacienteId),
          nombre: form.nombre,
          fechaaplicacion: form.fecha,
          lote: form.lote || undefined,
          proximadosis: form.proximaDosis || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Vacuna en cola',
          'No habia conexion. La dosis quedo guardada en el dispositivo y se enviara automaticamente cuando vuelva la red.',
        );
      } else {
        Alert.alert('Vacuna registrada', 'El carnet fue actualizado.');
        fetchVaccines();
      }

      setForm({ pacienteId: '', nombre: '', fecha: '', lote: '', proximaDosis: '' });
      setNotificationDate('');
      setNotificationTime('08:00');
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  };

  const handleCreateNotification = async () => {
    const scheduledAt = composeDateTime(notificationDate, notificationTime);

    if (!form.pacienteId || !scheduledAt || !notificationForm.mensaje.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha, hora y mensaje son obligatorios para la notificacion.');
      return;
    }

    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/notificacion',
        method: 'POST',
        description: 'crear notificacion de vacuna',
        body: {
          pacienteId: Number(form.pacienteId),
          tipo: 'vacuna_proxima_dosis',
          mensaje: notificationForm.mensaje.trim(),
          fechaprogramada: scheduledAt,
          medio: 'push',
          entidadorigen: 'vacuna',
          campoprueba03: `Vacuna: ${form.nombre.trim() || 'Proxima dosis'}`.slice(0, 200),
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Notificacion en cola',
          offlineResult.localReminder === 'scheduled'
            ? 'No había conexión. La notificación quedó programada en este dispositivo y se sincronizará después.'
            : 'La notificación quedó pendiente de sincronización. Revisa los permisos de notificaciones del dispositivo.',
        );
      } else {
        Alert.alert(
          'Notificacion creada',
          offlineResult.localReminder === 'scheduled'
            ? 'El aviso de la próxima dosis funcionará también sin conexión.'
            : 'La notificación fue registrada. Revisa los permisos del dispositivo para recibirla localmente.',
        );
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la notificacion');
    }
  };

  const renderIOSPicker = (field: PickerField) => {
    const visible =
      field === 'fecha'
        ? showIOSFechaPicker
        : field === 'proximaDosis'
          ? showIOSProximaPicker
          : field === 'notificationDate'
            ? showIOSNotificationDatePicker
            : showIOSNotificationTimePicker;

    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }

    const isTimeField = field === 'notificationTime';
    const currentDateValue = field === 'notificationDate' ? notificationDate : form[field as 'fecha' | 'proximaDosis'];
    const currentTimeValue = notificationTime;

    return (
      <View style={styles.iosPickerWrapper}>
        <DateTimePicker
          mode={isTimeField ? 'time' : 'date'}
          display="spinner"
          locale="es-NI"
          value={isTimeField ? parseTimeForPicker(currentTimeValue) : parseDateForPicker(currentDateValue)}
          onChange={(_, selected) => {
            if (!selected) {
              return;
            }
            if (isTimeField) {
              setNotificationTime(
                `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
              );
              return;
            }
            const formatted = toDateOnlyString(selected);
            if (field === 'notificationDate') {
              setNotificationDate(formatted);
            } else {
              handleChange(field, formatted);
            }
          }}
        />
        <TouchableOpacity
          style={styles.iosPickerDoneBtn}
          onPress={() => {
            if (field === 'fecha') setShowIOSFechaPicker(false);
            if (field === 'proximaDosis') setShowIOSProximaPicker(false);
            if (field === 'notificationDate') setShowIOSNotificationDatePicker(false);
            if (field === 'notificationTime') setShowIOSNotificationTimePicker(false);
          }}
        >
          <AppText style={styles.iosPickerDoneText}>Listo</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWideLayout && styles.contentWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.heroCard}>
          <AppText style={styles.kicker}>VACUNAS</AppText>
          <AppText style={styles.title}>Control de dosis y refuerzos</AppText>
          <AppText style={styles.subtitle}>
            Revisa el calendario, despliega el historial cuando lo necesites y programa una notificacion push para la proxima dosis.
          </AppText>
        </View>

        {recordsError ? <AppText style={styles.errorText}>{recordsError}</AppText> : null}

        <View style={styles.filterCard}>
          <AppText style={styles.label}>Filtrar por persona</AppText>
          {loadingPatients ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#29B6FF" />
              <AppText style={styles.loadingText}>Cargando personas...</AppText>
            </View>
          ) : patientOptions.length === 0 ? (
            <View style={styles.emptyBox}>
              <AppText style={styles.emptyText}>No hay personas vinculadas para aplicar filtros.</AppText>
              <TouchableOpacity style={styles.secondaryBtn} onPress={fetchPatients}>
                <AppText style={styles.secondaryBtnText}>Reintentar</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={filterPacienteId}
                onValueChange={(value) => setFilterPacienteId(String(value))}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item label="Todas las personas" value="" color={pickerItemColor} />
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
          )}
        </View>

        <View style={styles.calendarCard}>
          <AppText style={styles.formTitle}>Calendario de vacunas</AppText>
          {loadingRecords ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#29B6FF" />
              <AppText style={styles.stateText}>Cargando calendario...</AppText>
            </View>
          ) : visibleRecords.length === 0 ? (
            <View style={styles.stateBox}>
              <AppText style={styles.stateTitle}>Sin fechas registradas</AppText>
              <AppText style={styles.stateText}>
                Agrega una vacuna para ver las dosis marcadas en el calendario.
              </AppText>
            </View>
          ) : (
            <Calendar
              markedDates={markedDates}
              markingType="multi-dot"
              onDayPress={handleDayPress}
              initialDate={selectedDate || undefined}
              enableSwipeMonths
              firstDay={1}
              theme={{
                calendarBackground: '#0D1B2A',
                dayTextColor: '#F4F8FF',
                monthTextColor: '#F4F8FF',
                textSectionTitleColor: '#29B6FF',
                todayTextColor: '#38E28E',
                arrowColor: '#29B6FF',
                selectedDayBackgroundColor: '#29B6FF',
                selectedDayTextColor: '#F4F8FF',
              }}
              style={styles.calendar}
            />
          )}
        </View>

        <View style={styles.daySection}>
          <TouchableOpacity
            style={[styles.sectionToggle, !hasDayRecords && styles.sectionToggleDisabled]}
            onPress={() => {
              if (hasDayRecords) {
                setShowDaySection((prev) => !prev);
              }
            }}
            activeOpacity={0.85}
            disabled={!hasDayRecords}
          >
            <View style={styles.sectionToggleCopy}>
              <AppText style={styles.formTitle}>Dosis del dia</AppText>
              <AppText style={styles.sectionHelper}>
                {!hasDayRecords
                  ? 'No hay vacunas para desplegar en esta fecha'
                  : showDaySection
                    ? 'Ocultar vacunas de la fecha seleccionada'
                    : 'Desplegar vacunas de la fecha seleccionada'}
              </AppText>
            </View>
            <View style={styles.sectionToggleActions}>
              <View style={styles.countBadge}>
                <AppText style={styles.countBadgeText}>{recordsForSelectedDay.length}</AppText>
              </View>
              <AppText style={[styles.sectionToggleIcon, !hasDayRecords && styles.sectionToggleIconDisabled]}>
                {hasDayRecords ? (showDaySection ? '-' : '+') : ''}
              </AppText>
            </View>
          </TouchableOpacity>

          {showDaySection && hasDayRecords ? (
            <>
              <AppText style={styles.dayLabel}>{formatDisplayDate(selectedDate, selectedDate)}</AppText>
              {recordsForSelectedDay.map((record) => {
                  const label = patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`;
                  return (
                    <View key={`day-${record.vacunaId}-${record.dayType}`} style={styles.vaccineCard}>
                      <View style={styles.vaccineHeader}>
                        <View>
                          <AppText style={styles.vaccineName}>{record.nombre}</AppText>
                          <AppText style={styles.vaccineMeta}>{label}</AppText>
                        </View>
                        <View
                          style={[
                            styles.dayTypeBadge,
                            record.dayType === 'proxima' ? styles.dayTypeNext : styles.dayTypeApplied,
                          ]}
                        >
                          <AppText style={styles.dayTypeBadgeText}>
                            {record.dayType === 'proxima' ? 'Proxima dosis' : 'Aplicada'}
                          </AppText>
                        </View>
                      </View>
                      {record.lote ? <AppText style={styles.vaccineDetail}>Lote: {record.lote}</AppText> : null}
                      <AppText style={styles.vaccineDetail}>
                        Proxima dosis:{' '}
                        <AppText style={styles.vaccineHighlight}>{formatNextDose(record.proximadosis)}</AppText>
                      </AppText>
                    </View>
                  );
                })}
            </>
          ) : null}
        </View>

        <View style={styles.recordsSection}>
          <TouchableOpacity
            style={[styles.sectionToggle, !hasHistoryRecords && styles.sectionToggleDisabled]}
            onPress={() => {
              if (hasHistoryRecords) {
                setShowHistorySection((prev) => !prev);
              }
            }}
            activeOpacity={0.85}
            disabled={!hasHistoryRecords}
          >
            <View style={styles.sectionToggleCopy}>
              <AppText style={styles.formTitle}>Historial completo</AppText>
              <AppText style={styles.sectionHelper}>
                {!hasHistoryRecords
                  ? activePatientId
                    ? 'Este paciente no tiene vacunas para mostrar'
                    : 'No hay vacunas registradas para mostrar'
                  : showHistorySection
                    ? 'Ocultar vacunas anteriores'
                    : 'Desplegar vacunas anteriores'}
              </AppText>
            </View>
            <View style={styles.sectionToggleActions}>
              <View style={styles.countBadge}>
                <AppText style={styles.countBadgeText}>{visibleRecords.length}</AppText>
              </View>
              <AppText style={[styles.sectionToggleIcon, !hasHistoryRecords && styles.sectionToggleIconDisabled]}>
                {hasHistoryRecords ? (showHistorySection ? '-' : '+') : ''}
              </AppText>
            </View>
          </TouchableOpacity>

          {showHistorySection && hasHistoryRecords ? (
            loadingRecords ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color="#29B6FF" />
                <AppText style={styles.stateText}>Cargando vacunas...</AppText>
              </View>
            ) : (
              visibleRecords.map((record) => {
                const label = patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`;
                return (
                  <View key={record.vacunaId} style={styles.vaccineCard}>
                    <View style={styles.vaccineHeader}>
                      <View>
                        <AppText style={styles.vaccineName}>{record.nombre}</AppText>
                        <AppText style={styles.vaccineMeta}>
                          {label} · Aplicada {formatRecordDate(record.fechaaplicacion)}
                        </AppText>
                      </View>
                    </View>
                    {record.lote ? <AppText style={styles.vaccineDetail}>Lote: {record.lote}</AppText> : null}
                    <AppText style={styles.vaccineDetail}>
                      Proxima dosis:{' '}
                      <AppText style={styles.vaccineHighlight}>{formatNextDose(record.proximadosis)}</AppText>
                    </AppText>
                  </View>
                );
              })
            )
          ) : null}
        </View>

        {showForm ? (
          <View style={styles.formCard}>
            <AppText style={styles.formTitle}>Registrar vacuna</AppText>

            <AppText style={styles.label}>Paciente</AppText>
            {loadingPatients ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#29B6FF" />
                <AppText style={styles.loadingText}>Cargando personas...</AppText>
              </View>
            ) : patientOptions.length === 0 ? (
              <View style={styles.emptyBox}>
                <AppText style={styles.emptyText}>
                  No hay personas vinculadas. Crea una desde Gestionar Expediente.
                </AppText>
                <TouchableOpacity style={styles.secondaryBtn} onPress={fetchPatients}>
                  <AppText style={styles.secondaryBtnText}>Reintentar</AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.pacienteId}
                  onValueChange={(value) => handleChange('pacienteId', String(value))}
                  dropdownIconColor="#F4F8FF"
                >
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
            )}
            {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}

            <AppText style={styles.label}>Nombre vacuna</AppText>
            <AppTextInput
              style={styles.input}
              placeholder="Nombre vacuna"
              placeholderTextColor="#9FB3C8"
              value={form.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
            />

            <View style={[styles.formGrid, isWideLayout && styles.formGridWide]}>
              <View style={styles.formField}>
                <AppText style={styles.label}>Fecha de aplicacion</AppText>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: form.fecha,
                    onChange: (event: any) => handleChange('fecha', event.target.value),
                    style: webPickerInputStyle,
                    'aria-label': 'Fecha de aplicacion',
                  })
                ) : (
                  <>
                    <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fecha')}>
                      <AppText style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</AppText>
                    </TouchableOpacity>
                    {renderIOSPicker('fecha')}
                  </>
                )}
              </View>

              <View style={styles.formField}>
                <AppText style={styles.label}>Lote</AppText>
                <AppTextInput
                  style={styles.input}
                  placeholder="Lote"
                  placeholderTextColor="#9FB3C8"
                  value={form.lote}
                  onChangeText={(value) => handleChange('lote', value)}
                />
              </View>

              <View style={styles.formField}>
                <AppText style={styles.label}>Proxima dosis</AppText>
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: form.proximaDosis,
                    onChange: (event: any) => handleChange('proximaDosis', event.target.value),
                    style: webPickerInputStyle,
                    'aria-label': 'Proxima dosis',
                  })
                ) : (
                  <>
                    <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('proximaDosis')}>
                      <AppText style={styles.dateButtonText}>
                        {form.proximaDosis ? formatDisplayDate(form.proximaDosis) : 'Opcional'}
                      </AppText>
                    </TouchableOpacity>
                    {renderIOSPicker('proximaDosis')}
                  </>
                )}
              </View>
            </View>

            {form.proximaDosis ? (
              <View style={styles.inlineNotificationCard}>
                <View style={styles.inlineNotificationCopy}>
                  <AppText style={styles.inlineNotificationTitle}>Notificacion de proxima dosis</AppText>
                  <AppText style={styles.inlineNotificationHint}>
                    Programa un aviso push para la fecha de la siguiente dosis.
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[
                    styles.inlineNotificationToggle,
                    showNotificationForm && styles.inlineNotificationToggleActive,
                  ]}
                  onPress={() => setShowNotificationForm((prev) => !prev)}
                >
                  <AppText style={styles.inlineNotificationToggleText}>
                    {showNotificationForm ? 'Ocultar' : 'Crear'}
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <AppText style={styles.sectionHelper}>
                Agrega una fecha de proxima dosis si quieres crear una notificacion.
              </AppText>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <AppText style={styles.btnText}>Guardar vacuna</AppText>
            </TouchableOpacity>

            {showNotificationForm ? (
              <View style={styles.notificationCard}>
                <AppText style={styles.formTitle}>Notificacion de proxima dosis</AppText>
                <AppText style={styles.sectionHelper}>
                  El canal queda fijo como notificacion push.
                </AppText>

                <AppText style={styles.label}>Canal</AppText>
                <View style={styles.fixedChannelCard}>
                  <AppText style={styles.fixedChannelText}>Notificacion push</AppText>
                </View>

                <AppText style={styles.label}>Mensaje</AppText>
                <AppTextInput
                  style={[styles.input, styles.multiline]}
                  placeholder="Mensaje de la notificacion"
                  placeholderTextColor="#9FB3C8"
                  value={notificationForm.mensaje}
                  multiline
                  onChangeText={(value) => handleNotificationChange('mensaje', value)}
                />

                <AppText style={styles.label}>Fecha y hora del aviso</AppText>
                <View style={styles.dateTimeRow}>
                  {Platform.OS === 'web' ? (
                    <>
                      {React.createElement('input', {
                        type: 'date',
                        value: notificationDate,
                        onChange: (event: any) => setNotificationDate(event.target.value),
                        style: webPickerInputStyle,
                        'aria-label': 'Fecha del aviso',
                      })}
                      <WebTimeInput
                        value={notificationTime}
                        onChange={setNotificationTime}
                        ariaLabel="Hora del aviso de vacunacion"
                      />
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('notificationDate')}>
                        <AppText style={styles.dateButtonText}>{formatDisplayDate(notificationDate)}</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('notificationTime')}>
                        <AppText style={styles.dateButtonText}>{formatDisplayTime(notificationTime)}</AppText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {renderIOSPicker('notificationDate')}
                {renderIOSPicker('notificationTime')}

                <TouchableOpacity style={styles.notificationBtn} onPress={handleCreateNotification}>
                  <AppText style={styles.notificationBtnText}>Crear notificacion push</AppText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <AppText style={styles.fabText}>{showForm ? 'x' : '+'}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    padding: 24,
    paddingBottom: 110,
    gap: 16,
  },
  contentWide: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingTop: 26,
  },
  heroCard: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  kicker: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F4F8FF',
    lineHeight: 34,
  },
  subtitle: {
    color: '#C9D7E8',
    lineHeight: 20,
    marginTop: 8,
  },
  filterCard: {
    backgroundColor: '#071120',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  calendarCard: {
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  daySection: {
    backgroundColor: '#071120',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  recordsSection: {
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  notificationCard: {
    marginTop: 8,
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  sectionHelper: {
    color: '#29B6FF',
    lineHeight: 19,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionToggleDisabled: {
    opacity: 0.62,
  },
  sectionToggleCopy: {
    flex: 1,
  },
  sectionToggleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionToggleIcon: {
    color: '#F4F8FF',
    fontSize: 24,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  sectionToggleIconDisabled: {
    color: '#9FB3C8',
  },
  countBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#071120',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F8FF',
  },
  formGrid: {
    gap: 12,
  },
  formGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formField: {
    flex: 1,
    minWidth: 240,
    gap: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  fixedChannelCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: '#071120',
  },
  fixedChannelText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '600',
  },
  inlineNotificationCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#071120',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inlineNotificationCopy: {
    flex: 1,
    gap: 4,
  },
  inlineNotificationTitle: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineNotificationHint: {
    color: '#29B6FF',
    lineHeight: 18,
  },
  inlineNotificationToggle: {
    minWidth: 90,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
  },
  inlineNotificationToggleActive: {
    backgroundColor: '#29B6FF',
  },
  inlineNotificationToggleText: {
    color: '#F4F8FF',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  webDateInput: {
    minHeight: 52,
  },
  webDateTimeInput: {
    minHeight: 52,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    backgroundColor: '#071120',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#F4F8FF',
    textAlign: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#38E28E',
    minHeight: 54,
    borderRadius: 14,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  notificationBtn: {
    backgroundColor: '#38E28E',
    minHeight: 52,
    borderRadius: 14,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBtnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#C9D7E8',
  },
  stateBox: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F8FF',
  },
  stateText: {
    color: '#9FB3C8',
    textAlign: 'center',
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#071120',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: '#C9D7E8',
  },
  errorText: {
    color: '#FF4D73',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF4D73',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#F4F8FF',
    fontWeight: '600',
  },
  calendar: {
    borderRadius: 16,
  },
  dayLabel: {
    color: '#29B6FF',
    fontWeight: '600',
  },
  dayTypeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  dayTypeApplied: {
    backgroundColor: '#38E28E18',
  },
  dayTypeNext: {
    backgroundColor: '#FF4D7318',
  },
  dayTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071120',
  },
  vaccineCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F4F8FF',
  },
  vaccineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vaccineName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#071120',
  },
  vaccineMeta: {
    color: '#9FB3C8',
  },
  vaccineDetail: {
    color: '#27496D',
  },
  vaccineHighlight: {
    fontWeight: '700',
    color: '#071120',
  },
  iosPickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#27496D',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#071120',
  },
  iosPickerDoneText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
