import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData } from 'react-native-calendars';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type PickerField =
  | 'fechaInicio'
  | 'fechaFin'
  | 'horaMedicacion'
  | 'notificationDate'
  | 'notificationTime';

type MedicacionRecord = {
  medicacionId: number;
  pacienteId: number;
  nombre: string;
  dosis?: string | null;
  via?: string | null;
  indicaciones?: string | null;
  fechainicio?: string | null;
  fechafin?: string | null;
  horaprogramada?: string | null;
  frecuencia?: string | null;
  horariomedicamentoId?: number | null;
  nombreArchivoReceta?: string | null;
  mimeArchivoReceta?: string | null;
  tieneArchivoReceta?: boolean;
};

type HorarioMedicacionRecord = {
  horariomedicamentoId: number;
  medicacionId: number;
  horaprogramada?: string | null;
  frecuencia?: string | null;
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

type MedicationAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
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

const normalizeTimeString = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const match = trimmed.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
  }
  return '';
};

const parseDateForPicker = (value?: string) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const segments = value.split('-').map((segment) => Number(segment));
    if (segments.length === 3 && segments.every((segment) => !Number.isNaN(segment))) {
      return new Date(segments[0], segments[1] - 1, segments[2]);
    }
  }
  return new Date();
};

const parseTimeForPicker = (value?: string) => {
  const base = new Date();
  base.setSeconds(0, 0);
  const normalized = normalizeTimeString(value);
  const segments = normalized.split(':').map((segment) => Number(segment));
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
  const segments = value.split('-').map((segment) => Number(segment));
  if (segments.length === 3 && segments.every((segment) => !Number.isNaN(segment))) {
    const parsed = new Date(segments[0], segments[1] - 1, segments[2]);
    return parsed.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return value;
};

const formatDisplayTime = (value?: string) => {
  const normalized = normalizeTimeString(value);
  if (!normalized) {
    return 'Selecciona hora';
  }
  return parseTimeForPicker(normalized).toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatInterval = (start?: string | null, end?: string | null) => {
  const startLabel = formatDisplayDate(start ?? undefined, 'Sin inicio');
  const endLabel = end ? formatDisplayDate(end ?? undefined, 'Sin fin') : 'Sin fin';
  return `${startLabel} | ${endLabel}`;
};

const composeDateTime = (dateValue?: string, timeValue?: string) => {
  const normalizedTime = normalizeTimeString(timeValue);
  if (!dateValue || !normalizedTime) {
    return '';
  }
  return `${dateValue}T${normalizedTime}:00`;
};

const todayString = () => toDateOnlyString(new Date());

type MedicacionFormScreenProps = {
  mode?: 'list' | 'create';
  initialMedication?: RootStackParamList['MedicacionCreate'] extends
    | { medicacion?: infer T }
    | undefined
    ? T
    : never;
};

export function MedicacionFormScreen({
  mode = 'list',
  initialMedication,
}: MedicacionFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const isEditing = Boolean(initialMedication?.medicacionId);
  const [form, setForm] = useState({
    pacienteId: initialMedication?.pacienteId ? String(initialMedication.pacienteId) : '',
    nombre: initialMedication?.nombre ?? '',
    dosis: initialMedication?.dosis ?? '',
    via: initialMedication?.via ?? '',
    indicaciones: initialMedication?.indicaciones ?? '',
    fechaInicio: toDateOnlyString(initialMedication?.fechaInicio) || '',
    fechaFin: toDateOnlyString(initialMedication?.fechaFin) || '',
    horaMedicacion: normalizeTimeString(initialMedication?.horaMedicacion) || '',
  });
  const [filterPacienteId, setFilterPacienteId] = useState('');
  const [notificationForm, setNotificationForm] = useState({
    mensaje: 'Recordatorio de finalizacion del tratamiento',
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
  const [showIOSInicioPicker, setShowIOSInicioPicker] = useState(false);
  const [showIOSEndPicker, setShowIOSEndPicker] = useState(false);
  const [showIOSHoraPicker, setShowIOSHoraPicker] = useState(false);
  const [showIOSNotificationDatePicker, setShowIOSNotificationDatePicker] = useState(false);
  const [showIOSNotificationTimePicker, setShowIOSNotificationTimePicker] = useState(false);
  const [records, setRecords] = useState<MedicacionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [showDaySection, setShowDaySection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [attachment, setAttachment] = useState<MedicationAttachment | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<{
    name: string;
    mimeType: string;
  } | null>(
    initialMedication?.tieneArchivoReceta && initialMedication?.mimeArchivoReceta
      ? {
          name: initialMedication.nombreArchivoReceta ?? 'receta-adjunta',
          mimeType: initialMedication.mimeArchivoReceta,
        }
      : null,
  );
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);

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

  const mapMedicationRecords = (payload: any[]): MedicacionRecord[] =>
    payload
      .map((item) => {
        const rawId = item?.medicacionId ?? item?.medicacionid ?? item?.id;
        const medicacionId = Number(rawId);
        const pacienteId = Number(item?.pacienteId ?? item?.pacienteid);
        if (!Number.isFinite(medicacionId) || !Number.isFinite(pacienteId)) {
          return null;
        }
        return {
          medicacionId,
          pacienteId,
          nombre: item?.nombremedicamento ?? item?.nombre ?? 'Medicamento sin nombre',
          dosis: item?.dosis ?? null,
          via: item?.viaadministracion ?? item?.via ?? null,
          indicaciones: item?.indicaciones ?? null,
          fechainicio: item?.fechainicio ?? item?.fechaInicio ?? null,
          fechafin: item?.fechafin ?? item?.fechaFin ?? null,
          nombreArchivoReceta: item?.nombreArchivoReceta ?? null,
          mimeArchivoReceta: item?.mimeArchivoReceta ?? null,
          tieneArchivoReceta: Boolean(item?.tieneArchivoReceta ?? item?.mimeArchivoReceta),
        } as MedicacionRecord;
      })
      .filter((item): item is MedicacionRecord => Boolean(item));

  const mapScheduleRecords = (payload: any[]): HorarioMedicacionRecord[] =>
    payload
      .map((item) => {
        const horarioId = Number(item?.horariomedicamentoId ?? item?.horariomedicamentoid ?? item?.id);
        const medicacionId = Number(item?.medicacionId ?? item?.medicacionid);
        if (!Number.isFinite(horarioId) || !Number.isFinite(medicacionId)) {
          return null;
        }
        return {
          horariomedicamentoId: horarioId,
          medicacionId,
          horaprogramada: normalizeTimeString(item?.horaprogramada ?? item?.horaProgramada ?? null),
          frecuencia: item?.frecuencia ?? null,
        } as HorarioMedicacionRecord;
      })
      .filter((item): item is HorarioMedicacionRecord => Boolean(item));

  const fetchMedications = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setLoadingRecords(false);
      setRefreshing(false);
      return;
    }

    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const medicationResponse = await fetch(`${API_URL}/medicacion`, { headers: authHeaders });
      const medicationBody = await medicationResponse.json().catch(() => null);
      if (!medicationResponse.ok) {
        throw new Error(medicationBody?.message ?? 'No se pudieron cargar las medicaciones');
      }

      let schedules: HorarioMedicacionRecord[] = [];
      try {
        const scheduleResponse = await fetch(`${API_URL}/horariomedicamento`, { headers: authHeaders });
        const scheduleBody = await scheduleResponse.json().catch(() => null);
        if (scheduleResponse.ok && Array.isArray(scheduleBody)) {
          schedules = mapScheduleRecords(scheduleBody);
        }
      } catch {
        // La medicacion se puede mostrar aunque el horario no este disponible.
      }

      const scheduleMap = new Map<number, HorarioMedicacionRecord>();
      schedules.forEach((schedule) => {
        if (!scheduleMap.has(schedule.medicacionId)) {
          scheduleMap.set(schedule.medicacionId, schedule);
        }
      });

      const data = Array.isArray(medicationBody) ? mapMedicationRecords(medicationBody) : [];
      setRecords(
        data.map((record) => {
          const schedule = scheduleMap.get(record.medicacionId);
          return {
            ...record,
            horariomedicamentoId: schedule?.horariomedicamentoId ?? null,
            horaprogramada: schedule?.horaprogramada ?? null,
            frecuencia: schedule?.frecuencia ?? null,
          };
        }),
      );
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'No se pudieron cargar las medicaciones');
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
    fetchMedications();
  }, [fetchMedications]);

  useEffect(() => {
    if (!initialMedication) {
      return;
    }

    setForm({
      pacienteId: String(initialMedication.pacienteId),
      nombre: initialMedication.nombre ?? '',
      dosis: initialMedication.dosis ?? '',
      via: initialMedication.via ?? '',
      indicaciones: initialMedication.indicaciones ?? '',
      fechaInicio: toDateOnlyString(initialMedication.fechaInicio) || '',
      fechaFin: toDateOnlyString(initialMedication.fechaFin) || '',
      horaMedicacion: normalizeTimeString(initialMedication.horaMedicacion) || '',
    });
    setNotificationDate(toDateOnlyString(initialMedication.fechaFin) || '');
    setNotificationTime(normalizeTimeString(initialMedication.horaMedicacion) || '08:00');
    setAttachment(null);
    setRemoveExistingAttachment(false);
    setExistingAttachment(
      initialMedication.tieneArchivoReceta && initialMedication.mimeArchivoReceta
        ? {
            name: initialMedication.nombreArchivoReceta ?? 'receta-adjunta',
            mimeType: initialMedication.mimeArchivoReceta,
          }
        : null,
    );
  }, [initialMedication]);

  useEffect(() => {
    if (!form.pacienteId && patientOptions.length > 0) {
      handleChange('pacienteId', String(patientOptions[0].pacienteId));
    }
  }, [patientOptions, form.pacienteId]);

  useEffect(() => {
    if (form.fechaFin && !notificationDate) {
      setNotificationDate(form.fechaFin);
    }
  }, [form.fechaFin, notificationDate]);

  useEffect(() => {
    if (form.horaMedicacion && notificationTime === '08:00') {
      setNotificationTime(form.horaMedicacion);
    }
  }, [form.horaMedicacion, notificationTime]);

  useEffect(() => {
    if (!form.fechaFin) {
      setShowNotificationForm(false);
      setNotificationDate('');
      setNotificationTime(normalizeTimeString(form.horaMedicacion) || '08:00');
    }
  }, [form.fechaFin, form.horaMedicacion]);

  const readFileAsBase64 = useCallback(async (uri: string) => {
    const file = new FileSystem.File(uri);
    return file.base64();
  }, []);

  const setNewAttachment = useCallback((nextAttachment: MedicationAttachment) => {
    setAttachment(nextAttachment);
    setRemoveExistingAttachment(false);
  }, []);

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
      const startDate = toDateOnlyString(record.fechainicio);
      if (startDate) {
        const existing = marks[startDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `start-${record.medicacionId}`)) {
          dots.push({ key: `start-${record.medicacionId}`, color: '#38F28E' });
        }
        marks[startDate] = {
          ...existing,
          marked: true,
          dots,
        };
      }

      const endDate = toDateOnlyString(record.fechafin);
      if (endDate) {
        const existing = marks[endDate] ?? {};
        const dots = existing.dots ?? [];
        if (!dots.some((dot) => dot.key === `end-${record.medicacionId}`)) {
          dots.push({ key: `end-${record.medicacionId}`, color: '#FF4D73' });
        }
        marks[endDate] = {
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
        MedicacionRecord & {
          dayType: 'inicio' | 'fin';
        }
      >;
    }

    const entries: Array<
      MedicacionRecord & {
        dayType: 'inicio' | 'fin';
      }
    > = [];

    visibleRecords.forEach((record) => {
      if (toDateOnlyString(record.fechainicio) === selectedDate) {
        entries.push({ ...record, dayType: 'inicio' });
      }
      if (toDateOnlyString(record.fechafin) === selectedDate) {
        entries.push({ ...record, dayType: 'fin' });
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
    if (Platform.OS === 'android') {
      if (field === 'horaMedicacion' || field === 'notificationTime') {
        const currentTimeValue =
          field === 'horaMedicacion' ? normalizeTimeString(form.horaMedicacion) : normalizeTimeString(notificationTime);
        DateTimePickerAndroid.open({
          value: parseTimeForPicker(currentTimeValue),
          mode: 'time',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) {
              return;
            }
            const formatted = `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
            if (field === 'horaMedicacion') {
              handleChange('horaMedicacion', formatted);
            } else {
              setNotificationTime(formatted);
            }
          },
        });
        return;
      }

      const currentDateValue =
        field === 'notificationDate'
          ? notificationDate
          : field === 'fechaInicio'
            ? form.fechaInicio
            : form.fechaFin;
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

    if (field === 'fechaInicio') setShowIOSInicioPicker(true);
    if (field === 'fechaFin') setShowIOSEndPicker(true);
    if (field === 'horaMedicacion') setShowIOSHoraPicker(true);
    if (field === 'notificationDate') setShowIOSNotificationDatePicker(true);
    if (field === 'notificationTime') setShowIOSNotificationTimePicker(true);
  };

  const renderIOSPicker = (field: PickerField) => {
    const visible =
      field === 'fechaInicio'
        ? showIOSInicioPicker
        : field === 'fechaFin'
          ? showIOSEndPicker
          : field === 'horaMedicacion'
            ? showIOSHoraPicker
            : field === 'notificationDate'
              ? showIOSNotificationDatePicker
              : showIOSNotificationTimePicker;

    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }

    const isTimeField = field === 'horaMedicacion' || field === 'notificationTime';
    const currentDateValue =
      field === 'notificationDate'
        ? notificationDate
        : field === 'fechaInicio'
          ? form.fechaInicio
          : form.fechaFin;
    const currentTimeValue =
      field === 'horaMedicacion' ? normalizeTimeString(form.horaMedicacion) : normalizeTimeString(notificationTime);

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
              const formatted = `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
              if (field === 'horaMedicacion') {
                handleChange('horaMedicacion', formatted);
              } else {
                setNotificationTime(formatted);
              }
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
            if (field === 'fechaInicio') setShowIOSInicioPicker(false);
            if (field === 'fechaFin') setShowIOSEndPicker(false);
            if (field === 'horaMedicacion') setShowIOSHoraPicker(false);
            if (field === 'notificationDate') setShowIOSNotificationDatePicker(false);
            if (field === 'notificationTime') setShowIOSNotificationTimePicker(false);
          }}
        >
          <Text style={styles.iosPickerDoneText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La captura con camara se recomienda desde Android o iOS.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la camara para fotografiar la receta.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.45,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setNewAttachment({
        uri: asset.uri,
        name: asset.fileName ?? `receta-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        kind: 'image',
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la camara');
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a fotos para adjuntar la receta.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.45,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setNewAttachment({
        uri: asset.uri,
        name: asset.fileName ?? `receta-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        kind: 'image',
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la galeria');
    }
  };

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setNewAttachment({
        uri: asset.uri,
        name: asset.name ?? `receta-${Date.now()}.pdf`,
        mimeType: asset.mimeType ?? 'application/pdf',
        kind: 'pdf',
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo seleccionar el PDF');
    }
  };

  const clearAttachmentSelection = () => {
    setAttachment(null);
    if (existingAttachment) {
      setRemoveExistingAttachment(true);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedications();
  };

  const handleSubmit = useCallback(async () => {
    if (!form.pacienteId || !form.nombre || !form.fechaInicio) {
      Alert.alert('Faltan datos', 'Paciente, nombre y fecha de inicio son obligatorios.');
      return;
    }

    try {
      const medicationBody: Record<string, unknown> = {
        pacienteId: Number(form.pacienteId),
        nombremedicamento: form.nombre.trim(),
        dosis: form.dosis.trim() || undefined,
        viaadministracion: form.via.trim() || undefined,
        indicaciones: form.indicaciones.trim() || undefined,
        fechainicio: form.fechaInicio,
        fechafin: form.fechaFin || undefined,
        modificadopor: user?.username ?? undefined,
        creadopor: isEditing ? undefined : user?.username ?? undefined,
      };

      if (attachment) {
        const attachmentBase64 = await readFileAsBase64(attachment.uri);
        medicationBody.archivoRecetaBase64 = `data:${attachment.mimeType};base64,${attachmentBase64}`;
        medicationBody.nombreArchivoReceta = attachment.name;
        medicationBody.mimeArchivoReceta = attachment.mimeType;
      } else if (removeExistingAttachment) {
        medicationBody.archivoRecetaBase64 = null;
        medicationBody.nombreArchivoReceta = null;
        medicationBody.mimeArchivoReceta = null;
      }

      const medicationResult = await submitJsonWithOfflineFallback<any>({
        token,
        path: isEditing ? `/medicacion/${initialMedication?.medicacionId}` : '/medicacion',
        method: isEditing ? 'PATCH' : 'POST',
        description: isEditing ? 'actualizar medicacion' : 'registrar medicacion',
        body: medicationBody,
      });

      let message = isEditing ? 'La medicacion fue actualizada.' : 'La medicacion fue guardada.';

      if (medicationResult.status === 'queued') {
        message = isEditing
          ? 'No habia conexion. Los cambios de la medicacion quedaron en cola y se sincronizaran al volver la red.'
          : 'No habia conexion. La medicacion quedo guardada en el dispositivo y se enviara cuando vuelva la red.';
        Alert.alert(isEditing ? 'Cambios en cola' : 'Medicacion en cola', message);
      } else {
        const savedMedicationId = Number(
          medicationResult.data?.medicacionId ??
            medicationResult.data?.medicacionid ??
            initialMedication?.medicacionId ??
            medicationResult.data?.id,
        );

        if (Number.isFinite(savedMedicationId)) {
          const scheduleDateTime = composeDateTime(form.fechaInicio, form.horaMedicacion);

          if (scheduleDateTime) {
            await submitJsonWithOfflineFallback({
              token,
              path:
                isEditing && initialMedication?.horariomedicamentoId
                  ? `/horariomedicamento/${initialMedication.horariomedicamentoId}`
                  : '/horariomedicamento',
              method:
                isEditing && initialMedication?.horariomedicamentoId ? 'PATCH' : 'POST',
              description: isEditing
                ? 'actualizar horario de medicacion'
                : 'registrar horario de medicacion',
              body: {
                medicacionId: savedMedicationId,
                horaprogramada: scheduleDateTime,
                generarecordatorio: false,
                estadorecordatorio: 'pendiente',
                modificadopor: user?.username ?? undefined,
                creadoen: new Date().toISOString(),
                creadopor: user?.username ?? undefined,
              },
            });
            message = isEditing
              ? 'La medicacion y su hora programada fueron actualizadas.'
              : 'La medicacion y su hora programada fueron guardadas.';
          } else if (isEditing && initialMedication?.horariomedicamentoId) {
            await submitJsonWithOfflineFallback({
              token,
              path: `/horariomedicamento/${initialMedication.horariomedicamentoId}`,
              method: 'DELETE',
              description: 'eliminar horario de medicacion',
            });
            message = 'La medicacion fue actualizada y se elimino la hora programada.';
          }
        }

        Alert.alert(isEditing ? 'Medicacion actualizada' : 'Medicacion guardada', message);
        void fetchMedications();
      }

      setForm({
        pacienteId: isEditing ? String(initialMedication?.pacienteId ?? '') : '',
        nombre: '',
        dosis: '',
        via: '',
        indicaciones: '',
        fechaInicio: '',
        fechaFin: '',
        horaMedicacion: '',
      });
      setAttachment(null);
      setExistingAttachment(null);
      setRemoveExistingAttachment(false);
      setNotificationDate('');
      setNotificationTime('08:00');
      setShowNotificationForm(false);
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar la medicacion');
    }
  }, [
    attachment,
    fetchMedications,
    form,
    initialMedication,
    isCreateMode,
    isEditing,
    navigation,
    readFileAsBase64,
    removeExistingAttachment,
    token,
    user?.username,
  ]);

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
        description: 'crear notificacion de medicacion',
        body: {
          pacienteId: Number(form.pacienteId),
          tipo: 'medicacion_fin_tratamiento',
          mensaje: notificationForm.mensaje.trim(),
          fechaprogramada: scheduledAt,
          medio: 'push',
          entidadorigen: 'medicacion',
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Notificacion en cola',
          'No habia conexion. La notificacion quedo pendiente y se enviara cuando vuelva la red.',
        );
      } else {
        Alert.alert('Notificacion creada', 'La notificacion push del tratamiento fue programada.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la notificacion');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>SEGUIMIENTO DE MEDICACION</Text>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isCreateMode ? (isEditing ? 'Editar medicacion' : 'Nueva medicacion') : 'Medicaciones registradas'}
            </Text>
            <Text style={styles.subtitle}>
              {isCreateMode
                ? isEditing
                  ? 'Actualiza el tratamiento, reemplaza la receta adjunta si hace falta y ajusta la hora programada.'
                  : 'Registra una nueva medicacion, define su hora y programa la notificacion del tratamiento si lo necesitas.'
                : 'Revisa el calendario, despliega el historial cuando lo necesites y registra la hora de cada medicacion.'}
            </Text>
          </View>
        </View>

        {recordsError ? <Text style={styles.errorText}>{recordsError}</Text> : null}

        {!isCreateMode ? (
          <>
            <View style={styles.filterCard}>
              <Text style={styles.label}>Paciente del historial</Text>
              {loadingPatients ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#29B6FF" />
                  <Text style={styles.loadingText}>Cargando personas...</Text>
                </View>
              ) : patientOptions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No hay personas vinculadas para filtrar el historial.</Text>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    style={styles.picker}
                    selectedValue={filterPacienteId}
                    onValueChange={(value) => setFilterPacienteId(String(value))}
                    dropdownIconColor="#F4F8FF"
                  >
                    <Picker.Item label="Todos los pacientes" value="" />
                    {patientOptions.map((patient) => (
                      <Picker.Item
                        key={patient.pacienteId}
                        label={patient.displayName}
                        value={String(patient.pacienteId)}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.calendarCard}>
              <Text style={styles.formTitle}>Calendario del tratamiento</Text>
              <Text style={styles.sectionHelper}>
                Verde marca el inicio y rojo marca la finalizacion del tratamiento.
              </Text>
              <Calendar
                markingType="multi-dot"
                markedDates={markedDates}
                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                theme={{
                  calendarBackground: '#132238',
                  dayTextColor: '#F4F8FF',
                  monthTextColor: '#F4F8FF',
                  arrowColor: '#29B6FF',
                  textSectionTitleColor: '#C9D7E8',
                  selectedDayBackgroundColor: '#29B6FF',
                  selectedDayTextColor: '#F4F8FF',
                  todayTextColor: '#F4F8FF',
                }}
                style={styles.calendar}
              />
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
                  <Text style={styles.formTitle}>Medicacion del dia</Text>
                  <Text style={styles.sectionHelper}>
                    {!hasDayRecords
                      ? 'No hay medicaciones para desplegar en esta fecha'
                      : showDaySection
                        ? 'Ocultar medicaciones de la fecha seleccionada'
                        : 'Desplegar medicaciones de la fecha seleccionada'}
                  </Text>
                </View>
                <View style={styles.sectionToggleActions}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{recordsForSelectedDay.length}</Text>
                  </View>
                  <Text style={[styles.sectionToggleIcon, !hasDayRecords && styles.sectionToggleIconDisabled]}>
                    {hasDayRecords ? (showDaySection ? '-' : '+') : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {showDaySection && hasDayRecords ? (
                <>
                  <Text style={styles.dayLabel}>{formatDisplayDate(selectedDate, selectedDate)}</Text>
                  {recordsForSelectedDay.map((record) => {
                      const label = patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`;
                      return (
                        <View key={`day-${record.medicacionId}-${record.dayType}`} style={styles.medicationCard}>
                          <View style={styles.medicationHeader}>
                            <View>
                              <Text style={styles.medicationName}>{record.nombre}</Text>
                              <Text style={styles.medicationMeta}>{label}</Text>
                            </View>
                            <View
                              style={[
                                styles.dayTypeBadge,
                                record.dayType === 'fin' ? styles.dayTypeEnd : styles.dayTypeStart,
                              ]}
                            >
                              <Text style={styles.dayTypeBadgeText}>
                                {record.dayType === 'fin' ? 'Finaliza' : 'Inicia'}
                              </Text>
                            </View>
                          </View>
                          {record.dosis ? <Text style={styles.medicationDetail}>Dosis: {record.dosis}</Text> : null}
                          {record.via ? <Text style={styles.medicationDetail}>Via: {record.via}</Text> : null}
                          {record.tieneArchivoReceta ? (
                            <Text style={styles.medicationDetail}>
                              Receta adjunta: <Text style={styles.medicationHighlight}>Si</Text>
                            </Text>
                          ) : null}
                          {record.horaprogramada ? (
                            <Text style={styles.medicationDetail}>
                              Hora:{' '}
                              <Text style={styles.medicationHighlight}>
                                {formatDisplayTime(record.horaprogramada)}
                              </Text>
                            </Text>
                          ) : null}
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
                  <Text style={styles.formTitle}>Historial completo</Text>
                  <Text style={styles.sectionHelper}>
                    {!hasHistoryRecords
                      ? activePatientId
                        ? 'Este paciente no tiene medicaciones para mostrar'
                        : 'No hay medicaciones registradas para mostrar'
                      : showHistorySection
                        ? 'Ocultar medicaciones anteriores'
                        : 'Desplegar medicaciones anteriores'}
                  </Text>
                </View>
                <View style={styles.sectionToggleActions}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{visibleRecords.length}</Text>
                  </View>
                  <Text style={[styles.sectionToggleIcon, !hasHistoryRecords && styles.sectionToggleIconDisabled]}>
                    {hasHistoryRecords ? (showHistorySection ? '-' : '+') : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {showHistorySection && hasHistoryRecords ? (
                loadingRecords ? (
                  <View style={styles.stateBox}>
                    <ActivityIndicator color="#29B6FF" />
                    <Text style={styles.stateText}>Cargando medicaciones...</Text>
                  </View>
                ) : (
                  visibleRecords.map((record) => {
                    const label = patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`;
                    return (
                      <View key={record.medicacionId} style={styles.medicationCard}>
                        <View style={styles.medicationHeader}>
                          <View>
                            <Text style={styles.medicationName}>{record.nombre}</Text>
                            <Text style={styles.medicationMeta}>
                              {label} | {formatInterval(record.fechainicio, record.fechafin)}
                            </Text>
                          </View>
                        </View>
                        {record.dosis ? <Text style={styles.medicationDetail}>Dosis: {record.dosis}</Text> : null}
                        {record.via ? <Text style={styles.medicationDetail}>Via: {record.via}</Text> : null}
                        {record.indicaciones ? (
                          <Text style={styles.medicationDetail}>Indicaciones: {record.indicaciones}</Text>
                        ) : null}
                        {record.horaprogramada ? (
                          <Text style={styles.medicationDetail}>
                            Hora programada:{' '}
                            <Text style={styles.medicationHighlight}>
                              {formatDisplayTime(record.horaprogramada)}
                            </Text>
                          </Text>
                        ) : (
                          <Text style={styles.medicationDetail}>Hora programada: Sin hora definida</Text>
                        )}
                        <Text style={styles.medicationDetail}>
                          Receta adjunta:{' '}
                          <Text style={styles.medicationHighlight}>
                            {record.tieneArchivoReceta ? record.nombreArchivoReceta ?? 'Disponible' : 'No'}
                          </Text>
                        </Text>
                        <TouchableOpacity
                          style={styles.editRecordButton}
                          onPress={() =>
                            navigation.navigate('MedicacionCreate', {
                              medicacion: {
                                medicacionId: record.medicacionId,
                                pacienteId: record.pacienteId,
                                nombre: record.nombre,
                                dosis: record.dosis ?? null,
                                via: record.via ?? null,
                                indicaciones: record.indicaciones ?? null,
                                fechaInicio: record.fechainicio ?? null,
                                fechaFin: record.fechafin ?? null,
                                horaMedicacion: record.horaprogramada ?? null,
                                horariomedicamentoId: record.horariomedicamentoId ?? null,
                                nombreArchivoReceta: record.nombreArchivoReceta ?? null,
                                mimeArchivoReceta: record.mimeArchivoReceta ?? null,
                                tieneArchivoReceta: Boolean(record.tieneArchivoReceta),
                              },
                            })
                          }
                        >
                          <Text style={styles.editRecordButtonText}>Editar medicacion</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )
              ) : null}
            </View>
          </>
        ) : null}

        {isCreateMode ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{isEditing ? 'Editar medicacion' : 'Registrar medicacion'}</Text>
            <Text style={styles.sectionHelper}>
              Completa el tratamiento, define la hora si quieres dejarla programada y agrega una
              notificacion al cierre si aplica.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Paciente</Text>
              {loadingPatients ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#29B6FF" />
                  <Text style={styles.loadingText}>Cargando personas...</Text>
                </View>
              ) : patientOptions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    No hay personas vinculadas. Agrega una desde Gestionar Expediente.
                  </Text>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={fetchPatients}>
                    <Text style={styles.secondaryBtnText}>Reintentar</Text>
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
                      />
                    ))}
                  </Picker>
                </View>
              )}
              {form.pacienteId ? (
                <Text style={styles.fieldHint}>
                  {`Tratamiento asignado a ${patientNameById[Number(form.pacienteId)] ?? 'la persona seleccionada'}`}
                </Text>
              ) : null}
            </View>
            {patientError ? <Text style={styles.errorText}>{patientError}</Text> : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre del medicamento</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Amoxicilina, Ibuprofeno, Metformina"
                placeholderTextColor="#9FB3C8"
                value={form.nombre}
                onChangeText={(value) => handleChange('nombre', value)}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Dosis indicada</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 500 mg, 1 tableta, 10 ml"
                  placeholderTextColor="#9FB3C8"
                  value={form.dosis}
                  onChangeText={(value) => handleChange('dosis', value)}
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Via de administracion</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Oral, intravenosa, topica"
                  placeholderTextColor="#9FB3C8"
                  value={form.via}
                  onChangeText={(value) => handleChange('via', value)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Indicaciones de la receta</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Ej. Tomar despues de los alimentos durante 7 dias"
                placeholderTextColor="#9FB3C8"
                value={form.indicaciones}
                multiline
                onChangeText={(value) => handleChange('indicaciones', value)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fecha de inicio del tratamiento</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fechaInicio')}>
                <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechaInicio)}</Text>
              </TouchableOpacity>
            </View>
            {renderIOSPicker('fechaInicio')}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Hora programada de la toma</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('horaMedicacion')}>
                <Text style={styles.dateButtonText}>
                  {form.horaMedicacion ? formatDisplayTime(form.horaMedicacion) : 'Selecciona una hora opcional'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.fieldHint}>
                Si defines una hora, se registra en el horario de la medicacion.
              </Text>
            </View>
            {renderIOSPicker('horaMedicacion')}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fecha de finalizacion del tratamiento</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fechaFin')}>
                <Text style={styles.dateButtonText}>
                  {form.fechaFin ? formatDisplayDate(form.fechaFin) : 'Selecciona una fecha opcional'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.fieldHint}>
                Agregala si quieres dejar definido hasta cuando debe tomarse el medicamento.
              </Text>
            </View>
            {renderIOSPicker('fechaFin')}

            <View style={styles.attachmentCard}>
              <Text style={styles.formTitle}>Receta fisica adjunta</Text>
              <Text style={styles.sectionHelper}>
                Adjunta una foto o un PDF de la receta para dejar respaldo dentro de la medicacion.
              </Text>

              <View style={styles.attachmentActions}>
                <TouchableOpacity style={styles.attachmentButton} onPress={handleTakePhoto}>
                  <Text style={styles.attachmentButtonText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentButton} onPress={handlePickImage}>
                  <Text style={styles.attachmentButtonText}>Elegir imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentButton} onPress={handlePickPdf}>
                  <Text style={styles.attachmentButtonText}>Elegir PDF</Text>
                </TouchableOpacity>
              </View>

              {attachment ? (
                <View style={styles.attachmentPreviewCard}>
                  {attachment.kind === 'image' ? (
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentPreviewImage} />
                  ) : null}
                  <Text style={styles.attachmentPreviewTitle}>{attachment.name}</Text>
                  <Text style={styles.attachmentPreviewMeta}>
                    {attachment.kind === 'pdf' ? 'PDF seleccionado' : 'Imagen seleccionada'}
                  </Text>
                  <TouchableOpacity style={styles.removeAttachmentButton} onPress={clearAttachmentSelection}>
                    <Text style={styles.removeAttachmentButtonText}>Quitar adjunto</Text>
                  </TouchableOpacity>
                </View>
              ) : existingAttachment && !removeExistingAttachment ? (
                <View style={styles.attachmentPreviewCard}>
                  <Text style={styles.attachmentPreviewTitle}>{existingAttachment.name}</Text>
                  <Text style={styles.attachmentPreviewMeta}>
                    {existingAttachment.mimeType === 'application/pdf' ? 'PDF guardado' : 'Imagen guardada'}
                  </Text>
                  <TouchableOpacity style={styles.removeAttachmentButton} onPress={clearAttachmentSelection}>
                    <Text style={styles.removeAttachmentButtonText}>Eliminar adjunto actual</Text>
                  </TouchableOpacity>
                </View>
              ) : removeExistingAttachment ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    El adjunto actual se eliminara cuando guardes los cambios.
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Aun no has agregado una foto o PDF de la receta.
                  </Text>
                </View>
              )}
            </View>

            {form.fechaFin ? (
              <View style={styles.inlineNotificationCard}>
                <View style={styles.inlineNotificationCopy}>
                  <Text style={styles.inlineNotificationTitle}>Notificacion del tratamiento</Text>
                  <Text style={styles.inlineNotificationHint}>
                    Programa un aviso push para recordar la finalizacion del tratamiento.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.inlineNotificationToggle,
                    showNotificationForm && styles.inlineNotificationToggleActive,
                  ]}
                  onPress={() => setShowNotificationForm((prev) => !prev)}
                >
                  <Text style={styles.inlineNotificationToggleText}>
                    {showNotificationForm ? 'Ocultar' : 'Crear'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.fieldHint}>
                Agrega una fecha de finalizacion si quieres crear una notificacion.
              </Text>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <Text style={styles.btnText}>{isEditing ? 'Guardar cambios' : 'Guardar medicacion'}</Text>
            </TouchableOpacity>

            {showNotificationForm ? (
              <View style={styles.notificationCard}>
                <Text style={styles.formTitle}>Notificacion del tratamiento</Text>
                <Text style={styles.sectionHelper}>
                  El canal queda fijo como notificacion push.
                </Text>

                <Text style={styles.label}>Canal</Text>
                <View style={styles.fixedChannelCard}>
                  <Text style={styles.fixedChannelText}>Notificacion push</Text>
                </View>

                <Text style={styles.label}>Mensaje del recordatorio</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  placeholder="Ej. Hoy finaliza el tratamiento indicado"
                  placeholderTextColor="#9FB3C8"
                  value={notificationForm.mensaje}
                  multiline
                  onChangeText={(value) => handleNotificationChange('mensaje', value)}
                />

                <Text style={styles.label}>Fecha y hora del aviso</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.dateTimeButton]}
                    onPress={() => showPicker('notificationDate')}
                  >
                    <Text style={styles.dateButtonText}>{formatDisplayDate(notificationDate)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.dateTimeButton]}
                    onPress={() => showPicker('notificationTime')}
                  >
                    <Text style={styles.dateButtonText}>{formatDisplayTime(notificationTime)}</Text>
                  </TouchableOpacity>
                </View>
                {renderIOSPicker('notificationDate')}
                {renderIOSPicker('notificationTime')}

                <TouchableOpacity style={styles.notificationBtn} onPress={handleCreateNotification}>
                  <Text style={styles.notificationBtnText}>Crear notificacion push</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('MedicacionCreate')}>
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
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    padding: 24,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#29B6FF',
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
    color: '#29B6FF',
    lineHeight: 20,
    marginTop: 8,
  },
  filterCard: {
    backgroundColor: '#132238',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  calendarCard: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  daySection: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  recordsSection: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formCard: {
    backgroundColor: '#132238',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  notificationCard: {
    marginTop: 8,
    backgroundColor: '#182A44',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#182A44',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  fieldGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formColumn: {
    flex: 1,
    gap: 8,
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
  fieldHint: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
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
    backgroundColor: '#0D1B2A',
  },
  fixedChannelText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '600',
  },
  inlineNotificationCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#29B6FF',
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
  attachmentCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    backgroundColor: '#071120',
  },
  attachmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attachmentButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#182A44',
  },
  attachmentButtonText: {
    color: '#29B6FF',
    fontWeight: '700',
    fontSize: 13,
  },
  attachmentPreviewCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    backgroundColor: '#0D1B2A',
  },
  attachmentPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#071120',
  },
  attachmentPreviewTitle: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  attachmentPreviewMeta: {
    color: '#C9D7E8',
  },
  removeAttachmentButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF4D7318',
  },
  removeAttachmentButtonText: {
    color: '#FF4D73',
    fontWeight: '700',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#0D1B2A',
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
  dateTimeButton: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  notificationBtn: {
    backgroundColor: '#38F28E',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
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
    backgroundColor: '#132238',
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
    backgroundColor: '#132238',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: '#C9D7E8',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#29B6FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#F4F8FF',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF4D73',
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
  dayTypeStart: {
    backgroundColor: '#38F28E18',
  },
  dayTypeEnd: {
    backgroundColor: '#FF4D7318',
  },
  dayTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071120',
  },
  medicationCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#29B6FF18',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#071120',
  },
  medicationMeta: {
    color: '#29B6FF',
  },
  medicationDetail: {
    color: '#27496D',
  },
  medicationHighlight: {
    fontWeight: '700',
    color: '#071120',
  },
  editRecordButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#29B6FF18',
  },
  editRecordButtonText: {
    color: '#29B6FF',
    fontWeight: '700',
    fontSize: 13,
  },
  iosPickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#27496D',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#182A44',
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
