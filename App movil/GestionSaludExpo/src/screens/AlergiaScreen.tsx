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

type AlergiaRecord = {
  alergiaId: number;
  pacienteId: number;
  tipo: string;
  desencadenante?: string | null;
  severidad?: string | null;
  reaccion?: string | null;
  tratamiento?: string | null;
  fechadiagnostico?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  creadoen?: string | null;
};

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
  parentesco?: string | null;
};

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  if (!feedback) {
    return null;
  }
  const isSuccess = feedback.type === 'success';
  return (
    <View
      style={[
        styles.feedbackBox,
        isSuccess ? styles.feedbackSuccess : styles.feedbackError,
      ]}
    >
      <Text
        style={[
          styles.feedbackText,
          isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError,
        ]}
      >
        {feedback.message}
      </Text>
    </View>
  );
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo completar la acción, intenta nuevamente.';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function AlergiaScreen() {
  const { token, user } = useAuth();
  const defaultPacienteId = useMemo(
    () => (user?.pacienteId ? String(user.pacienteId) : ''),
    [user?.pacienteId],
  );
  const buildInitialForm = useCallback(
    () => ({
      pacienteId: defaultPacienteId,
      tipo: '',
      desencadenante: '',
      severidad: '',
      reaccion: '',
      tratamiento: '',
      fechadiagnostico: '',
      estado: 'Activa',
      observaciones: '',
    }),
    [defaultPacienteId],
  );

  const [records, setRecords] = useState<AlergiaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(buildInitialForm);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({ ...prev, pacienteId: defaultPacienteId }));
    }
  }, [defaultPacienteId, editingId]);

  const headers = useMemo(() => {
    const base: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
    setLoadingPatients(true);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar las personas registradas.');
      }
      const items: LinkedPatient[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const pacienteId = relation.pacienteId;
              let displayName = `Paciente #${pacienteId}`;
              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, { headers });
                const patient = await patientResponse.json().catch(() => null);
                if (patient && patientResponse.ok) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const candidate = `${nombres} ${apellidos}`.trim();
                  if (candidate) {
                    displayName = candidate;
                  }
                }
              } catch {
                // ignorar errores individuales
              }
              return {
                pacienteId,
                displayName: relation.esPrincipal
                  ? `${displayName} (Principal)`
                  : displayName,
                parentesco: relation.parentesco ?? null,
              };
            }),
          )
        : [];
      setPatientOptions(items);
      if (!form.pacienteId && items.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(items[0].pacienteId) }));
      }
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoadingPatients(false);
    }
  }, [headers, token, form.pacienteId]);

  const fetchRecords = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/alergia`, { headers });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron obtener las alergias');
      }
      setRecords(Array.isArray(body) ? body : []);
    } catch (error) {
      setFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const resetForm = useCallback(() => {
    setForm(buildInitialForm());
    setEditingId(null);
  }, [buildInitialForm]);

  const cancelEditing = () => {
    resetForm();
    setFeedback(null);
  };

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseLocalDateString = (value?: string) => {
    if (!value) {
      return null;
    }
    const parts = value.split('-');
    if (parts.length !== 3) {
      return null;
    }
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if ([year, month, day].some((part) => Number.isNaN(part))) {
      return null;
    }
    return new Date(year, month - 1, day);
  };

  const getCurrentDateValue = () => parseLocalDateString(form.fechadiagnostico) ?? new Date();

  const handleDateConfirm = (date: Date) => {
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    handleChange('fechadiagnostico', iso);
    if (Platform.OS === 'ios') {
      setShowIOSDatePicker(false);
    }
  };

  const openDatePicker = () => {
    const baseDate = getCurrentDateValue();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: 'date',
        is24Hour: true,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleDateConfirm(selectedDate);
          }
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const formatInputDate = (value?: string) => {
    if (!value) {
      return 'Selecciona una fecha';
    }
    const parsed = parseLocalDateString(value);
    if (!parsed) {
      return value;
    }
    return parsed.toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const ensurePatientOption = (record: AlergiaRecord) => {
    if (!record.pacienteId) {
      return;
    }
    setPatientOptions((prev) => {
      if (prev.some((item) => item.pacienteId === record.pacienteId)) {
        return prev;
      }
      const extraOption: LinkedPatient = {
        pacienteId: record.pacienteId,
        displayName: `Paciente #${record.pacienteId}`,
        parentesco: undefined,
      };
      return [...prev, extraOption];
    });
  };

  const startEditing = (record: AlergiaRecord) => {
    ensurePatientOption(record);
    setEditingId(record.alergiaId ?? null);
    setShowForm(true);
    setFeedback(null);
    setForm({
      pacienteId: record.pacienteId ? String(record.pacienteId) : '',
      tipo: record.tipo ?? '',
      desencadenante: record.desencadenante ?? '',
      severidad: record.severidad ?? '',
      reaccion: record.reaccion ?? '',
      tratamiento: record.tratamiento ?? '',
      fechadiagnostico: record.fechadiagnostico ?? '',
      estado: record.estado ?? 'Activa',
      observaciones: record.observaciones ?? '',
    });
  };

  const handleSubmit = async () => {
    setFeedback(null);
    const hasValidPatient =
      patientOptions.some((person) => String(person.pacienteId) === form.pacienteId) ||
      (editingId !== null && Boolean(form.pacienteId));
    if (!form.pacienteId || !form.tipo.trim() || !hasValidPatient) {
      setFeedback({
        type: 'error',
        message: 'Selecciona una persona válida y completa el tipo de alergia.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        pacienteId: Number(form.pacienteId),
        tipo: form.tipo.trim(),
        desencadenante: form.desencadenante.trim() || undefined,
        severidad: form.severidad.trim() || undefined,
        reaccion: form.reaccion.trim() || undefined,
        tratamiento: form.tratamiento.trim() || undefined,
        estado: form.estado.trim() || undefined,
        observaciones: form.observaciones.trim() || undefined,
        fechadiagnostico: form.fechadiagnostico ? form.fechadiagnostico : undefined,
        creadopor: user?.username ?? undefined,
      };
      if (!payload.pacienteId || Number.isNaN(payload.pacienteId)) {
        throw new Error('Paciente ID debe ser un número válido.');
      }
      const endpoint = editingId ? `${API_URL}/alergia/${editingId}` : `${API_URL}/alergia`;
      const method = editingId ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar la alergia');
      }
      setFeedback({
        type: 'success',
        message: editingId ? 'Alergia actualizada correctamente.' : 'Alergia registrada correctamente.',
      });
      resetForm();
      setShowForm(false);
      fetchRecords();
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchRecords} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alergias Registradas</Text>
          <Text style={styles.subtitle}>Revisa tu historial antes de crear nuevas entradas.</Text>
        </View>
      </View>

      <FeedbackBanner feedback={feedback} />

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#1d4ed8" />
          <Text style={styles.stateText}>Cargando alergias...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Sin registros</Text>
          <Text style={styles.stateText}>
            Aún no se han documentado alergias para este paciente.
          </Text>
        </View>
      ) : (
        records.map((item) => (
          <View key={item.alergiaId ?? `${item.tipo}-${item.pacienteId}-${item.creadoen}`} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{item.tipo}</Text>
                <Text style={styles.cardSubtitle}>
                  Paciente #{item.pacienteId} · Diagnosticada {formatDate(item.fechadiagnostico)}
                </Text>
              </View>
              <View style={styles.cardHeaderActions}>
                <View style={[styles.badge, item.estado?.toLowerCase() === 'inactiva' ? styles.badgeMuted : styles.badgeActive]}>
                  <Text style={styles.badgeText}>{item.estado ?? 'Activa'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editChip}
                  onPress={() => startEditing(item)}
                >
                  <Text style={styles.editChipText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardDetail}>
                Severidad: <Text style={styles.bold}>{item.severidad ?? 'Sin dato'}</Text>
              </Text>
              <Text style={styles.cardDetail}>
                Desencadenante: <Text style={styles.bold}>{item.desencadenante ?? 'Sin definir'}</Text>
              </Text>
              {item.reaccion ? (
                <Text style={styles.cardDetail}>Reacción: {item.reaccion}</Text>
              ) : null}
              {item.tratamiento ? (
                <Text style={styles.cardDetail}>Tratamiento: {item.tratamiento}</Text>
              ) : null}
              {item.observaciones ? (
                <Text style={styles.cardDetail}>Notas: {item.observaciones}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setShowForm((prev) => !prev)}
      >
        <Text style={styles.primaryBtnText}>
          {showForm ? 'Cerrar formulario' : 'Registrar nueva alergia'}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nueva Alergia</Text>
          {editingId && (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerText}>Editando alergia #{editingId}</Text>
              <TouchableOpacity onPress={cancelEditing}>
                <Text style={styles.editBannerAction}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.selectLabel}>Persona registrada</Text>
          {loadingPatients ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#1d4ed8" />
              <Text style={styles.stateText}>Cargando personas...</Text>
            </View>
          ) : patientOptions.length === 0 ? (
            <View style={styles.emptySelect}>
              <Text style={styles.emptySelectText}>
                No tienes personas registradas. Primero agrégalas desde Gestionar Expediente.
              </Text>
              <TouchableOpacity style={styles.refreshSmallBtn} onPress={fetchPatients}>
                <Text style={styles.refreshSmallText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.pacienteId}
                onValueChange={(value) => handleChange('pacienteId', String(value))}
              >
                {patientOptions.map((person) => (
                  <Picker.Item
                    key={person.pacienteId}
                    label={
                      person.parentesco
                        ? `${person.displayName} · ${person.parentesco}`
                        : person.displayName
                    }
                    value={String(person.pacienteId)}
                  />
                ))}
              </Picker>
            </View>
          )}
          <Text style={styles.inputLabel}>Tipo de alergia</Text>
          <TextInput
            style={styles.input}
            placeholder="Tipo de alergia"
            value={form.tipo}
            onChangeText={(text) => handleChange('tipo', text)}
          />
          <Text style={styles.inputLabel}>Desencadenante</Text>
          <TextInput
            style={styles.input}
            placeholder="Desencadenante"
            value={form.desencadenante}
            onChangeText={(text) => handleChange('desencadenante', text)}
          />
          <Text style={styles.inputLabel}>Severidad</Text>
          <TextInput
            style={styles.input}
            placeholder="Severidad (leve, moderada...)"
            value={form.severidad}
            onChangeText={(text) => handleChange('severidad', text)}
          />
          <Text style={styles.inputLabel}>Reacción típica</Text>
          <TextInput
            style={styles.input}
            placeholder="Reacción típica"
            value={form.reaccion}
            onChangeText={(text) => handleChange('reaccion', text)}
          />
          <Text style={styles.inputLabel}>Tratamiento recomendado</Text>
          <TextInput
            style={styles.input}
            placeholder="Tratamiento recomendado"
            value={form.tratamiento}
            onChangeText={(text) => handleChange('tratamiento', text)}
          />
          <Text style={styles.inputLabel}>Fecha diagnóstico</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              <Text style={styles.dateButtonText}>{formatInputDate(form.fechadiagnostico)}</Text>
            </TouchableOpacity>
            {form.fechadiagnostico ? (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => handleChange('fechadiagnostico', '')}
              >
                <Text style={styles.clearDateText}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {Platform.OS === 'ios' && showIOSDatePicker && (
            <View style={styles.iosPickerWrapper}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={getCurrentDateValue()}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    handleDateConfirm(selectedDate);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowIOSDatePicker(false)}
                style={styles.iosPickerDoneBtn}
              >
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.inputLabel}>Estado</Text>
          <TextInput
            style={styles.input}
            placeholder="Estado (Activa, Inactiva...)"
            value={form.estado}
            onChangeText={(text) => handleChange('estado', text)}
          />
          <Text style={styles.inputLabel}>Observaciones</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Observaciones"
            value={form.observaciones}
            onChangeText={(text) => handleChange('observaciones', text)}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar Alergia</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 13,
    marginTop: 4,
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
  stateBox: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  stateTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  stateText: {
    color: '#cbd5f5',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#cbd5f5',
    fontSize: 12,
    marginTop: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeActive: {
    backgroundColor: '#bbf7d0',
  },
  badgeMuted: {
    backgroundColor: '#fed7aa',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  editChip: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editChipText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    gap: 4,
  },
  cardDetail: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  bold: {
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editBannerText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 13,
  },
  editBannerAction: {
    color: '#1d4ed8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySelect: {
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff7ed',
    gap: 8,
  },
  emptySelectText: {
    color: '#9a3412',
    fontSize: 13,
  },
  refreshSmallBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshSmallText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f1f5f9',
  },
  dateButtonText: {
    color: '#0f172a',
    fontSize: 15,
  },
  clearDateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  clearDateText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  iosPickerWrapper: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#cbd5f5',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  iosPickerDoneText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
});
