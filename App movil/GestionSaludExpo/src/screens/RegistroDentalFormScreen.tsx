import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type DatePickerField = 'date' | 'time';

type FormState = {
  pacienteId: string;
  fechaAtencion: string;
  procedimiento: string;
  diagnostico: string;
  odontologo: string;
  piezasTratadas: string;
  notas: string;
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
  const segments = value?.split(':').map((segment) => Number(segment)) ?? [];
  if (segments.length === 2 && segments.every((segment) => !Number.isNaN(segment))) {
    base.setHours(segments[0], segments[1], 0, 0);
    return base;
  }
  base.setHours(9, 0, 0, 0);
  return base;
};

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return 'Selecciona fecha';
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

const formatTimeLabel = (value?: string) => {
  if (!value) {
    return 'Selecciona hora';
  }
  const segments = value.split(':');
  if (segments.length >= 2) {
    return `${segments[0]}:${segments[1]}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  }
  return value;
};

export function RegistroDentalFormScreen() {
  const [form, setForm] = useState<FormState>({
    pacienteId: '',
    fechaAtencion: '',
    procedimiento: '',
    diagnostico: '',
    odontologo: '',
    piezasTratadas: '',
    notas: '',
  });
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState(toDateOnlyString(new Date()));
  const [timeValue, setTimeValue] = useState('09:00');
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);

  useEffect(() => {
    if (dateValue && timeValue) {
      setForm((prev) => ({ ...prev, fechaAtencion: `${dateValue}T${timeValue}` }));
    }
  }, [dateValue, timeValue]);

  const handleChange = (key: keyof FormState, value: string) => {
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
        headers: { Authorization: `Bearer ${token}` },
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
              const nombres = relation?.nombres ?? relation?.nombrePaciente ?? relation?.paciente?.nombres ?? '';
              const apellidos = relation?.apellidos ?? relation?.apellidoPaciente ?? relation?.paciente?.apellidos ?? '';
              const combinedFromRelation = `${nombres} ${apellidos}`.trim();
              if (combinedFromRelation) {
                displayName = combinedFromRelation;
              }
              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const patientBody = await patientResponse.json().catch(() => null);
                if (patientBody && patientResponse.ok) {
                  const patientName = `${patientBody?.nombres ?? ''} ${patientBody?.apellidos ?? ''}`.trim();
                  if (patientName) {
                    displayName = patientName;
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
      setPatientError(error instanceof Error ? error.message : 'Fallo al cargar personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (!form.pacienteId && patientOptions.length > 0) {
      handleChange('pacienteId', String(patientOptions[0].pacienteId));
    }
  }, [patientOptions, form.pacienteId]);

  const selectedPatientName = useMemo(() => {
    return (
      patientOptions.find((patient) => String(patient.pacienteId) === form.pacienteId)?.displayName ?? ''
    );
  }, [patientOptions, form.pacienteId]);

  const showPicker = (field: DatePickerField) => {
    if (Platform.OS === 'android') {
      if (field === 'date') {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(dateValue),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              setDateValue(toDateOnlyString(selected));
            }
          },
        });
      } else {
        DateTimePickerAndroid.open({
          value: parseTimeForPicker(timeValue),
          mode: 'time',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              const hh = String(selected.getHours()).padStart(2, '0');
              const mm = String(selected.getMinutes()).padStart(2, '0');
              setTimeValue(`${hh}:${mm}`);
            }
          },
        });
      }
      return;
    }
    if (field === 'date') {
      setShowIOSDatePicker(true);
    } else {
      setShowIOSTimePicker(true);
    }
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fechaAtencion || !form.procedimiento) {
      Alert.alert('Faltan Datos', 'Paciente, fecha y procedimiento son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/registrodental`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          fechaatencion: form.fechaAtencion,
          procedimiento: form.procedimiento,
          diagnostico: form.diagnostico || undefined,
          odontologo: form.odontologo || undefined,
          piezastratadas: form.piezasTratadas || undefined,
          notas: form.notas || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar la atenci?n dental');
      }
      Alert.alert('Registro Guardado', 'Se agreg? la atenci?n dental');
      setForm({
        pacienteId: '',
        fechaAtencion: '',
        procedimiento: '',
        diagnostico: '',
        odontologo: '',
        piezasTratadas: '',
        notas: '',
      });
      setDateValue(toDateOnlyString(new Date()));
      setTimeValue('09:00');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fall? la solicitud');
    }
  };

  const renderIOSPicker = (field: DatePickerField) => {
    const visible = field === 'date' ? showIOSDatePicker : showIOSTimePicker;
    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }
    const isDate = field === 'date';
    return (
      <View style={styles.iosPickerWrapper}>
        <DateTimePicker
          mode={isDate ? 'date' : 'time'}
          display="spinner"
          value={isDate ? parseDateForPicker(dateValue) : parseTimeForPicker(timeValue)}
          onChange={(_, selected) => {
            if (selected) {
              if (isDate) {
                setDateValue(toDateOnlyString(selected));
              } else {
                const hh = String(selected.getHours()).padStart(2, '0');
                const mm = String(selected.getMinutes()).padStart(2, '0');
                setTimeValue(`${hh}:${mm}`);
              }
            }
          }}
        />
        <TouchableOpacity
          style={styles.iosPickerDoneBtn}
          onPress={() => (isDate ? setShowIOSDatePicker(false) : setShowIOSTimePicker(false))}
        >
          <Text style={styles.iosPickerDoneText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro Dental</Text>

      <Text style={styles.label}>Paciente</Text>
      {loadingPatients ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#0ea5e9" />
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
      {selectedPatientName ? (
        <Text style={styles.selectedPatientText}>Paciente seleccionado: {selectedPatientName}</Text>
      ) : null}

      <Text style={styles.label}>Fecha de atenci?n</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.dateButton, styles.flexItem]} onPress={() => showPicker('date')}>
          <Text style={styles.dateButtonText}>{formatDisplayDate(dateValue)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dateButton, styles.flexItem]} onPress={() => showPicker('time')}>
          <Text style={styles.dateButtonText}>Hora: {formatTimeLabel(timeValue)}</Text>
        </TouchableOpacity>
      </View>
      {renderIOSPicker('date')}
      {renderIOSPicker('time')}

      <Text style={styles.label}>Procedimiento</Text>
      <TextInput
        style={styles.input}
        placeholder="Procedimiento"
        value={form.procedimiento}
        onChangeText={(value) => handleChange('procedimiento', value)}
      />

      <Text style={styles.label}>Diagn?stico</Text>
      <TextInput
        style={styles.input}
        placeholder="Diagn?stico"
        value={form.diagnostico}
        onChangeText={(value) => handleChange('diagnostico', value)}
      />

      <Text style={styles.label}>Odont?logo</Text>
      <TextInput
        style={styles.input}
        placeholder="Odont?logo"
        value={form.odontologo}
        onChangeText={(value) => handleChange('odontologo', value)}
      />

      <Text style={styles.label}>Piezas tratadas</Text>
      <TextInput
        style={styles.input}
        placeholder="Piezas tratadas"
        value={form.piezasTratadas}
        onChangeText={(value) => handleChange('piezasTratadas', value)}
      />

      <Text style={styles.label}>Notas</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas"
        value={form.notas}
        multiline
        textAlignVertical="top"
        onChangeText={(value) => handleChange('notas', value)}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Registro</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
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
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#ecfeff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flexItem: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
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
    color: '#475569',
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: '#0c4a6e',
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284c7',
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
  selectedPatientText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  multiline: {
    minHeight: 120,
  },
  iosPickerWrapper: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 16,
    overflow: 'hidden',
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#d4d4d8',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  iosPickerDoneText: {
    color: '#075985',
    fontWeight: '700',
  },
});
