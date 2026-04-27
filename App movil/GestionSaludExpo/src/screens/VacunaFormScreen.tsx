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

type DateField = 'fecha' | 'proximaDosis';

type VacunaRecord = {
  vacunaId: number;
  pacienteId: number;
  nombre: string;
  fechaaplicacion?: string | null;
  lote?: string | null;
  proximadosis?: string | null;
  creadoen?: string | null;
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

const formatRecordDate = (value?: string | null) => formatDisplayDate(value ?? undefined, 'Sin fecha registrada');

const formatNextDose = (value?: string | null) =>
  value ? formatDisplayDate(value ?? undefined, 'Sin fecha programada') : 'Sin próxima dosis';

export function VacunaFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    nombre: '',
    fecha: '',
    lote: '',
    proximaDosis: '',
  });
  const [filterPacienteId, setFilterPacienteId] = useState('');
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
  const [showIOSFechaPicker, setShowIOSFechaPicker] = useState(false);
  const [showIOSProximaPicker, setShowIOSProximaPicker] = useState(false);
  const [records, setRecords] = useState<VacunaRecord[]>([]);
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
                // ignorar fallos individuales
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
      setPatientError(error instanceof Error ? error.message : 'Falló al cargar personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const mapRecords = (payload: any[]): VacunaRecord[] => {
    return payload
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
  };

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
      const response = await fetch(`${API_URL}/vacuna`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar las vacunas');
      }
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
    if (field === 'fecha') {
      setShowIOSFechaPicker(true);
    } else {
      setShowIOSProximaPicker(true);
    }
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
      const response = await fetch(`${API_URL}/vacuna`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          nombre: form.nombre,
          fechaaplicacion: form.fecha,
          lote: form.lote || undefined,
          proximadosis: form.proximaDosis || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar la vacuna');
      }
      Alert.alert('Vacuna Registrada', 'El carnet fue actualizado');
      setForm({ pacienteId: '', nombre: '', fecha: '', lote: '', proximaDosis: '' });
      fetchVaccines();
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    }
  };

  const renderIOSPicker = (field: DateField) => {
    const visible = field === 'fecha' ? showIOSFechaPicker : showIOSProximaPicker;
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
          onPress={() => (field === 'fecha' ? setShowIOSFechaPicker(false) : setShowIOSProximaPicker(false))}
        >
          <Text style={styles.iosPickerDoneText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Vacunas registradas</Text>
        <Text style={styles.subtitle}>Consulta el historial antes de registrar una nueva dosis.</Text>
      </View>

      {recordsError ? <Text style={styles.errorText}>{recordsError}</Text> : null}

      <View style={styles.filterCard}>
        <Text style={styles.label}>Filtrar por persona</Text>
        {loadingPatients ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#1d4ed8" />
            <Text style={styles.loadingText}>Cargando personas...</Text>
          </View>
        ) : patientOptions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay personas vinculadas para aplicar filtros.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={fetchPatients}>
              <Text style={styles.secondaryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterPacienteId}
              onValueChange={(value) => setFilterPacienteId(String(value))}
            >
              <Picker.Item label="Todas las personas" value="" />
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

      <View style={styles.recordsSection}>
        {loadingRecords ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#0ea5e9" />
            <Text style={styles.stateText}>Cargando vacunas...</Text>
          </View>
        ) : visibleRecords.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Sin registros</Text>
            <Text style={styles.stateText}>
              {activePatientId
                ? 'Este paciente aún no tiene vacunas registradas.'
                : 'Selecciona un paciente para ver su historial de vacunas.'}
            </Text>
          </View>
        ) : (
          visibleRecords.map((record) => {
            const label = patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`;
            return (
              <View key={record.vacunaId} style={styles.vaccineCard}>
                <View style={styles.vaccineHeader}>
                  <View>
                    <Text style={styles.vaccineName}>{record.nombre}</Text>
                    <Text style={styles.vaccineMeta}>
                      {label} · Aplicada {formatRecordDate(record.fechaaplicacion)}
                    </Text>
                  </View>
                </View>
                {record.lote ? (
                  <Text style={styles.vaccineDetail}>Lote: {record.lote}</Text>
                ) : null}
                <Text style={styles.vaccineDetail}>
                  Próxima dosis: <Text style={styles.vaccineHighlight}>{formatNextDose(record.proximadosis)}</Text>
                </Text>
              </View>
            );
          })
        )}
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar vacuna</Text>

          <Text style={styles.label}>Paciente</Text>
          {loadingPatients ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#1d4ed8" />
              <Text style={styles.loadingText}>Cargando personas...</Text>
            </View>
          ) : patientOptions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No hay personas vinculadas. Crea una desde Gestionar Expediente.
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

          <Text style={styles.label}>Nombre vacuna</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre vacuna"
            value={form.nombre}
            onChangeText={(value) => handleChange('nombre', value)}
          />

          <Text style={styles.label}>Fecha de aplicación</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('fecha')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</Text>
          </TouchableOpacity>
          {renderIOSPicker('fecha')}

          <Text style={styles.label}>Lote</Text>
          <TextInput
            style={styles.input}
            placeholder="Lote"
            value={form.lote}
            onChangeText={(value) => handleChange('lote', value)}
          />

          <Text style={styles.label}>Próxima dosis</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('proximaDosis')}>
            <Text style={styles.dateButtonText}>
              {form.proximaDosis ? formatDisplayDate(form.proximaDosis) : 'Opcional'}
            </Text>
          </TouchableOpacity>
          {renderIOSPicker('proximaDosis')}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
            <Text style={styles.btnText}>Guardar vacuna</Text>
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
    backgroundColor: '#f1f5f9',
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
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
  },
  recordsSection: {
    gap: 12,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stateBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  stateText: {
    color: '#475569',
    textAlign: 'center',
  },
  vaccineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  vaccineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vaccineName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  vaccineMeta: {
    color: '#475569',
  },
  vaccineDetail: {
    color: '#334155',
  },
  vaccineHighlight: {
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleBtn: {
    backgroundColor: '#0ea5e9',
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
    backgroundColor: '#0ea5e9',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#f1f5f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 4,
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
    color: '#475569',
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: '#78350f',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
  },
  iosPickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#d4d4d8',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  iosPickerDoneText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
