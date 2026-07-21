import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Calendar, type DateData, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type RegistroDentalRecord = {
  registrodentalId: number;
  pacienteId: number;
  fechaatencion: string;
  procedimiento: string;
  diagnostico?: string | null;
  odontologo?: string | null;
  piezastratadas?: string | null;
  notas?: string | null;
};

type PatientDentalSummary = {
  pacienteId: number;
  patientName: string;
  total: number;
  latestDate: string | null;
  latestProcedure: string | null;
  odontologos: string[];
};

type DatePickerField = 'date' | 'time' | 'notification-date' | 'notification-time';
type TimePickerField = Extract<DatePickerField, 'time' | 'notification-time'>;
type CalendarPickerField = Extract<DatePickerField, 'date' | 'notification-date'>;

LocaleConfig.locales.es = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  monthNamesShort: [
    'Ene.',
    'Feb.',
    'Mar.',
    'Abr.',
    'May.',
    'Jun.',
    'Jul.',
    'Ago.',
    'Sept.',
    'Oct.',
    'Nov.',
    'Dic.',
  ],
  dayNames: [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

type FormState = {
  pacienteId: string;
  fechaAtencion: string;
  procedimiento: string;
  diagnostico: string;
  odontologo: string;
  piezasTratadas: string;
  notas: string;
};

type RegistroDentalFormScreenProps = {
  mode?: 'list' | 'create';
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const trimmed = String(input).trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  if (value) {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      return new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      );
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const parseTimeForPicker = (value?: string) => {
  const base = new Date();
  base.setSeconds(0, 0);
  const parts = value?.split(':').map(Number) ?? [];
  if (parts.length === 2 && parts.every((part) => !Number.isNaN(part))) {
    base.setHours(parts[0], parts[1], 0, 0);
    return base;
  }
  base.setHours(9, 0, 0, 0);
  return base;
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  const parsed = parseDateForPicker(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeLabel = (value?: string) => {
  if (!value) return 'Selecciona hora';
  const parts = value.split(':');
  if (parts.length >= 2) {
    const hour = Number(parts[0]);
    if (Number.isFinite(hour)) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${String(hour12).padStart(2, '0')}:${parts[1]} ${period}`;
    }
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('es-NI', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  return value;
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

export function RegistroDentalFormScreen({ mode = 'list' }: RegistroDentalFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<RegistroDentalRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateValue, setDateValue] = useState(toDateOnlyString(new Date()));
  const [timeValue, setTimeValue] = useState('09:00');
  const [showNotificationDatePicker, setShowNotificationDatePicker] = useState(false);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [webDatePickerField, setWebDatePickerField] =
    useState<CalendarPickerField | null>(null);
  const [webTimePickerField, setWebTimePickerField] = useState<TimePickerField | null>(null);
  const [createNotification, setCreateNotification] = useState(false);
  const [notificationDate, setNotificationDate] = useState(toDateOnlyString(new Date()));
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [notificationMessage, setNotificationMessage] = useState(
    'Recordatorio de seguimiento de atencion dental',
  );
  const [form, setForm] = useState<FormState>({
    pacienteId: user?.pacienteId ? String(user.pacienteId) : '',
    fechaAtencion: '',
    procedimiento: '',
    diagnostico: '',
    odontologo: '',
    piezasTratadas: '',
    notas: '',
  });

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback(() => {
    setDateValue(toDateOnlyString(new Date()));
    setTimeValue('09:00');
    setCreateNotification(false);
    setNotificationDate(toDateOnlyString(new Date()));
    setNotificationTime('08:00');
    setNotificationMessage('Recordatorio de seguimiento de atencion dental');
    setForm({
      pacienteId: user?.pacienteId ? String(user.pacienteId) : '',
      fechaAtencion: '',
      procedimiento: '',
      diagnostico: '',
      odontologo: '',
      piezasTratadas: '',
      notas: '',
    });
  }, [user?.pacienteId]);

  useEffect(() => {
    if (!createNotification) {
      return;
    }
    if (notificationDate !== dateValue) {
      setNotificationDate(dateValue);
    }
  }, [createNotification, dateValue, notificationDate]);

  useEffect(() => {
    if (!createNotification) {
      return;
    }
    const procedure = form.procedimiento.trim();
    setNotificationMessage(
      procedure
        ? `Recordatorio de seguimiento dental: ${procedure}`
        : 'Recordatorio de seguimiento de atencion dental',
    );
  }, [createNotification, form.procedimiento]);

  const fetchPatients = useCallback(async () => {
    if (!token) return;
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
      setForm((prev) => {
        if (prev.pacienteId || normalized.length === 0) return prev;
        return { ...prev, pacienteId: String(normalized[0].pacienteId) };
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/registrodental`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar los registros dentales');
      }
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any, index: number) => ({
            registrodentalId: Number(
              item?.registrodentalId ?? item?.registrodentalid ?? item?.id ?? index + 1,
            ),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            fechaatencion: item?.fechaatencion ?? '',
            procedimiento: normalizeText(item?.procedimiento) ?? '',
            diagnostico: normalizeText(item?.diagnostico),
            odontologo: normalizeText(item?.odontologo),
            piezastratadas: normalizeText(item?.piezastratadas ?? item?.piezasTratadas),
            notas: normalizeText(item?.notas),
          }))
          .filter(
            (item: RegistroDentalRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0,
          )
          .sort(
            (a: RegistroDentalRecord, b: RegistroDentalRecord) =>
              new Date(b.fechaatencion).getTime() - new Date(a.fechaatencion).getTime(),
          ),
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Fallo al cargar registros dentales',
      );
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
      fetchRecords();
    }, [fetchPatients, fetchRecords]),
  );

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return records.filter((record) => record.pacienteId === activePatientId);
    }
    return records;
  }, [records, selectedPatientId]);

  const patientSummaries = useMemo<PatientDentalSummary[]>(() => {
    const grouped = new Map<number, RegistroDentalRecord[]>();
    records.forEach((record) => {
      const list = grouped.get(record.pacienteId) ?? [];
      list.push(record);
      grouped.set(record.pacienteId, list);
    });

    return Array.from(grouped.entries())
      .map(([pacienteId, items]) => ({
        pacienteId,
        patientName: patientNameById[pacienteId] ?? `Paciente #${pacienteId}`,
        total: items.length,
        latestDate: items[0]?.fechaatencion ?? null,
        latestProcedure: normalizeText(items[0]?.procedimiento),
        odontologos: Array.from(
          new Set(
            items
              .map((item) => normalizeText(item.odontologo))
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.latestDate ?? 0).getTime() - new Date(a.latestDate ?? 0).getTime(),
      );
  }, [patientNameById, records]);

  const visibleSummaries = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return patientSummaries.filter((summary) => summary.pacienteId === activePatientId);
    }
    return patientSummaries;
  }, [patientSummaries, selectedPatientId]);

  const showPicker = (field: DatePickerField) => {
    if (Platform.OS === 'web') {
      const isDateField = field === 'date' || field === 'notification-date';
      if (isDateField) {
        setWebDatePickerField(field);
        return;
      } else {
        setWebTimePickerField(field);
        return;
      }
    }

    if (Platform.OS === 'android') {
      if (field === 'date' || field === 'notification-date') {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(field === 'date' ? dateValue : notificationDate),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              const formatted = toDateOnlyString(selected);
              if (field === 'date') {
                setDateValue(formatted);
              } else {
                setNotificationDate(formatted);
              }
            }
          },
        });
      } else {
        DateTimePickerAndroid.open({
          value: parseTimeForPicker(field === 'time' ? timeValue : notificationTime),
          mode: 'time',
          is24Hour: false,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              const hh = String(selected.getHours()).padStart(2, '0');
              const mm = String(selected.getMinutes()).padStart(2, '0');
              if (field === 'time') {
                setTimeValue(`${hh}:${mm}`);
              } else {
                setNotificationTime(`${hh}:${mm}`);
              }
            }
          },
        });
      }
      return;
    }
    if (field === 'date') {
      setShowIOSDatePicker(true);
    } else if (field === 'time') {
      setShowIOSTimePicker(true);
    } else if (field === 'notification-date') {
      setShowNotificationDatePicker(true);
    } else {
      setShowNotificationTimePicker(true);
    }
  };

  const renderIOSPicker = (field: DatePickerField) => {
    const visible =
      field === 'date'
        ? showIOSDatePicker
        : field === 'time'
          ? showIOSTimePicker
          : field === 'notification-date'
            ? showNotificationDatePicker
            : showNotificationTimePicker;
    if (Platform.OS !== 'ios' || !visible) return null;
    const isDate = field === 'date' || field === 'notification-date';
    return (
      <View style={styles.iosPickerCard}>
        <DateTimePicker
          mode={isDate ? 'date' : 'time'}
          display="spinner"
          is24Hour={isDate ? undefined : false}
          value={
            isDate
              ? parseDateForPicker(field === 'date' ? dateValue : notificationDate)
              : parseTimeForPicker(field === 'time' ? timeValue : notificationTime)
          }
          onChange={(_, selected) => {
            if (!selected) return;
            if (isDate) {
              const formatted = toDateOnlyString(selected);
              if (field === 'date') {
                setDateValue(formatted);
              } else {
                setNotificationDate(formatted);
              }
            } else {
              const hh = String(selected.getHours()).padStart(2, '0');
              const mm = String(selected.getMinutes()).padStart(2, '0');
              if (field === 'time') {
                setTimeValue(`${hh}:${mm}`);
              } else {
                setNotificationTime(`${hh}:${mm}`);
              }
            }
          }}
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (field === 'date') setShowIOSDatePicker(false);
            if (field === 'time') setShowIOSTimePicker(false);
            if (field === 'notification-date') setShowNotificationDatePicker(false);
            if (field === 'notification-time') setShowNotificationTimePicker(false);
          }}
        >
          <Text style={styles.secondaryButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWebDatePicker = () => {
    if (Platform.OS !== 'web' || !webDatePickerField) return null;

    const selectedValue =
      webDatePickerField === 'date' ? dateValue : notificationDate;
    const updateSelectedDate = (value: string) => {
      if (webDatePickerField === 'date') {
        setDateValue(value);
      } else {
        setNotificationDate(value);
      }
    };
    const chooseRelativeDate = (daysFromToday: number) => {
      const nextDate = new Date();
      nextDate.setHours(12, 0, 0, 0);
      nextDate.setDate(nextDate.getDate() + daysFromToday);
      updateSelectedDate(toDateOnlyString(nextDate));
    };

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setWebDatePickerField(null)}
      >
        <View style={styles.timeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setWebDatePickerField(null)}
            accessibilityLabel="Cerrar selector de fecha"
          />
          <View style={[styles.timeModalCard, styles.dateModalCard]}>
            <View style={styles.timeModalHeader}>
              <View style={styles.dateModalHeaderCopy}>
                <Text style={styles.timeModalEyebrow}>
                  {webDatePickerField === 'date'
                    ? 'Fecha de atención'
                    : 'Fecha del recordatorio'}
                </Text>
                <Text style={styles.timeModalTitle}>Selecciona la fecha</Text>
                <Text style={styles.dateModalSelected}>
                  {formatDisplayDate(selectedValue)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.timeModalClose}
                onPress={() => setWebDatePickerField(null)}
                accessibilityLabel="Cerrar selector de fecha"
              >
                <Text style={styles.timeModalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Calendar
              current={selectedValue}
              firstDay={1}
              hideExtraDays
              enableSwipeMonths
              onDayPress={(day: DateData) => updateSelectedDate(day.dateString)}
              markedDates={{
                [selectedValue]: {
                  selected: true,
                  selectedColor: '#29B6FF',
                  selectedTextColor: '#03101F',
                },
              }}
              theme={{
                calendarBackground: '#071120',
                textSectionTitleColor: '#9FB3C8',
                selectedDayBackgroundColor: '#29B6FF',
                selectedDayTextColor: '#03101F',
                todayTextColor: '#38F28E',
                dayTextColor: '#F4F8FF',
                textDisabledColor: '#42566E',
                monthTextColor: '#F4F8FF',
                arrowColor: '#29B6FF',
                textDayFontWeight: '600',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '800',
              }}
              style={styles.dateCalendar}
            />

            <View style={styles.dateQuickActions}>
              {[
                { label: 'Hoy', days: 0 },
                { label: 'Mañana', days: 1 },
                { label: 'En 7 días', days: 7 },
              ].map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={styles.timeQuickButton}
                  onPress={() => chooseRelativeDate(option.days)}
                >
                  <Text style={styles.timeQuickButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.timeConfirmButton}
              onPress={() => setWebDatePickerField(null)}
            >
              <Text style={styles.timeConfirmButtonText}>Confirmar fecha</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderWebTimePicker = () => {
    if (Platform.OS !== 'web' || !webTimePickerField) return null;

    const selectedValue =
      webTimePickerField === 'time' ? timeValue : notificationTime;
    const [selectedHour = '08', selectedMinute = '00'] = selectedValue.split(':');
    const selectedHour24 = Number(selectedHour);
    const selectedPeriod = selectedHour24 >= 12 ? 'PM' : 'AM';
    const selectedHour12 = String(selectedHour24 % 12 || 12);
    const updateSelectedTime = (hour12: string, minute: string, period: string) => {
      const normalizedHour12 = Number(hour12) % 12;
      const hour24 = normalizedHour12 + (period === 'PM' ? 12 : 0);
      const nextValue = `${String(hour24).padStart(2, '0')}:${minute.padStart(2, '0')}`;
      if (webTimePickerField === 'time') {
        setTimeValue(nextValue);
      } else {
        setNotificationTime(nextValue);
      }
    };
    const chooseCurrentTime = () => {
      const now = new Date();
      const period = now.getHours() >= 12 ? 'PM' : 'AM';
      updateSelectedTime(
        String(now.getHours() % 12 || 12),
        String(now.getMinutes()),
        period,
      );
    };

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setWebTimePickerField(null)}
      >
        <View style={styles.timeModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setWebTimePickerField(null)}
            accessibilityLabel="Cerrar selector de hora"
          />
          <View style={styles.timeModalCard}>
            <View style={styles.timeModalHeader}>
              <View>
                <Text style={styles.timeModalEyebrow}>
                  {webTimePickerField === 'time' ? 'Hora de atención' : 'Hora del recordatorio'}
                </Text>
                <Text style={styles.timeModalTitle}>Selecciona la hora</Text>
              </View>
              <TouchableOpacity
                style={styles.timeModalClose}
                onPress={() => setWebTimePickerField(null)}
                accessibilityLabel="Cerrar selector de hora"
              >
                <Text style={styles.timeModalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timeModalValue}>
              {formatTimeLabel(selectedValue)}
            </Text>

            <View style={styles.timePickerColumns}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hora</Text>
                <View style={styles.timePickerWrapper}>
                  <Picker
                    selectedValue={selectedHour12}
                    onValueChange={(value) =>
                      updateSelectedTime(String(value), selectedMinute, selectedPeriod)
                    }
                    dropdownIconColor="#F4F8FF"
                    style={styles.timePicker}
                  >
                    {Array.from({ length: 12 }, (_, index) => {
                      const value = String(index + 1);
                      return (
                        <Picker.Item
                          key={value}
                          label={value.padStart(2, '0')}
                          value={value}
                        />
                      );
                    })}
                  </Picker>
                </View>
              </View>

              <Text style={styles.timePickerSeparator}>:</Text>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minutos</Text>
                <View style={styles.timePickerWrapper}>
                  <Picker
                    selectedValue={selectedMinute.padStart(2, '0')}
                    onValueChange={(value) =>
                      updateSelectedTime(selectedHour12, String(value), selectedPeriod)
                    }
                    dropdownIconColor="#F4F8FF"
                    style={styles.timePicker}
                  >
                    {Array.from({ length: 60 }, (_, minute) => {
                      const value = String(minute).padStart(2, '0');
                      return <Picker.Item key={value} label={value} value={value} />;
                    })}
                  </Picker>
                </View>
              </View>

              <View style={[styles.timePickerColumn, styles.periodPickerColumn]}>
                <Text style={styles.timePickerLabel}>Periodo</Text>
                <View style={styles.timePickerWrapper}>
                  <Picker
                    selectedValue={selectedPeriod}
                    onValueChange={(value) =>
                      updateSelectedTime(selectedHour12, selectedMinute, String(value))
                    }
                    dropdownIconColor="#F4F8FF"
                    style={styles.timePicker}
                  >
                    <Picker.Item label="AM" value="AM" />
                    <Picker.Item label="PM" value="PM" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.timeQuickActions}>
              <TouchableOpacity style={styles.timeQuickButton} onPress={chooseCurrentTime}>
                <Text style={styles.timeQuickButtonText}>Ahora</Text>
              </TouchableOpacity>
              {[
                { value: '08:00', label: '08:00 AM' },
                { value: '12:00', label: '12:00 PM' },
                { value: '18:00', label: '06:00 PM' },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.timeQuickButton,
                    selectedValue === preset.value ? styles.timeQuickButtonActive : null,
                  ]}
                  onPress={() => {
                    const [hour24, minute] = preset.value.split(':');
                    const numericHour = Number(hour24);
                    updateSelectedTime(
                      String(numericHour % 12 || 12),
                      minute,
                      numericHour >= 12 ? 'PM' : 'AM',
                    );
                  }}
                >
                  <Text style={styles.timeQuickButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.timeConfirmButton}
              onPress={() => setWebTimePickerField(null)}
            >
              <Text style={styles.timeConfirmButtonText}>Confirmar hora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleSubmit = async () => {
    const fechaAtencion = `${dateValue}T${timeValue}`;
    const fechaNotificacion = `${notificationDate}T${notificationTime}`;
    if (!form.pacienteId || !fechaAtencion || !form.procedimiento.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha y procedimiento son obligatorios');
      return;
    }
    if (createNotification && (!notificationDate || !notificationTime || !notificationMessage.trim())) {
      Alert.alert(
        'Faltan datos',
        'Si activas la notificacion debes completar fecha, hora y mensaje.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/registrodental',
        method: 'POST',
        description: 'registrar atencion dental',
        body: {
          pacienteId: Number(form.pacienteId),
          fechaatencion: fechaAtencion,
          procedimiento: form.procedimiento.trim(),
          diagnostico: form.diagnostico.trim() || undefined,
          odontologo: form.odontologo.trim() || undefined,
          piezastratadas: form.piezasTratadas.trim() || undefined,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (createNotification) {
        const createdId =
          offlineResult.status === 'online'
            ? Number(
                (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                  ?.registrodentalId ??
                  (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                    ?.registrodentalid ??
                  (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                    ?.id,
              )
            : null;

        await submitJsonWithOfflineFallback({
          token,
          path: '/notificacion',
          method: 'POST',
          description: 'crear notificacion de seguimiento dental',
          body: {
            pacienteId: Number(form.pacienteId),
            tipo: 'registro_dental_seguimiento',
            mensaje: notificationMessage.trim(),
            fechaprogramada: fechaNotificacion,
            medio: 'push',
            entidadorigen: 'registrodental',
            entidadId: Number.isFinite(createdId) ? createdId : undefined,
            campoprueba03: `Dental: ${form.procedimiento.trim() || 'Seguimiento'}`.slice(0, 200),
            creadopor: user?.username ?? undefined,
          },
        });
      }

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Registro en cola',
          createNotification
            ? 'No habia conexion. La atencion dental y su notificacion quedaron guardadas localmente y se sincronizaran al volver la red.'
            : 'No habia conexion. La atencion dental quedo guardada localmente y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert(
          'Registro guardado',
          createNotification
            ? 'La atencion dental y su notificacion fueron registradas correctamente.'
            : 'La atencion dental fue registrada correctamente',
        );
      }

      resetForm();
      if (isCreateMode) {
        navigation.goBack();
      } else {
        fetchRecords();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Nuevo registro dental</Text>
      <Text style={styles.formSubtitle}>
        Registra la atencion, el procedimiento y las piezas tratadas para conservar el historial odontologico.
      </Text>

      <Text style={styles.label}>Paciente</Text>
      {loadingPatients ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#29B6FF" />
          <Text style={styles.loadingText}>Cargando pacientes...</Text>
        </View>
      ) : patientOptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No hay pacientes vinculados</Text>
          <Text style={styles.emptyText}>
            Primero agrega una persona desde Gestionar Expediente.
          </Text>
        </View>
      ) : (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.pacienteId}
            onValueChange={(value) => handleChange('pacienteId', String(value))}
            dropdownIconColor="#F4F8FF"
            style={styles.picker}
          >
            <Picker.Item label="Selecciona un paciente" value="" color="#F4F8FF" />
            {patientOptions.map((patient) => (
              <Picker.Item
                key={patient.pacienteId}
                label={patient.displayName}
                value={String(patient.pacienteId)}
                color="#F4F8FF"
              />
            ))}
          </Picker>
        </View>
      )}

      <Text style={styles.label}>Fecha y hora</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.dateButton, styles.calendarButton, styles.flexItem]}
          onPress={() => showPicker('date')}
        >
          <Text style={styles.dateButtonLabel}>Fecha</Text>
          <Text style={styles.dateButtonValue}>{formatDisplayDate(dateValue)}</Text>
          <Text style={styles.dateButtonHint}>Abrir calendario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateButton, styles.timeButton, styles.flexItem]}
          onPress={() => showPicker('time')}
        >
          <Text style={styles.timeButtonLabel}>Hora</Text>
          <Text style={styles.timeButtonValue}>{formatTimeLabel(timeValue)}</Text>
          <Text style={styles.timeButtonHint}>Seleccionar</Text>
        </TouchableOpacity>
      </View>
      {renderIOSPicker('date')}
      {renderIOSPicker('time')}
      {renderWebDatePicker()}
      {renderWebTimePicker()}

      <TextInput
        style={styles.input}
        placeholder="Procedimiento"
        placeholderTextColor="#9FB3C8"
        value={form.procedimiento}
        onChangeText={(value) => handleChange('procedimiento', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Diagnostico"
        placeholderTextColor="#9FB3C8"
        value={form.diagnostico}
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Odontologo"
        placeholderTextColor="#9FB3C8"
        value={form.odontologo}
        onChangeText={(value) => handleChange('odontologo', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Piezas tratadas"
        placeholderTextColor="#9FB3C8"
        value={form.piezasTratadas}
        onChangeText={(value) => handleChange('piezasTratadas', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas"
        placeholderTextColor="#9FB3C8"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />

      <View style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationHeaderCopy}>
            <Text style={styles.notificationTitle}>Notificacion de seguimiento</Text>
            <Text style={styles.notificationHint}>
              Decide si quieres dejar programado un recordatorio desde este mismo registro.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationToggle,
              createNotification ? styles.notificationToggleActive : null,
            ]}
            onPress={() => setCreateNotification((prev) => !prev)}
          >
            <Text style={styles.notificationToggleText}>
              {createNotification ? 'Si' : 'No'}
            </Text>
          </TouchableOpacity>
        </View>

        {createNotification ? (
          <>
            <Text style={styles.label}>Fecha y hora del recordatorio</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.dateButton, styles.calendarButton, styles.flexItem]}
                onPress={() => showPicker('notification-date')}
              >
                <Text style={styles.dateButtonLabel}>Fecha</Text>
                <Text style={styles.dateButtonValue}>
                  {formatDisplayDate(notificationDate)}
                </Text>
                <Text style={styles.dateButtonHint}>Abrir calendario</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, styles.timeButton, styles.flexItem]}
                onPress={() => showPicker('notification-time')}
              >
                <Text style={styles.timeButtonLabel}>Hora</Text>
                <Text style={styles.timeButtonValue}>{formatTimeLabel(notificationTime)}</Text>
                <Text style={styles.timeButtonHint}>Seleccionar</Text>
              </TouchableOpacity>
            </View>
            {renderIOSPicker('notification-date')}
            {renderIOSPicker('notification-time')}

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Mensaje de la notificacion"
              placeholderTextColor="#9FB3C8"
              value={notificationMessage}
              multiline
              onChangeText={setNotificationMessage}
            />
          </>
        ) : null}
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            resetForm();
            if (isCreateMode) {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isCreateMode) {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        {renderForm()}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Atencion odontologica</Text>
          <Text style={styles.title}>Registro dental</Text>
          <Text style={styles.subtitle}>
            Revisa controles, procedimientos y profesionales por persona desde una sola vista.
          </Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.label}>Filtrar por paciente</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedPatientId}
              onValueChange={(value) => setSelectedPatientId(String(value))}
              enabled={!loadingPatients}
              dropdownIconColor="#F4F8FF"
              style={styles.picker}
            >
              <Picker.Item
                label={loadingPatients ? 'Cargando pacientes...' : 'Todos los pacientes'}
                value=""
                color="#F4F8FF"
              />
              {patientOptions.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={patient.displayName}
                  value={String(patient.pacienteId)}
                  color="#F4F8FF"
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.filterHint}>
            {selectedPatientId
              ? `Mostrando atenciones de ${patientNameById[Number(selectedPatientId)] ?? 'paciente'}`
              : 'Mostrando el historial odontologico completo'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personas y controles</Text>
          <Text style={styles.sectionSubtitle}>{`${visibleSummaries.length} perfiles`}</Text>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <Text style={styles.loadingText}>Cargando resumen...</Text>
          </View>
        ) : visibleSummaries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavia no hay registros dentales</Text>
            <Text style={styles.emptyText}>
              Usa el boton flotante para registrar la primera atencion odontologica.
            </Text>
          </View>
        ) : (
          visibleSummaries.map((summary) => (
            <TouchableOpacity
              key={summary.pacienteId}
              style={[
                styles.summaryCard,
                Number(selectedPatientId) === summary.pacienteId ? styles.summaryCardActive : null,
              ]}
              onPress={() =>
                setSelectedPatientId((current) =>
                  Number(current) === summary.pacienteId ? '' : String(summary.pacienteId),
                )
              }
              activeOpacity={0.9}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.summaryHeaderBody}>
                  <Text style={styles.summaryName}>{summary.patientName}</Text>
                  <Text style={styles.summaryMeta}>
                    {summary.latestDate
                      ? `Ultima: ${formatDisplayDateTime(summary.latestDate)}`
                      : 'Sin fecha reciente'}
                  </Text>
                </View>
                <View style={styles.summaryCountBadge}>
                  <Text style={styles.summaryCountValue}>{summary.total}</Text>
                  <Text style={styles.summaryCountLabel}>visitas</Text>
                </View>
              </View>
              <Text style={styles.summaryPrimary}>
                {summary.latestProcedure ?? 'Atencion odontologica registrada'}
              </Text>
              <Text style={styles.summarySecondary}>
                {summary.odontologos.length > 0
                  ? `Odontologos: ${summary.odontologos.slice(0, 2).join(' Ã¢â‚¬Â¢ ')}`
                  : 'Sin profesional registrado'}
              </Text>
              <Text style={styles.summaryAction}>
                {Number(selectedPatientId) === summary.pacienteId
                  ? 'Toca para volver a ver todos'
                  : 'Toca para filtrar este historial'}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial dental</Text>
          <Text style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</Text>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay registros para este filtro</Text>
            <Text style={styles.emptyText}>
              Cambia el paciente seleccionado o registra una nueva atencion dental.
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.registrodentalId} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{formatDisplayDateTime(record.fechaatencion)}</Text>
                </View>
              </View>
              <Text style={styles.recordTitle}>{record.procedimiento || 'Atencion dental'}</Text>
              {!selectedPatientId ? (
                <Text style={styles.recordPatient}>
                  {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                </Text>
              ) : null}
              <Text style={styles.recordText}>
                Diagnostico: {normalizeText(record.diagnostico) ?? 'Sin dato'}
              </Text>
              <Text style={styles.recordText}>
                Odontologo: {normalizeText(record.odontologo) ?? 'Sin dato'}
              </Text>
              <Text style={styles.recordText}>
                Piezas tratadas: {normalizeText(record.piezastratadas) ?? 'Sin dato'}
              </Text>
              {normalizeText(record.notas) ? (
                <Text style={styles.recordText}>Notas: {normalizeText(record.notas)}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegistroDentalCreate')}
      >
        <Text style={styles.fabText}>+</Text>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 10,
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 22,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  filterHint: {
    marginTop: 10,
    color: '#9FB3C8',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
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
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 12,
  },
  summaryCardActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF18',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeaderBody: {
    flex: 1,
    paddingRight: 12,
  },
  summaryName: {
    color: '#F4F8FF',
    fontSize: 17,
    fontWeight: '900',
  },
  summaryMeta: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  summaryCountBadge: {
    minWidth: 74,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#38F28E18',
    borderWidth: 1,
    borderColor: '#38F28E',
    alignItems: 'center',
  },
  summaryCountValue: {
    color: '#38F28E',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryCountLabel: {
    color: '#38F28E',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryPrimary: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  summarySecondary: {
    marginTop: 6,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  summaryAction: {
    marginTop: 10,
    color: '#29B6FF',
    fontWeight: '700',
    fontSize: 13,
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
    marginBottom: 12,
  },
  datePill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#29B6FF18',
  },
  datePillText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  recordPatient: {
    color: '#29B6FF',
    fontWeight: '700',
    marginBottom: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
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
  },
  formSubtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flexItem: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    backgroundColor: '#071120',
  },
  calendarButton: {
    paddingVertical: 10,
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF0D',
  },
  dateButtonLabel: {
    color: '#9FB3C8',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateButtonValue: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  dateButtonHint: {
    color: '#29B6FF',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  timeButton: {
    marginLeft: 10,
    paddingVertical: 10,
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF0D',
  },
  timeButtonLabel: {
    color: '#9FB3C8',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timeButtonValue: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  timeButtonHint: {
    color: '#29B6FF',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  timeModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#020812CC',
  },
  timeModalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#27496D',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 18,
  },
  dateModalCard: {
    maxWidth: 520,
  },
  dateModalHeaderCopy: {
    flex: 1,
    paddingRight: 14,
  },
  dateModalSelected: {
    color: '#29B6FF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7,
  },
  dateCalendar: {
    marginTop: 18,
    borderRadius: 18,
    padding: 8,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  dateQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    marginHorizontal: -4,
  },
  timeModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timeModalEyebrow: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  timeModalTitle: {
    color: '#F4F8FF',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  timeModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  timeModalCloseText: {
    color: '#C9D7E8',
    fontSize: 25,
    lineHeight: 28,
  },
  timeModalValue: {
    color: '#F4F8FF',
    fontSize: 46,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: 20,
  },
  timePickerColumns: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timePickerColumn: {
    flex: 1,
  },
  periodPickerColumn: {
    flex: 0.8,
    marginLeft: 10,
  },
  timePickerLabel: {
    color: '#9FB3C8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  timePickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0A1728',
  },
  timePicker: {
    height: 52,
    color: '#F4F8FF',
    backgroundColor: '#0A1728',
  },
  timePickerSeparator: {
    color: '#29B6FF',
    fontSize: 28,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingBottom: 11,
  },
  timeQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    marginHorizontal: -4,
  },
  timeQuickButton: {
    flexGrow: 1,
    minWidth: 76,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  timeQuickButtonActive: {
    backgroundColor: '#29B6FF22',
    borderColor: '#29B6FF',
  },
  timeQuickButtonText: {
    color: '#F4F8FF',
    fontWeight: '800',
  },
  timeConfirmButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
    backgroundColor: '#29B6FF',
  },
  timeConfirmButtonText: {
    color: '#03101F',
    fontSize: 15,
    fontWeight: '900',
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
  notificationCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  notificationHeaderCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  notificationHint: {
    color: '#9FB3C8',
    lineHeight: 19,
    marginTop: 4,
  },
  notificationToggle: {
    minWidth: 58,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  notificationToggleActive: {
    backgroundColor: '#29B6FF',
    borderColor: '#29B6FF',
  },
  notificationToggleText: {
    color: '#F4F8FF',
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
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#F4F8FF',
    fontWeight: '900',
    fontSize: 16,
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
