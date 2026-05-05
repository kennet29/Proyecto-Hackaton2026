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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type DateField = 'fechaInicio' | 'fechaFin';

type MedicacionRecord = {
  medicacionId: number;
  pacienteId: number;
  nombre: string;
  dosis?: string | null;
  via?: string | null;
  fechainicio?: string | null;
  fechafin?: string | null;
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

const formatInterval = (start?: string | null, end?: string | null) => {
  const startLabel = formatDisplayDate(start ?? undefined, 'Sin inicio');
  const endLabel = end ? formatDisplayDate(end ?? undefined, 'Sin fin') : 'Sin fin';
  return `${startLabel} ? ${endLabel}`;
};

export function MedicacionFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    nombre: '',
    dosis: '',
    via: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const { token, user } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);
  const jsonHeaders = useMemo<Record<string, string>>(
    () => ({ 'Content-Type': 'application/json', ...authHeaders }),
    [authHeaders],
  );
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [showIOSInicioPicker, setShowIOSInicioPicker] = useState(false);
  const [showIOSEndPicker, setShowIOSEndPicker] = useState(false);
  const [records, setRecords] = useState<MedicacionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
    setLoadingPatients(true);
    setPatientError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar las personas');
      }
      const items: (LinkedPatient | null)[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const rawId =
                relation?.pacienteId ??
                relation?.pacienteid ??
                relation?.id ??
                relation?.paciente?.pacienteId;
              const pacienteId = Number(rawId);
              if (!Number.isFinite(pacienteId)) {
                return null;
              }
              let displayName =
                relation?.displayName ??
                relation?.nombrePaciente ??
                relation?.paciente?.displayName ??
                `Paciente #${pacienteId}`;
              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: authHeaders,
                });
                const patient = await patientResponse.json().catch(() => null);
                if (patient && patientResponse.ok) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const combined = `${nombres} ${apellidos}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // ignorar errores individuales
              }
              return {
                pacienteId,
                displayName,
              };
            }),
          )
        : [];
      setPatientOptions(items.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setPatientError(error instanceof Error ? error.message : 'Fall? al cargar personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const mapRecords = (payload: any[]): MedicacionRecord[] => {
    return payload
      .map((item) => {
        const rawId = item?.pacienteId ?? item?.pacienteid;
        const pacienteId = Number(rawId);
        if (!Number.isFinite(pacienteId)) {
          return null;
        }
        return {
          medicacionId: item?.medicacionId ?? item?.medicacionid ?? item?.id ?? Math.random(),
          pacienteId,
          nombre: item?.nombremedicamento ?? item?.nombre ?? 'Medicamento sin nombre',
          dosis: item?.dosis ?? null,
          via: item?.viaadministracion ?? item?.via ?? null,
          fechainicio: item?.fechainicio ?? item?.fechaInicio ?? null,
          fechafin: item?.fechafin ?? item?.fechaFin ?? null,
        } as MedicacionRecord;
      })
      .filter((item): item is MedicacionRecord => Boolean(item));
  };

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
      const response = await fetch(`${API_URL}/medicacion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo cargar la medicaci?n');
      }
      const data = Array.isArray(body) ? mapRecords(body) : [];
      setRecords(data);
    } catch (error) {
      setRecordsError(error instanceof Error ? error.message : 'No se pudo cargar la medicaci?n');
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
    if (!form.pacienteId && patientOptions.length > 0) {
      handleChange('pacienteId', String(patientOptions[0].pacienteId));
    }
  }, [patientOptions, form.pacienteId]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const activePatientId = form.pacienteId ? Number(form.pacienteId) : null;

  const visibleRecords = useMemo(() => {
    if (!activePatientId) {
      return records;
    }
    return records.filter((record) => record.pacienteId === activePatientId);
  }, [records, activePatientId]);

  const showPicker = (field: DateField) => {
    const baseDate = parseDateForPicker(form[field]);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            handleChange(field, toDateOnlyString(selected));
          }
        },
      });
      return;
    }
    if (field === 'fechaInicio') {
      setShowIOSInicioPicker(true);
    } else {
      setShowIOSEndPicker(true);
    }
  };

  const renderIOSPicker = (field: DateField) => {
    const visible = field === 'fechaInicio' ? showIOSInicioPicker : showIOSEndPicker;
    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }
    return (
      <View style={styles.iosPickerWrapper}>
        <DateTimePicker
          mode="date"
          display="spinner"
          value={parseDateForPicker(form[field])}
          onChange={(_, selected) => {
            if (selected) {
              handleChange(field, toDateOnlyString(selected));
            }
          }}
        />
        <TouchableOpacity
          style={styles.iosPickerDoneBtn}
          onPress={() => (field === 'fechaInicio' ? setShowIOSInicioPicker(false) : setShowIOSEndPicker(false))}
        >
          <Text style={styles.iosPickerDoneText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMedications();
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.nombre || !form.fechaInicio) {
      Alert.alert('Faltan Datos', 'Paciente, nombre y fecha de inicio son obligatorios');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/medicacion`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          nombremedicamento: form.nombre,
          dosis: form.dosis || undefined,
          viaadministracion: form.via || undefined,
          fechainicio: form.fechaInicio,
          fechafin: form.fechaFin || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar la medicaci?n');
      }
      Alert.alert('Medicaci?n guardada', 'Se agreg? a los horarios');
      setForm({ pacienteId: '', nombre: '', dosis: '', via: '', fechaInicio: '', fechaFin: '' });
      fetchMedications();
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fall? la solicitud');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Medicaciones registradas</Text>
        <Text style={styles.subtitle}>Consulta tus tratamientos activos antes de agregar uno nuevo.</Text>
      </View>

      {recordsError ? <Text style={styles.errorText}>{recordsError}</Text> : null}

      <View style={styles.recordsSection}>
        {loadingRecords ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#a855f7" />
            <Text style={styles.stateText}>Cargando medicaciones...</Text>
          </View>
        ) : visibleRecords.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Sin registros</Text>
            <Text style={styles.stateText}>
              {activePatientId
                ? 'Este paciente a?n no tiene medicaciones registradas.'
                : 'Selecciona un paciente para revisar su historial.'}
            </Text>
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
                      {label} ? {formatInterval(record.fechainicio, record.fechafin)}
                    </Text>
                  </View>
                </View>
                {record.dosis ? <Text style={styles.medicationDetail}>Dosis: {record.dosis}</Text> : null}
                {record.via ? <Text style={styles.medicationDetail}>V?a: {record.via}</Text> : null}
              </View>
            );
          })
        )}
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Prescripci?n</Text>

          <Text style={styles.label}>Paciente</Text>
          {loadingPatients ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#7c3aed" />
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
                selectedValue={form.pacienteId}
                onValueChange={(value) => handleChange('pacienteId', String(value))}
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
          {patientError ? <Text style={styles.errorText}>{patientError}</Text> : null}

          <Text style={styles.label}>Nombre del medicamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre medicamento"
            value={form.nombre}
            onChangeText={(value) => handleChange('nombre', value)}
          />

          <Text style={styles.label}>Dosis</Text>
          <TextInput
            style={styles.input}
            placeholder="Dosis (Ej. 500mg)"
            value={form.dosis}
            onChangeText={(value) => handleChange('dosis', value)}
          />

          <Text style={styles.label}>V?a de administraci?n</Text>
          <TextInput
            style={styles.input}
            placeholder="V?a administraci?n"
            value={form.via}
            onChangeText={(value) => handleChange('via', value)}
          />

          <Text style={styles.label}>Fecha de inicio</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fechaInicio')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechaInicio)}</Text>
          </TouchableOpacity>
          {renderIOSPicker('fechaInicio')}

          <Text style={styles.label}>Fecha de finalizaci?n</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fechaFin')}>
            <Text style={styles.dateButtonText}>
              {form.fechaFin ? formatDisplayDate(form.fechaFin) : 'Opcional'}
            </Text>
          </TouchableOpacity>
          {renderIOSPicker('fechaFin')}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
            <Text style={styles.btnText}>Guardar medicaci?n</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <Text style={styles.fabText}>{showForm ? '×' : '+'}</Text>
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
    padding: 24,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#cbd5e1',
  },
  recordsSection: {
    gap: 12,
  },
  stateBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  stateText: {
    color: '#475569',
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medicationName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  medicationMeta: {
    color: '#6b21a8',
  },
  medicationDetail: {
    color: '#334155',
  },
  toggleBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#a855f7',
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
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#0b1220',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#f8fafc',
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#cbd5e1',
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: '#cbd5e1',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#a855f7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#fca5a5',
  },
  iosPickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#312e81',
  },
  iosPickerDoneText: {
    color: '#ddd6fe',
    fontWeight: '700',
  },
});
