import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaForm'>;

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type DatePickerField = 'date' | 'time';

const extractDatePortion = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, '0'),
      String(parsed.getDate()).padStart(2, '0'),
    ].join('-');
  }
  return '';
};

const extractTimePortion = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) {
    return match[1];
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
  }
  return '';
};

const parseDateForPicker = (value?: string) => {
  const segments = value?.split('-').map((segment) => Number(segment)) ?? [];
  if (segments.length === 3 && segments.every((segment) => !Number.isNaN(segment))) {
    return new Date(segments[0], segments[1] - 1, segments[2]);
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
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

export function ConsultaFormScreen({ route }: Props) {
  const { consulta } = route.params || {};
  const [dateValue, setDateValue] = useState(() => extractDatePortion(consulta?.fechaconsulta));
  const [timeValue, setTimeValue] = useState(() => extractTimePortion(consulta?.fechaconsulta));
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);
  const [form, setForm] = useState({
    pacienteId: consulta?.pacienteId?.toString() || '',
    fecha: consulta?.fechaconsulta || '',
    motivo: consulta?.motivo || '',
    diagnostico: consulta?.diagnostico || '',
    tratamiento: consulta?.tratamiento || '',
  });
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
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!dateValue && !timeValue) {
      setForm((prev) => (prev.fecha ? { ...prev, fecha: '' } : prev));
      return;
    }
    if (!dateValue || !timeValue) {
      return;
    }
    const composed = `${dateValue}T${timeValue}`;
    setForm((prev) => (prev.fecha === composed ? prev : { ...prev, fecha: composed }));
  }, [dateValue, timeValue]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setLoadingPatients(false);
      setPatientLoadError(null);
      return;
    }

    setLoadingPatients(true);
    setPatientLoadError(null);
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
      setPatientLoadError(error instanceof Error ? error.message : 'Fallo al cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const showPicker = (field: DatePickerField) => {
    if (Platform.OS === 'android') {
      if (field === 'date') {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(dateValue),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              setDateValue([
                selected.getFullYear(),
                String(selected.getMonth() + 1).padStart(2, '0'),
                String(selected.getDate()).padStart(2, '0'),
              ].join('-'));
            }
          },
        });
        return;
      }

      DateTimePickerAndroid.open({
        value: parseTimeForPicker(timeValue),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            setTimeValue(
              `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
            );
          }
        },
      });
      return;
    }

    if (field === 'date') {
      setShowIOSDatePicker(true);
    } else {
      setShowIOSTimePicker(true);
    }
  };

  const renderIOSPicker = (field: DatePickerField) => {
    const isDate = field === 'date';
    const visible = isDate ? showIOSDatePicker : showIOSTimePicker;
    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }

    return (
      <View style={styles.iosPickerCard}>
        <DateTimePicker
          value={isDate ? parseDateForPicker(dateValue) : parseTimeForPicker(timeValue)}
          mode={isDate ? 'date' : 'time'}
          display="spinner"
          locale="es-NI"
          onChange={(_, selected) => {
            if (!selected) {
              return;
            }
            if (isDate) {
              setDateValue([
                selected.getFullYear(),
                String(selected.getMonth() + 1).padStart(2, '0'),
                String(selected.getDate()).padStart(2, '0'),
              ].join('-'));
              return;
            }
            setTimeValue(
              `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
            );
          }}
        />
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => (isDate ? setShowIOSDatePicker(false) : setShowIOSTimePicker(false))}
        >
          <Text style={styles.secondaryBtnText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.motivo) {
      Alert.alert('Faltan Datos', 'Paciente, fecha y motivo son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const url = consulta ? `${API_URL}/consultamedica/${consulta.consultaId}` : `${API_URL}/consultamedica`;
      const method = consulta ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          fechaconsulta: form.fecha,
          motivo: form.motivo,
          diagnostico: form.diagnostico || undefined,
          tratamiento: form.tratamiento || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? `No se pudo ${consulta ? 'actualizar' : 'guardar'} la consulta`);
      }
      Alert.alert('Consulta Guardada', `Se ${consulta ? 'actualizó' : 'registró'} la atención`);
      setForm({ pacienteId: '', fecha: '', motivo: '', diagnostico: '', tratamiento: '' });
      setDateValue('');
      setTimeValue('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{consulta ? 'Editar Consulta' : 'Registrar Consulta'}</Text>
      <Text style={styles.label}>Paciente o persona disponible</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.pacienteId}
          onValueChange={(value) => handleChange('pacienteId', String(value))}
          enabled={!loadingPatients}
        >
          <Picker.Item
            label={loadingPatients ? 'Cargando personas...' : 'Selecciona una persona'}
            value=""
          />
          {patientOptions.map((patient) => (
            <Picker.Item
              key={patient.pacienteId}
              label={patient.displayName}
              value={String(patient.pacienteId)}
            />
          ))}
        </Picker>
      </View>
      {patientLoadError ? <Text style={styles.errorText}>{patientLoadError}</Text> : null}
      <Text style={styles.label}>Fecha y hora de la consulta</Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('date')}>
          <Text style={styles.dateButtonText}>{formatDisplayDate(dateValue)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('time')}>
          <Text style={styles.dateButtonText}>{formatDisplayTime(timeValue)}</Text>
        </TouchableOpacity>
      </View>
      {renderIOSPicker('date')}
      {renderIOSPicker('time')}
      <TextInput
        style={styles.input}
        placeholder="Motivo"
        value={form.motivo}
        onChangeText={(value) => handleChange('motivo', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Diagnostico"
        value={form.diagnostico}
        multiline
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Tratamiento"
        value={form.tratamiento}
        multiline
        onChangeText={(value) => handleChange('tratamiento', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>{consulta ? 'Actualizar Consulta' : 'Guardar Consulta'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
});
