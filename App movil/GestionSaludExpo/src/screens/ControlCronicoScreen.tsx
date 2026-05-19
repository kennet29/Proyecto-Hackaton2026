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

type FormState = {
  pacienteId: string;
  condicioncronicaId: string;
  fechacontrol: string;
  indicador: string;
  valor: string;
  unidad: string;
  resultado: string;
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

  if (!Number.isFinite(controlcronicoId) || controlcronicoId <= 0 || !Number.isFinite(condicioncronicaId) || condicioncronicaId <= 0) {
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
    fechacontrol: toDateOnlyString(item.fechacontrol as string | null | undefined) || null,
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
      <Text style={[styles.feedbackText, isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError]}>
        {feedback.message}
      </Text>
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
      indicador: '',
      valor: '',
      unidad: '',
      resultado: '',
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
  const [showIOSControlPicker, setShowIOSControlPicker] = useState(false);
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
        throw new Error((condicionesBody as { message?: string } | null)?.message ?? 'No se pudieron cargar las condiciones cronicas.');
      }
      if (!tiposResponse.ok) {
        throw new Error((tiposBody as { message?: string } | null)?.message ?? 'No se pudieron cargar los tipos de condicion.');
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
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo cargar el historial.');
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
      setForm((prev) => ({ ...prev, condicioncronicaId: String(patientCondiciones[0]!.condicioncronicaId) }));
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

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...buildInitialForm(),
      pacienteId: prev.pacienteId,
      condicioncronicaId:
        patientCondiciones.length > 0 ? String(patientCondiciones[0]!.condicioncronicaId) : '',
    }));
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

  const openDatePicker = (key: 'fechacontrol' | 'proximocontrol') => {
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

  const handleSubmit = async () => {
    setFeedback(null);

    const condicioncronicaId = Number(form.condicioncronicaId);
    if (!Number.isFinite(condicioncronicaId) || condicioncronicaId <= 0 || !form.fechacontrol) {
      setFeedback({
        type: 'error',
        message: 'Condicion cronica y fecha de control son obligatorios.',
      });
      return;
    }

    const valor =
      form.valor.trim() === ''
        ? undefined
        : Number.isFinite(Number(form.valor))
          ? Number(form.valor)
          : NaN;

    if (Number.isNaN(valor)) {
      setFeedback({
        type: 'error',
        message: 'El valor debe ser numerico.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        condicioncronicaId,
        fechacontrol: form.fechacontrol,
        indicador: form.indicador.trim() || undefined,
        valor,
        unidad: form.unidad.trim() || undefined,
        resultado: form.resultado.trim() || undefined,
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
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo registrar el control cronico.');
      }

      setFeedback({ type: 'success', message: 'Control cronico registrado correctamente.' });
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
        <Text style={styles.title}>Control Cronico</Text>
        <Text style={styles.subtitle}>Registra mediciones y seguimiento sobre condiciones cronicas existentes.</Text>
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
          <Text style={styles.stateText}>No hay controles cronicos para el paciente seleccionado.</Text>
        </View>
      ) : (
        filteredRecords.map((record) => {
          const tipoNombre = record.condicion ? tiposMap[record.condicion.tipocondicionId] : null;
          return (
            <View key={record.controlcronicoId} style={styles.card}>
              <Text style={styles.cardTitle}>{tipoNombre ?? `Condicion #${record.condicioncronicaId}`}</Text>
              <Text style={styles.cardSubtitle}>Control: {formatRecordDate(record.fechacontrol)}</Text>
              <Text style={styles.cardText}>Indicador: {record.indicador || 'Sin dato'}</Text>
              <Text style={styles.cardText}>
                Valor: {record.valor !== null && record.valor !== undefined ? `${record.valor}${record.unidad ? ` ${record.unidad}` : ''}` : 'Sin dato'}
              </Text>
              <Text style={styles.cardText}>Resultado: {record.resultado || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Proximo control: {formatRecordDate(record.proximocontrol)}</Text>
              <Text style={styles.cardText}>Medico: {record.medico || 'Sin dato'}</Text>
              {record.conclusiones ? <Text style={styles.cardText}>Conclusiones: {record.conclusiones}</Text> : null}
            </View>
          );
        })
      )}

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nuevo control</Text>

          <Text style={styles.label}>Condicion cronica</Text>
          {patientCondiciones.length === 0 ? (
            <Text style={styles.emptySelectText}>Primero registra una condicion cronica para este paciente.</Text>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.condicioncronicaId}
                onValueChange={(value) => handleChange('condicioncronicaId', String(value))}
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

          <Text style={styles.label}>Fecha de control</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('fechacontrol')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechacontrol)}</Text>
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
              <TouchableOpacity style={styles.iosPickerDoneBtn} onPress={() => setShowIOSControlPicker(false)}>
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.label}>Indicador</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Glucosa, presion arterial"
            value={form.indicador}
            onChangeText={(value) => handleChange('indicador', value)}
          />

          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 120"
            value={form.valor}
            onChangeText={(value) => handleChange('valor', value)}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Unidad</Text>
          <TextInput
            style={styles.input}
            placeholder="mg/dL, mmHg..."
            value={form.unidad}
            onChangeText={(value) => handleChange('unidad', value)}
          />

          <Text style={styles.label}>Resultado</Text>
          <TextInput
            style={styles.input}
            placeholder="Controlado, alto, estable..."
            value={form.resultado}
            onChangeText={(value) => handleChange('resultado', value)}
          />

          <Text style={styles.label}>Conclusiones</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Resumen clinico"
            value={form.conclusiones}
            onChangeText={(value) => handleChange('conclusiones', value)}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Proximo control</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('proximocontrol')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.proximocontrol)}</Text>
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
              <TouchableOpacity style={styles.iosPickerDoneBtn} onPress={() => setShowIOSProximoPicker(false)}>
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.label}>Medico</Text>
          <TextInput
            style={styles.input}
            placeholder="Responsable del control"
            value={form.medico}
            onChangeText={(value) => handleChange('medico', value)}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (isSubmitting || patientCondiciones.length === 0) && styles.disabledBtn]}
            disabled={isSubmitting || patientCondiciones.length === 0}
            onPress={() => void handleSubmit()}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar control</Text>}
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
    color: '#86efac',
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
    backgroundColor: '#16a34a',
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
