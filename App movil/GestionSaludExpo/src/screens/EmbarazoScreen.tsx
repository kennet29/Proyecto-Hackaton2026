import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

type EmbarazoRecord = {
  embarazoId: number;
  pacienteId: number;
  fechainicio?: string | null;
  fechaprobableparto?: string | null;
  numerocontrol?: number | null;
  riesgo?: string | null;
  estado?: string | null;
  notas?: string | null;
};

type FormState = {
  pacienteId: string;
  fechainicio: string;
  fechaprobableparto: string;
  numerocontrol: string;
  riesgo: string;
  estado: string;
  notas: string;
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

const parseDateForPicker = (value?: string | null) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part: number) => !Number.isNaN(part))) {
    return new Date(parts[0]!, (parts[1] ?? 1) - 1, parts[2]!);
  }
  return new Date();
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

const normalizeRecord = (item: Record<string, unknown>): EmbarazoRecord | null => {
  const embarazoId = Number(item.embarazoId ?? item.embarazoid ?? item.id ?? 0);
  const pacienteId = Number(item.pacienteId ?? item.pacienteid ?? 0);

  if (!Number.isFinite(embarazoId) || embarazoId <= 0 || !Number.isFinite(pacienteId) || pacienteId <= 0) {
    return null;
  }

  const rawNumero = item.numerocontrol;
  const numerocontrol =
    rawNumero === null || rawNumero === undefined || rawNumero === ''
      ? null
      : Number.isFinite(Number(rawNumero))
        ? Number(rawNumero)
        : null;

  return {
    embarazoId,
    pacienteId,
    fechainicio: toDateOnlyString(item.fechainicio as string | null | undefined) || null,
    fechaprobableparto: toDateOnlyString(item.fechaprobableparto as string | null | undefined) || null,
    numerocontrol,
    riesgo: typeof item.riesgo === 'string' ? item.riesgo : null,
    estado: typeof item.estado === 'string' ? item.estado : null,
    notas: typeof item.notas === 'string' ? item.notas : null,
  };
};

const FeedbackBanner = ({ feedback }: { feedback: FeedbackState }) => {
  if (!feedback) {
    return null;
  }

  const isSuccess = feedback.type === 'success';
  return (
    <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
      <Text style={[styles.feedbackText, isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError]}>
        {feedback.message}
      </Text>
    </View>
  );
};

export function EmbarazoScreen() {
  const { token, user } = useAuth();
  const patientHeaders = useMemo(() => buildHeaders(token, false), [token]);
  const jsonHeaders = useMemo(() => buildHeaders(token, true), [token]);
  const defaultPacienteId = useMemo(() => (user?.pacienteId ? String(user.pacienteId) : ''), [user?.pacienteId]);

  const buildInitialForm = useCallback(
    (): FormState => ({
      pacienteId: defaultPacienteId,
      fechainicio: '',
      fechaprobableparto: '',
      numerocontrol: '',
      riesgo: '',
      estado: 'Activo',
      notas: '',
    }),
    [defaultPacienteId],
  );

  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<EmbarazoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [showIOSInicioPicker, setShowIOSInicioPicker] = useState(false);
  const [showIOSPartoPicker, setShowIOSPartoPicker] = useState(false);

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
      const items = await fetchLinkedPatients(patientHeaders);
      setPatientOptions(items);
      if (!form.pacienteId && items.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(items[0]!.pacienteId) }));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoadingPatients(false);
    }
  }, [form.pacienteId, patientHeaders, token]);

  const fetchRecords = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/embarazo`, { headers: patientHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo cargar el historial.');
      }
      const items = Array.isArray(body)
        ? body
            .map((item) => normalizeRecord((item ?? {}) as Record<string, unknown>))
            .filter((item): item is EmbarazoRecord => Boolean(item))
        : [];
      setRecords(items);
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientHeaders]);

  useEffect(() => {
    void fetchPatients();
    void fetchRecords();
  }, [fetchPatients, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const pacienteId = Number(form.pacienteId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
      return records;
    }
    return records.filter((record) => record.pacienteId === pacienteId);
  }, [form.pacienteId, records]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(buildInitialForm());
  };

  const handleDateConfirm = (key: 'fechainicio' | 'fechaprobableparto', value: Date) => {
    handleChange(key, toDateOnlyString(value));
    if (Platform.OS === 'ios') {
      if (key === 'fechainicio') {
        setShowIOSInicioPicker(false);
      } else {
        setShowIOSPartoPicker(false);
      }
    }
  };

  const openDatePicker = (key: 'fechainicio' | 'fechaprobableparto') => {
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

    if (key === 'fechainicio') {
      setShowIOSInicioPicker(true);
    } else {
      setShowIOSPartoPicker(true);
    }
  };

  const handleSubmit = async () => {
    setFeedback(null);

    const pacienteId = Number(form.pacienteId);
    if (!Number.isFinite(pacienteId) || pacienteId <= 0 || !form.fechainicio) {
      setFeedback({
        type: 'error',
        message: 'Paciente y fecha de inicio son obligatorios.',
      });
      return;
    }

    const numeroControl =
      form.numerocontrol.trim() === ''
        ? undefined
        : Number.isFinite(Number(form.numerocontrol))
          ? Number(form.numerocontrol)
          : NaN;

    if (Number.isNaN(numeroControl)) {
      setFeedback({
        type: 'error',
        message: 'El numero de control debe ser numerico.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pacienteId,
        fechainicio: form.fechainicio,
        fechaprobableparto: form.fechaprobableparto || undefined,
        numerocontrol: numeroControl,
        riesgo: form.riesgo.trim() || undefined,
        estado: form.estado.trim() || 'Activo',
        notas: form.notas.trim() || undefined,
        creadopor: user?.username ?? undefined,
      };

      const response = await fetch(`${API_URL}/embarazo`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo registrar el embarazo.');
      }

      setFeedback({ type: 'success', message: 'Registro de embarazo guardado correctamente.' });
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
      <View style={styles.header}>
        <Text style={styles.title}>Embarazo</Text>
        <Text style={styles.subtitle}>Lleva seguimiento de inicio, controles y fecha probable de parto.</Text>
      </View>

      <FeedbackBanner feedback={feedback} />

      <View style={styles.filterCard}>
        <Text style={styles.label}>Paciente</Text>
        {loadingPatients ? (
          <View style={styles.inlineState}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.inlineStateText}>Cargando pacientes...</Text>
          </View>
        ) : patientOptions.length === 0 ? (
          <Text style={styles.emptySelectText}>No hay pacientes vinculados disponibles.</Text>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
            >
              {patientOptions.map((patient) => (
                <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#2563eb" />
          <Text style={styles.stateText}>Cargando historial...</Text>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Sin registros</Text>
          <Text style={styles.stateText}>Todavia no hay embarazos documentados para este paciente.</Text>
        </View>
      ) : (
        filteredRecords.map((record) => (
          <View key={record.embarazoId} style={styles.card}>
            <Text style={styles.cardTitle}>{record.estado || 'Estado no definido'}</Text>
            <Text style={styles.cardSubtitle}>Inicio: {formatRecordDate(record.fechainicio)}</Text>
            <Text style={styles.cardText}>Probable parto: {formatRecordDate(record.fechaprobableparto)}</Text>
            <Text style={styles.cardText}>
              Numero de control: {record.numerocontrol !== null && record.numerocontrol !== undefined ? record.numerocontrol : 'Sin dato'}
            </Text>
            <Text style={styles.cardText}>Riesgo: {record.riesgo || 'Sin dato'}</Text>
            {record.notas ? <Text style={styles.cardText}>Notas: {record.notas}</Text> : null}
          </View>
        ))
      )}

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nuevo seguimiento</Text>

          <Text style={styles.label}>Fecha de inicio</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fechainicio')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechainicio)}</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showIOSInicioPicker ? (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateForPicker(form.fechainicio)}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleDateConfirm('fechainicio', selectedDate);
                  }
                }}
              />
              <TouchableOpacity style={styles.iosPickerDoneBtn} onPress={() => setShowIOSInicioPicker(false)}>
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.label}>Fecha probable de parto</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fechaprobableparto')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechaprobableparto)}</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showIOSPartoPicker ? (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateForPicker(form.fechaprobableparto)}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleDateConfirm('fechaprobableparto', selectedDate);
                  }
                }}
              />
              <TouchableOpacity style={styles.iosPickerDoneBtn} onPress={() => setShowIOSPartoPicker(false)}>
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.label}>Numero de control</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 2"
            value={form.numerocontrol}
            onChangeText={(value) => handleChange('numerocontrol', value)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Riesgo</Text>
          <TextInput
            style={styles.input}
            placeholder="Bajo, moderado, alto..."
            value={form.riesgo}
            onChangeText={(value) => handleChange('riesgo', value)}
          />

          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            placeholder="Activo, finalizado..."
            value={form.estado}
            onChangeText={(value) => handleChange('estado', value)}
          />

          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Notas adicionales"
            value={form.notas}
            onChangeText={(value) => handleChange('notas', value)}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar seguimiento</Text>}
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <Text style={styles.fabText}>{showForm ? 'x' : '+'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  feedbackBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextError: {
    color: '#b91c1c',
  },
  filterCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    backgroundColor: '#0b1220',
  },
  emptySelectText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  inlineState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineStateText: {
    color: '#cbd5e1',
  },
  stateBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stateText: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#f9a8d4',
    fontSize: 12,
  },
  cardText: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  formTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  dateButtonText: {
    color: '#0f172a',
    fontSize: 15,
  },
  iosPickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  iosPickerDoneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5f5',
  },
  iosPickerDoneText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
