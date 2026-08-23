/**
 * @file App movil/GestionSaludExpo/src/screens/ControlCronicoScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { WebTimeInput } from '../components/WebTimeInput';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

type CondicionRecord = {
  condicioncronicaId: number;
  pacienteId: number;
  tipocondicionId: number;
  estado?: string | null;
};

type TipoCondicion = {
  tipocondicionId: number;
  nombre: string;
};

type ControlCronicoRecord = {
  controlcronicoId: number;
  condicioncronicaId: number;
  fechacontrol?: string | null;
  indicador?: string | null;
  valor?: number | null;
  unidad?: string | null;
  resultado?: string | null;
  conclusiones?: string | null;
  proximocontrol?: string | null;
  medico?: string | null;
};

type MeasurementRow = {
  id: string;
  indicador: string;
  valor: string;
  unidad: string;
  resultado: string;
  expanded: boolean;
};

type FormState = {
  pacienteId: string;
  condicioncronicaId: string;
  fechacontrol: string;
  horacontrol: string;
  conclusiones: string;
  proximocontrol: string;
  medico: string;
};

const buildHeaders = (token?: string | null, withJson = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const toDateOnlyString = (value?: Date | string | null): string => {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '';
    }
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
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

const parseDateForPicker = (value?: string | null) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part: number) => !Number.isNaN(part))) {
    return new Date(parts[0]!, (parts[1] ?? 1) - 1, parts[2]!);
  }
  return new Date();
};

const parseTimeForPicker = (value?: string | null) => {
  const normalized = normalizeTimeString(value);
  const base = new Date();
  base.setSeconds(0, 0);
  const parts = normalized.split(':').map(Number);
  if (parts.length === 2 && parts.every((part) => !Number.isNaN(part))) {
    base.setHours(parts[0]!, parts[1]!, 0, 0);
    return base;
  }
  base.setHours(8, 0, 0, 0);
  return base;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) {
    return 'Selecciona una fecha';
  }
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDisplayTime = (value?: string | null) => {
  const normalized = normalizeTimeString(value);
  if (!normalized) {
    return 'Selecciona hora';
  }
  return parseTimeForPicker(normalized).toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRecordDateTime = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo completar la accion.';
};

const composeDateTime = (dateValue?: string, timeValue?: string) => {
  const normalizedTime = normalizeTimeString(timeValue);
  if (!dateValue || !normalizedTime) {
    return '';
  }
  return `${dateValue}T${normalizedTime}:00`;
};

const createMeasurementRow = (): MeasurementRow => ({
  id: `measurement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  indicador: '',
  valor: '',
  unidad: '',
  resultado: '',
  expanded: true,
});

const measurementPresets = [
  { label: 'Glucosa', unit: 'mg/dL' },
  { label: 'Presión sistólica', unit: 'mmHg' },
  { label: 'Presión diastólica', unit: 'mmHg' },
  { label: 'Peso', unit: 'kg' },
  { label: 'Frecuencia cardíaca', unit: 'lpm' },
  { label: 'Saturación de oxígeno', unit: '%' },
  { label: 'HbA1c', unit: '%' },
  { label: 'Temperatura', unit: '°C' },
] as const;

const resultOptions = ['Controlado', 'Estable', 'Alto', 'Bajo', 'Requiere revisión'] as const;

const getMeasurementSummary = (measurement: MeasurementRow) => {
  const value = measurement.valor
    ? `${measurement.valor}${measurement.unidad ? ` ${measurement.unidad}` : ''}`
    : 'Sin valor';
  return [
    measurement.indicador || 'Selecciona un indicador',
    value,
    measurement.resultado,
  ].filter(Boolean).join(' · ');
};

const normalizeCondicion = (item: Record<string, unknown>): CondicionRecord | null => {
  const condicioncronicaId = Number(item.condicioncronicaId ?? item.condicioncronicaid ?? item.id ?? 0);
  const pacienteId = Number(item.pacienteId ?? item.pacienteid ?? 0);
  const tipocondicionId = Number(item.tipocondicionId ?? item.tipocondicionid ?? 0);

  if (
    !Number.isFinite(condicioncronicaId) ||
    condicioncronicaId <= 0 ||
    !Number.isFinite(pacienteId) ||
    pacienteId <= 0 ||
    !Number.isFinite(tipocondicionId) ||
    tipocondicionId <= 0
  ) {
    return null;
  }

  return {
    condicioncronicaId,
    pacienteId,
    tipocondicionId,
    estado: typeof item.estado === 'string' ? item.estado : null,
  };
};

const normalizeControl = (item: Record<string, unknown>): ControlCronicoRecord | null => {
  const controlcronicoId = Number(item.controlcronicoId ?? item.controlcronicoid ?? item.id ?? 0);
  const condicioncronicaId = Number(item.condicioncronicaId ?? item.condicioncronicaid ?? 0);

  if (
    !Number.isFinite(controlcronicoId) ||
    controlcronicoId <= 0 ||
    !Number.isFinite(condicioncronicaId) ||
    condicioncronicaId <= 0
  ) {
    return null;
  }

  const rawValor = item.valor;
  const valor =
    rawValor === null || rawValor === undefined || rawValor === ''
      ? null
      : Number.isFinite(Number(rawValor))
        ? Number(rawValor)
        : null;

  return {
    controlcronicoId,
    condicioncronicaId,
    fechacontrol:
      typeof item.fechacontrol === 'string'
        ? item.fechacontrol
        : item.fechacontrol instanceof Date
          ? item.fechacontrol.toISOString()
          : null,
    indicador: typeof item.indicador === 'string' ? item.indicador : null,
    valor,
    unidad: typeof item.unidad === 'string' ? item.unidad : null,
    resultado: typeof item.resultado === 'string' ? item.resultado : null,
    conclusiones: typeof item.conclusiones === 'string' ? item.conclusiones : null,
    proximocontrol: toDateOnlyString(item.proximocontrol as string | null | undefined) || null,
    medico: typeof item.medico === 'string' ? item.medico : null,
  };
};

const normalizeTipoCondicion = (item: Record<string, unknown>): TipoCondicion | null => {
  const tipocondicionId = Number(item.tipocondicionId ?? item.tipocondicionid ?? item.id ?? 0);
  const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : '';
  if (!Number.isFinite(tipocondicionId) || tipocondicionId <= 0 || !nombre) {
    return null;
  }
  return { tipocondicionId, nombre };
};

const FeedbackBanner = ({ feedback }: { feedback: FeedbackState }) => {
  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.type === 'success';
  return (
    <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
      <AppText
        style={[styles.feedbackText, isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError]}
      >
        {feedback.message}
      </AppText>
    </View>
  );
};

export function ControlCronicoScreen() {
  const { token, user } = useAuth();
  const requestHeaders = useMemo(() => buildHeaders(token, false), [token]);
  const jsonHeaders = useMemo(() => buildHeaders(token, true), [token]);
  const defaultPacienteId = useMemo(() => (user?.pacienteId ? String(user.pacienteId) : ''), [user?.pacienteId]);

  const buildInitialForm = useCallback(
    (): FormState => ({
      pacienteId: defaultPacienteId,
      condicioncronicaId: '',
      fechacontrol: '',
      horacontrol: '08:00',
      conclusiones: '',
      proximocontrol: '',
      medico: '',
    }),
    [defaultPacienteId],
  );

  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [condiciones, setCondiciones] = useState<CondicionRecord[]>([]);
  const [tipos, setTipos] = useState<TipoCondicion[]>([]);
  const [records, setRecords] = useState<ControlCronicoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([createMeasurementRow()]);
  const [showIOSControlPicker, setShowIOSControlPicker] = useState(false);
  const [showIOSControlTimePicker, setShowIOSControlTimePicker] = useState(false);
  const [showIOSProximoPicker, setShowIOSProximoPicker] = useState(false);

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
      const items = await fetchLinkedPatients(requestHeaders);
      setPatientOptions(items);
      if (!form.pacienteId && items.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(items[0]!.pacienteId) }));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoadingPatients(false);
    }
  }, [form.pacienteId, requestHeaders, token]);

  const fetchCatalogs = useCallback(async () => {
    try {
      const [condicionesResponse, tiposResponse] = await Promise.all([
        fetch(`${API_URL}/condicioncronica`, { headers: requestHeaders }),
        fetch(`${API_URL}/tipocondicioncronica`, { headers: requestHeaders }),
      ]);

      const condicionesBody = await condicionesResponse.json().catch(() => null);
      const tiposBody = await tiposResponse.json().catch(() => null);

      if (!condicionesResponse.ok) {
        throw new Error(
          (condicionesBody as { message?: string } | null)?.message ??
            'No se pudieron cargar las condiciones cronicas.',
        );
      }
      if (!tiposResponse.ok) {
        throw new Error(
          (tiposBody as { message?: string } | null)?.message ??
            'No se pudieron cargar los tipos de condicion.',
        );
      }

      const condicionesItems = Array.isArray(condicionesBody)
        ? condicionesBody
            .map((item) => normalizeCondicion((item ?? {}) as Record<string, unknown>))
            .filter((item): item is CondicionRecord => Boolean(item))
        : [];

      const tiposItems = Array.isArray(tiposBody)
        ? tiposBody
            .map((item) => normalizeTipoCondicion((item ?? {}) as Record<string, unknown>))
            .filter((item): item is TipoCondicion => Boolean(item))
        : [];

      setCondiciones(condicionesItems);
      setTipos(tiposItems);
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    }
  }, [requestHeaders]);

  const fetchRecords = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/controlcronico`, { headers: requestHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (body as { message?: string } | null)?.message ?? 'No se pudo cargar el historial.',
        );
      }
      const items = Array.isArray(body)
        ? body
            .map((item) => normalizeControl((item ?? {}) as Record<string, unknown>))
            .filter((item): item is ControlCronicoRecord => Boolean(item))
        : [];
      setRecords(items);
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestHeaders]);

  useEffect(() => {
    void fetchPatients();
    void fetchCatalogs();
    void fetchRecords();
  }, [fetchCatalogs, fetchPatients, fetchRecords]);

  const tiposMap = useMemo(() => {
    return tipos.reduce<Record<number, string>>((acc, item) => {
      acc[item.tipocondicionId] = item.nombre;
      return acc;
    }, {});
  }, [tipos]);

  const patientCondiciones = useMemo(() => {
    const pacienteId = Number(form.pacienteId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      return [] as CondicionRecord[];
    }
    return condiciones.filter((item) => item.pacienteId === pacienteId);
  }, [condiciones, form.pacienteId]);

  useEffect(() => {
    if (patientCondiciones.length === 0) {
      setForm((prev) => ({ ...prev, condicioncronicaId: '' }));
      return;
    }

    const currentId = Number(form.condicioncronicaId);
    const exists = patientCondiciones.some((item) => item.condicioncronicaId === currentId);
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        condicioncronicaId: String(patientCondiciones[0]!.condicioncronicaId),
      }));
    }
  }, [form.condicioncronicaId, patientCondiciones]);

  const filteredRecords = useMemo(() => {
    const activeConditionIds = new Set(patientCondiciones.map((item) => item.condicioncronicaId));
    if (activeConditionIds.size === 0) {
      return [] as Array<ControlCronicoRecord & { condicion?: CondicionRecord }>;
    }
    return records
      .filter((record) => activeConditionIds.has(record.condicioncronicaId))
      .map((record) => ({
        ...record,
        condicion: condiciones.find((item) => item.condicioncronicaId === record.condicioncronicaId),
      }));
  }, [condiciones, patientCondiciones, records]);

  const selectedPatientName = useMemo(() => {
    const pacienteId = Number(form.pacienteId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      return 'Paciente';
    }
    return (
      patientOptions.find((patient) => patient.pacienteId === pacienteId)?.displayName ??
      `Paciente #${pacienteId}`
    );
  }, [form.pacienteId, patientOptions]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMeasurementChange = (
    id: string,
    key: keyof Omit<MeasurementRow, 'id' | 'expanded'>,
    value: string,
  ) => {
    setMeasurements((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const toggleMeasurementExpanded = (id: string) => {
    setMeasurements((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, expanded: !item.expanded } : item,
      ),
    );
  };

  const addMeasurement = () => {
    setMeasurements((prev) => [
      ...prev.map((item) => ({ ...item, expanded: false })),
      createMeasurementRow(),
    ]);
  };

  const applyMeasurementPreset = (
    id: string,
    preset: (typeof measurementPresets)[number],
  ) => {
    setMeasurements((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, indicador: preset.label, unidad: preset.unit }
          : item,
      ),
    );
  };

  const removeMeasurement = (id: string) => {
    setMeasurements((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...buildInitialForm(),
      pacienteId: prev.pacienteId,
      condicioncronicaId:
        patientCondiciones.length > 0 ? String(patientCondiciones[0]!.condicioncronicaId) : '',
    }));
    setMeasurements([createMeasurementRow()]);
  };

  const handleDateConfirm = (key: 'fechacontrol' | 'proximocontrol', value: Date) => {
    handleChange(key, toDateOnlyString(value));
    if (Platform.OS === 'ios') {
      if (key === 'fechacontrol') {
        setShowIOSControlPicker(false);
      } else {
        setShowIOSProximoPicker(false);
      }
    }
  };

  const handleTimeConfirm = (value: Date) => {
    const formatted = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
    handleChange('horacontrol', formatted);
    if (Platform.OS === 'ios') {
      setShowIOSControlTimePicker(false);
    }
  };

  const openDatePicker = (key: 'fechacontrol' | 'proximocontrol') => {
    if (openWebDateTimePicker('date', form[key], (value) => handleDateConfirm(key, parseDateForPicker(value)))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[key]),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleDateConfirm(key, selectedDate);
          }
        },
      });
      return;
    }

    if (key === 'fechacontrol') {
      setShowIOSControlPicker(true);
    } else {
      setShowIOSProximoPicker(true);
    }
  };

  const openTimePicker = () => {
    if (openWebDateTimePicker('time', form.horacontrol, (value) => handleTimeConfirm(parseTimeForPicker(value)))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseTimeForPicker(form.horacontrol),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleTimeConfirm(selectedDate);
          }
        },
      });
      return;
    }

    setShowIOSControlTimePicker(true);
  };

  const handleSubmit = async () => {
    setFeedback(null);

    const condicioncronicaId = Number(form.condicioncronicaId);
    const fechacontrol = composeDateTime(form.fechacontrol, form.horacontrol);

    if (!Number.isFinite(condicioncronicaId) || condicioncronicaId <= 0 || !fechacontrol) {
      setFeedback({
        type: 'error',
        message: 'Condicion cronica, fecha y hora de control son obligatorios.',
      });
      return;
    }

    const validMeasurements = measurements
      .map((measurement) => {
        const trimmedIndicator = measurement.indicador.trim();
        const trimmedUnit = measurement.unidad.trim();
        const trimmedResult = measurement.resultado.trim();
        const rawValue = measurement.valor.trim();
        const value =
          rawValue === ''
            ? undefined
            : Number.isFinite(Number(rawValue))
              ? Number(rawValue)
              : NaN;

        return {
          indicador: trimmedIndicator || undefined,
          valor: value,
          unidad: trimmedUnit || undefined,
          resultado: trimmedResult || undefined,
        };
      })
      .filter(
        (measurement) =>
          measurement.indicador !== undefined ||
          measurement.valor !== undefined ||
          measurement.unidad !== undefined ||
          measurement.resultado !== undefined,
      );

    if (validMeasurements.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Agrega al menos una medicion con indicador, valor, unidad o resultado.',
      });
      return;
    }

    if (validMeasurements.some((measurement) => Number.isNaN(measurement.valor))) {
      setFeedback({
        type: 'error',
        message: 'Todos los valores numericos deben ser validos.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        validMeasurements.map(async (measurement) => {
          const payload = {
            condicioncronicaId,
            fechacontrol,
            indicador: measurement.indicador,
            valor: measurement.valor,
            unidad: measurement.unidad,
            resultado: measurement.resultado,
            conclusiones: form.conclusiones.trim() || undefined,
            proximocontrol: form.proximocontrol || undefined,
            medico: form.medico.trim() || undefined,
            creadopor: user?.username ?? undefined,
          };

          const response = await fetch(`${API_URL}/controlcronico`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(payload),
          });
          const body = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(
              (body as { message?: string } | null)?.message ??
                'No se pudo registrar el control cronico.',
            );
          }
        }),
      );

      setFeedback({
        type: 'success',
        message:
          validMeasurements.length === 1
            ? 'Control cronico registrado correctamente.'
            : `${validMeasurements.length} mediciones fueron registradas correctamente.`,
      });
      resetForm();
      setShowForm(false);
      await fetchRecords();
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchRecords()} />}
    >
      <View style={styles.heroCard}>
        <AppText style={styles.kicker}>SEGUIMIENTO CRONICO</AppText>
        <View style={styles.header}>
          <AppText style={styles.title}>Control cronico</AppText>
          <AppText style={styles.subtitle}>
            Registra mediciones, revisa el estado del paciente y deja programado el proximo control.
          </AppText>
        </View>
      </View>

      <FeedbackBanner feedback={feedback} />

      <View style={styles.filterCard}>
        <AppText style={styles.label}>Paciente</AppText>
        {loadingPatients ? (
          <View style={styles.inlineState}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.inlineStateText}>Cargando pacientes...</AppText>
          </View>
        ) : patientOptions.length === 0 ? (
          <AppText style={styles.emptySelectText}>No hay pacientes vinculados disponibles.</AppText>
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
        <AppText style={styles.filterHint}>{selectedPatientName}</AppText>
      </View>

      <View style={styles.summaryCard}>
        <AppText style={styles.sectionTitle}>Condiciones del paciente</AppText>
        <AppText style={styles.sectionSubtitle}>
          {patientCondiciones.length === 0
            ? 'Este paciente no tiene condiciones cronicas disponibles para seguimiento.'
            : 'Estas son las condiciones sobre las que puedes registrar controles.'}
        </AppText>

        {patientCondiciones.length === 0 ? (
          <AppText style={styles.emptySelectText}>
            Primero registra una condicion cronica para este paciente.
          </AppText>
        ) : (
          patientCondiciones.map((item) => (
            <View key={item.condicioncronicaId} style={styles.conditionBadgeRow}>
              <View>
                <AppText style={styles.conditionBadgeTitle}>
                  {tiposMap[item.tipocondicionId] ?? `Condicion #${item.tipocondicionId}`}
                </AppText>
                <AppText style={styles.conditionBadgeMeta}>{item.estado || 'Estado sin definir'}</AppText>
              </View>
              <View style={styles.conditionStatusPill}>
                <AppText style={styles.conditionStatusText}>{item.estado || 'Activa'}</AppText>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Historial de controles</AppText>
        <AppText style={styles.sectionSubtitle}>
          {filteredRecords.length === 1
            ? '1 control registrado'
            : `${filteredRecords.length} controles registrados`}
        </AppText>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#29B6FF" />
          <AppText style={styles.stateText}>Cargando historial...</AppText>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.stateBox}>
          <AppText style={styles.stateTitle}>Sin registros</AppText>
          <AppText style={styles.stateText}>
            No hay controles cronicos para el paciente seleccionado.
          </AppText>
        </View>
      ) : (
        filteredRecords.map((record) => {
          const tipoNombre = record.condicion ? tiposMap[record.condicion.tipocondicionId] : null;
          return (
            <View key={record.controlcronicoId} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTopCopy}>
                  <AppText style={styles.cardTitle}>
                    {tipoNombre ?? `Condicion #${record.condicioncronicaId}`}
                  </AppText>
                  <AppText style={styles.cardSubtitle}>
                    Control: {formatRecordDateTime(record.fechacontrol)}
                  </AppText>
                </View>
                <View style={styles.resultPill}>
                  <AppText style={styles.resultPillText}>{record.resultado || 'Sin resultado'}</AppText>
                </View>
              </View>
              <AppText style={styles.cardText}>Indicador: {record.indicador || 'Sin dato'}</AppText>
              <AppText style={styles.cardText}>
                Valor:{' '}
                {record.valor !== null && record.valor !== undefined
                  ? `${record.valor}${record.unidad ? ` ${record.unidad}` : ''}`
                  : 'Sin dato'}
              </AppText>
              <AppText style={styles.cardText}>
                Proximo control: {formatRecordDate(record.proximocontrol)}
              </AppText>
              <AppText style={styles.cardText}>Medico: {record.medico || 'Sin dato'}</AppText>
              {record.conclusiones ? (
                <AppText style={styles.cardText}>Conclusiones: {record.conclusiones}</AppText>
              ) : null}
            </View>
          );
        })
      )}

      {showForm ? (
        <View style={styles.formCard}>
          <AppText style={styles.formTitle}>Nuevo control</AppText>
          <AppText style={styles.formSubtitle}>
            Puedes agregar varias mediciones en el mismo control. Se guardan como registros separados con la misma fecha y hora.
          </AppText>

          <AppText style={styles.label}>Condicion cronica</AppText>
          {patientCondiciones.length === 0 ? (
            <AppText style={styles.emptySelectText}>
              Primero registra una condicion cronica para este paciente.
            </AppText>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.condicioncronicaId}
                onValueChange={(value) => handleChange('condicioncronicaId', String(value))}
                dropdownIconColor="#F4F8FF"
              >
                {patientCondiciones.map((item) => (
                  <Picker.Item
                    key={item.condicioncronicaId}
                    label={`${tiposMap[item.tipocondicionId] ?? `Condicion #${item.tipocondicionId}`} - ${item.estado ?? 'Activa'}`}
                    value={String(item.condicioncronicaId)}
                  />
                ))}
              </Picker>
            </View>
          )}

          <AppText style={styles.label}>Fecha del control</AppText>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fechacontrol')}>
            <AppText style={styles.dateButtonText}>{formatDisplayDate(form.fechacontrol)}</AppText>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showIOSControlPicker ? (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateForPicker(form.fechacontrol)}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleDateConfirm('fechacontrol', selectedDate);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.iosPickerDoneBtn}
                onPress={() => setShowIOSControlPicker(false)}
              >
                <AppText style={styles.iosPickerDoneText}>Listo</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <AppText style={styles.label}>Hora del control</AppText>
          {Platform.OS === 'web' ? (
            <WebTimeInput
              value={form.horacontrol}
              onChange={(value) => handleChange('horacontrol', value)}
              ariaLabel="Hora del control cronico"
            />
          ) : (
            <TouchableOpacity style={styles.dateButton} onPress={openTimePicker}>
              <AppText style={styles.dateButtonText}>{formatDisplayTime(form.horacontrol)}</AppText>
            </TouchableOpacity>
          )}
          {Platform.OS === 'ios' && showIOSControlTimePicker ? (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="time"
                display="spinner"
                value={parseTimeForPicker(form.horacontrol)}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleTimeConfirm(selectedDate);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.iosPickerDoneBtn}
                onPress={() => setShowIOSControlTimePicker(false)}
              >
                <AppText style={styles.iosPickerDoneText}>Listo</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.measurementsHeader}>
            <View style={styles.measurementsHeaderCopy}>
              <AppText style={styles.formTitle}>Mediciones</AppText>
              <AppText style={styles.sectionSubtitle}>
                {measurements.length === 1
                  ? 'Agrega el valor principal de este control'
                  : `${measurements.length} mediciones en este control`}
              </AppText>
            </View>
            <TouchableOpacity style={styles.addMeasurementBtn} onPress={addMeasurement}>
              <Ionicons name="add" size={18} color="#29B6FF" />
              <AppText style={styles.addMeasurementText}>Agregar</AppText>
            </TouchableOpacity>
          </View>

          {measurements.map((measurement, index) => (
            <View
              key={measurement.id}
              style={[
                styles.measurementCard,
                measurement.expanded && styles.measurementCardExpanded,
              ]}
            >
              <View style={styles.measurementTopRow}>
                <TouchableOpacity
                  style={styles.measurementToggle}
                  onPress={() => toggleMeasurementExpanded(measurement.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.measurementNumber}>
                    <AppText style={styles.measurementNumberText}>{index + 1}</AppText>
                  </View>
                  <View style={styles.measurementToggleCopy}>
                    <AppText style={styles.measurementTitle}>
                      {measurement.indicador || `Medición ${index + 1}`}
                    </AppText>
                    <AppText style={styles.measurementSummary}>
                      {getMeasurementSummary(measurement)}
                    </AppText>
                  </View>
                  <Ionicons
                    name={measurement.expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#29B6FF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.removeMeasurementBtn, measurements.length === 1 && styles.disabledBtn]}
                  onPress={() => removeMeasurement(measurement.id)}
                  disabled={measurements.length === 1}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF4D73" />
                </TouchableOpacity>
              </View>

              {measurement.expanded ? (
                <View style={styles.measurementBody}>
                  <AppText style={styles.label}>Indicador</AppText>
                  <View style={styles.quickOptions}>
                    {measurementPresets.map((preset) => {
                      const active = measurement.indicador === preset.label;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          style={[styles.quickOption, active && styles.quickOptionActive]}
                          onPress={() => applyMeasurementPreset(measurement.id, preset)}
                        >
                          <AppText style={[styles.quickOptionText, active && styles.quickOptionTextActive]}>
                            {preset.label}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <AppTextInput
                    style={styles.input}
                    placeholder="Otro indicador"
                    placeholderTextColor="#9FB3C8"
                    value={measurement.indicador}
                    onChangeText={(value) => handleMeasurementChange(measurement.id, 'indicador', value)}
                  />

                  <View style={styles.measurementFieldsRow}>
                    <View style={styles.measurementField}>
                      <AppText style={styles.label}>Valor</AppText>
                      <AppTextInput
                        style={styles.input}
                        placeholder="Ej. 120"
                        placeholderTextColor="#9FB3C8"
                        value={measurement.valor}
                        onChangeText={(value) => handleMeasurementChange(measurement.id, 'valor', value)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.measurementField}>
                      <AppText style={styles.label}>Unidad</AppText>
                      <AppTextInput
                        style={styles.input}
                        placeholder="mg/dL, mmHg..."
                        placeholderTextColor="#9FB3C8"
                        value={measurement.unidad}
                        onChangeText={(value) => handleMeasurementChange(measurement.id, 'unidad', value)}
                      />
                    </View>
                  </View>

                  <AppText style={styles.label}>Resultado</AppText>
                  <View style={styles.quickOptions}>
                    {resultOptions.map((result) => {
                      const active = measurement.resultado === result;
                      return (
                        <TouchableOpacity
                          key={result}
                          style={[styles.resultOption, active && styles.resultOptionActive]}
                          onPress={() => handleMeasurementChange(measurement.id, 'resultado', result)}
                        >
                          <AppText style={[styles.resultOptionText, active && styles.resultOptionTextActive]}>
                            {result}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <AppTextInput
                    style={styles.input}
                    placeholder="Escribe otro resultado u observación"
                    placeholderTextColor="#9FB3C8"
                    value={measurement.resultado}
                    onChangeText={(value) => handleMeasurementChange(measurement.id, 'resultado', value)}
                  />
                </View>
              ) : null}
            </View>
          ))}

          <AppText style={styles.label}>Conclusiones generales</AppText>
          <AppTextInput
            style={[styles.input, styles.multiline]}
            placeholder="Resumen clinico"
            placeholderTextColor="#9FB3C8"
            value={form.conclusiones}
            onChangeText={(value) => handleChange('conclusiones', value)}
            multiline
            numberOfLines={3}
          />

          <AppText style={styles.label}>Proximo control</AppText>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('proximocontrol')}>
            <AppText style={styles.dateButtonText}>{formatDisplayDate(form.proximocontrol)}</AppText>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showIOSProximoPicker ? (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateForPicker(form.proximocontrol)}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleDateConfirm('proximocontrol', selectedDate);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.iosPickerDoneBtn}
                onPress={() => setShowIOSProximoPicker(false)}
              >
                <AppText style={styles.iosPickerDoneText}>Listo</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <AppText style={styles.label}>Medico</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="Responsable del control"
            placeholderTextColor="#9FB3C8"
            value={form.medico}
            onChangeText={(value) => handleChange('medico', value)}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (isSubmitting || patientCondiciones.length === 0) && styles.disabledBtn]}
            disabled={isSubmitting || patientCondiciones.length === 0}
            onPress={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#F4F8FF" />
            ) : (
              <AppText style={styles.primaryBtnText}>Guardar control</AppText>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <AppText style={styles.fabText}>{showForm ? 'x' : '+'}</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#071120',
    borderRadius: 24,
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
    color: '#F4F8FF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C9D7E8',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#38E28E18',
    borderColor: '#38E28E',
  },
  feedbackError: {
    backgroundColor: '#FF4D7318',
    borderColor: '#FF4D73',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#38E28E',
  },
  feedbackTextError: {
    color: '#FF4D73',
  },
  filterCard: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  label: {
    color: '#F4F8FF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27496D',
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  filterHint: {
    marginTop: 10,
    color: '#29B6FF',
  },
  summaryCard: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  conditionBadgeRow: {
    backgroundColor: '#071120',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  conditionBadgeTitle: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 15,
  },
  conditionBadgeMeta: {
    color: '#C9D7E8',
    marginTop: 2,
    fontSize: 12,
  },
  conditionStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#38E28E18',
  },
  conditionStatusText: {
    color: '#38E28E',
    fontWeight: '800',
    fontSize: 11,
  },
  emptySelectText: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  inlineState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineStateText: {
    color: '#C9D7E8',
  },
  stateBox: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  stateTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stateText: {
    color: '#C9D7E8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTopCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#F4F8FF',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#38E28E',
    fontSize: 12,
  },
  resultPill: {
    backgroundColor: '#071120',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultPillText: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardText: {
    color: '#F4F8FF',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#29B6FF',
    lineHeight: 19,
  },
  measurementsHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  measurementsHeaderCopy: {
    flex: 1,
  },
  addMeasurementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#071120',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  addMeasurementText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  measurementCard: {
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  measurementCardExpanded: {
    borderColor: '#29B6FF',
    backgroundColor: '#0B1929',
  },
  measurementTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  measurementToggle: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  measurementNumber: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#29B6FF18',
  },
  measurementNumberText: {
    color: '#29B6FF',
    fontWeight: '900',
  },
  measurementToggleCopy: {
    flex: 1,
    gap: 4,
  },
  measurementTitle: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 15,
  },
  measurementSummary: {
    color: '#C9D7E8',
    fontSize: 12,
    lineHeight: 18,
  },
  removeMeasurementBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FF4D7310',
    borderWidth: 1,
    borderColor: '#FF4D7335',
  },
  measurementBody: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#27496D',
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickOption: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#071120',
  },
  quickOptionActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF',
  },
  quickOptionText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  quickOptionTextActive: {
    color: '#071120',
  },
  measurementFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  measurementField: {
    flex: 1,
    minWidth: 180,
  },
  resultOption: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#071120',
  },
  resultOptionActive: {
    borderColor: '#38E28E',
    backgroundColor: '#38E28E18',
  },
  resultOptionText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  resultOptionTextActive: {
    color: '#38E28E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#F4F8FF',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  dateButtonText: {
    color: '#F4F8FF',
    fontSize: 15,
    textAlign: 'center',
  },
  iosPickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    backgroundColor: '#071120',
    overflow: 'hidden',
    marginBottom: 12,
  },
  iosPickerDoneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#27496D',
  },
  iosPickerDoneText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#38E28E',
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
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
