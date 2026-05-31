import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaForm'>;
type DatePickerField = 'consulta-date' | 'consulta-time' | 'notification-date' | 'notification-time';

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

const composeDateTime = (dateValue?: string, timeValue?: string) => {
  if (!dateValue || !timeValue) {
    return '';
  }
  return `${dateValue}T${timeValue}`;
};

export function ConsultaFormScreen({ route }: Props) {
  const { consulta } = route.params || {};
  const isEditing = Boolean(consulta?.consultaId);
  const [consultaDate, setConsultaDate] = useState(() => extractDatePortion(consulta?.fechaconsulta));
  const [consultaTime, setConsultaTime] = useState(() => extractTimePortion(consulta?.fechaconsulta));
  const [notificationDate, setNotificationDate] = useState(() => extractDatePortion(consulta?.fechaconsulta));
  const [notificationTime, setNotificationTime] = useState(() => extractTimePortion(consulta?.fechaconsulta) || '08:00');
  const [showIOSConsultaDatePicker, setShowIOSConsultaDatePicker] = useState(false);
  const [showIOSConsultaTimePicker, setShowIOSConsultaTimePicker] = useState(false);
  const [showIOSNotificationDatePicker, setShowIOSNotificationDatePicker] = useState(false);
  const [showIOSNotificationTimePicker, setShowIOSNotificationTimePicker] = useState(false);
  const [form, setForm] = useState({
    pacienteId: consulta?.pacienteId?.toString() || '',
    fecha: consulta?.fechaconsulta || '',
    motivo: consulta?.motivo || '',
    diagnostico: consulta?.diagnostico || '',
    tratamiento: consulta?.tratamiento || '',
  });
  const [notificationForm, setNotificationForm] = useState({
    mensaje: consulta?.motivo
      ? `Recordatorio de seguimiento para la consulta: ${consulta.motivo}`
      : 'Recordatorio de seguimiento de consulta medica',
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

  const handleNotificationChange = (key: keyof typeof notificationForm, value: string) => {
    setNotificationForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const composed = composeDateTime(consultaDate, consultaTime);
    if (!consultaDate && !consultaTime) {
      setForm((prev) => (prev.fecha ? { ...prev, fecha: '' } : prev));
      return;
    }
    if (!composed) {
      return;
    }
    setForm((prev) => (prev.fecha === composed ? prev : { ...prev, fecha: composed }));
  }, [consultaDate, consultaTime]);

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
      const items = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      setPatientOptions(items);
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
    const isDateField = field.endsWith('date');
    const isNotificationField = field.startsWith('notification');
    const dateValue = isNotificationField ? notificationDate : consultaDate;
    const timeValue = isNotificationField ? notificationTime : consultaTime;

    if (Platform.OS === 'android') {
      if (isDateField) {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(dateValue),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) {
              return;
            }
            const formatted = [
              selected.getFullYear(),
              String(selected.getMonth() + 1).padStart(2, '0'),
              String(selected.getDate()).padStart(2, '0'),
            ].join('-');
            if (isNotificationField) {
              setNotificationDate(formatted);
            } else {
              setConsultaDate(formatted);
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
          if (event.type !== 'set' || !selected) {
            return;
          }
          const formatted =
            `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
          if (isNotificationField) {
            setNotificationTime(formatted);
          } else {
            setConsultaTime(formatted);
          }
        },
      });
      return;
    }

    if (field === 'consulta-date') setShowIOSConsultaDatePicker(true);
    if (field === 'consulta-time') setShowIOSConsultaTimePicker(true);
    if (field === 'notification-date') setShowIOSNotificationDatePicker(true);
    if (field === 'notification-time') setShowIOSNotificationTimePicker(true);
  };

  const renderIOSPicker = (field: DatePickerField) => {
    const isDateField = field.endsWith('date');
    const isNotificationField = field.startsWith('notification');
    const visible =
      field === 'consulta-date'
        ? showIOSConsultaDatePicker
        : field === 'consulta-time'
          ? showIOSConsultaTimePicker
          : field === 'notification-date'
            ? showIOSNotificationDatePicker
            : showIOSNotificationTimePicker;

    if (Platform.OS !== 'ios' || !visible) {
      return null;
    }

    const currentDateValue = isNotificationField ? notificationDate : consultaDate;
    const currentTimeValue = isNotificationField ? notificationTime : consultaTime;

    return (
      <View style={styles.iosPickerCard}>
        <DateTimePicker
          value={isDateField ? parseDateForPicker(currentDateValue) : parseTimeForPicker(currentTimeValue)}
          mode={isDateField ? 'date' : 'time'}
          display="spinner"
          locale="es-NI"
          onChange={(_, selected) => {
            if (!selected) {
              return;
            }
            if (isDateField) {
              const formatted = [
                selected.getFullYear(),
                String(selected.getMonth() + 1).padStart(2, '0'),
                String(selected.getDate()).padStart(2, '0'),
              ].join('-');
              if (isNotificationField) {
                setNotificationDate(formatted);
              } else {
                setConsultaDate(formatted);
              }
              return;
            }

            const formatted =
              `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`;
            if (isNotificationField) {
              setNotificationTime(formatted);
            } else {
              setConsultaTime(formatted);
            }
          }}
        />
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            if (field === 'consulta-date') setShowIOSConsultaDatePicker(false);
            if (field === 'consulta-time') setShowIOSConsultaTimePicker(false);
            if (field === 'notification-date') setShowIOSNotificationDatePicker(false);
            if (field === 'notification-time') setShowIOSNotificationTimePicker(false);
          }}
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
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: consulta ? `/consultamedica/${consulta.consultaId}` : '/consultamedica',
        method: consulta ? 'PATCH' : 'POST',
        description: consulta ? 'actualizar consulta' : 'registrar consulta',
        body: {
          pacienteId: Number(form.pacienteId),
          fechaconsulta: form.fecha,
          motivo: form.motivo,
          diagnostico: form.diagnostico || undefined,
          tratamiento: form.tratamiento || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Consulta en cola',
          'No habia conexion. La consulta quedo pendiente de sincronizacion y se enviara automaticamente cuando vuelva la red.',
        );
      } else {
        Alert.alert('Consulta guardada', `Se ${consulta ? 'actualizo' : 'registro'} la atencion.`);
      }

      setForm({ pacienteId: '', fecha: '', motivo: '', diagnostico: '', tratamiento: '' });
      setConsultaDate('');
      setConsultaTime('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  };

  const handleCreateNotification = async () => {
    const scheduledAt = composeDateTime(notificationDate, notificationTime);

    if (!consulta?.consultaId) {
      Alert.alert('Notificacion no disponible', 'Primero guarda la consulta para poder vincular una notificacion.');
      return;
    }

    if (!form.pacienteId || !scheduledAt || !notificationForm.mensaje.trim()) {
      Alert.alert('Faltan datos', 'Fecha, hora y mensaje son obligatorios para la notificacion.');
      return;
    }

    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/notificacion',
        method: 'POST',
        description: 'crear notificacion de consulta',
        body: {
          pacienteId: Number(form.pacienteId),
          tipo: 'consulta_medica',
          mensaje: notificationForm.mensaje.trim(),
          fechaprogramada: scheduledAt,
          medio: 'push',
          entidadorigen: 'consultamedica',
          entidadId: consulta.consultaId,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Notificacion en cola',
          'No habia conexion. La notificacion quedo pendiente y se enviara cuando vuelva la red.',
        );
      } else {
        Alert.alert('Notificacion creada', 'La consulta ya tiene una notificacion programada.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la notificacion');
    }
  };

  const notificationReady = Boolean(consulta?.consultaId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>{isEditing ? 'EDITAR CONSULTA' : 'NUEVA CONSULTA'}</Text>
        <Text style={styles.title}>{isEditing ? 'Actualizar consulta medica' : 'Registrar consulta medica'}</Text>
        <Text style={styles.subtitle}>
          Ajusta los datos clinicos y, si la consulta ya existe, programa una notificacion de seguimiento desde la misma vista.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Datos de la consulta</Text>

        <Text style={styles.label}>Paciente o persona disponible</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            style={styles.picker}
            selectedValue={form.pacienteId}
            onValueChange={(value) => handleChange('pacienteId', String(value))}
            enabled={!loadingPatients}
            dropdownIconColor="#F4F8FF"
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
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('consulta-date')}>
            <Text style={styles.dateButtonText}>{formatDisplayDate(consultaDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('consulta-time')}>
            <Text style={styles.dateButtonText}>{formatDisplayTime(consultaTime)}</Text>
          </TouchableOpacity>
        </View>
        {renderIOSPicker('consulta-date')}
        {renderIOSPicker('consulta-time')}

        <Text style={styles.label}>Motivo</Text>
        <TextInput
          style={styles.input}
          placeholder="Motivo principal de la consulta"
          placeholderTextColor="#9FB3C8"
          value={form.motivo}
          onChangeText={(value) => handleChange('motivo', value)}
        />

        <Text style={styles.label}>Diagnostico</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Diagnostico clinico"
          placeholderTextColor="#9FB3C8"
          value={form.diagnostico}
          multiline
          onChangeText={(value) => handleChange('diagnostico', value)}
        />

        <Text style={styles.label}>Tratamiento</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Tratamiento o indicaciones"
          placeholderTextColor="#9FB3C8"
          value={form.tratamiento}
          multiline
          onChangeText={(value) => handleChange('tratamiento', value)}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
          <Text style={styles.primaryBtnText}>{consulta ? 'Actualizar consulta' : 'Guardar consulta'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notificacion de seguimiento</Text>
        <Text style={styles.sectionHelper}>
          {notificationReady
            ? 'Programa un aviso para recordar el seguimiento de esta consulta.'
            : 'Guarda primero la consulta para habilitar la notificacion vinculada.'}
        </Text>

        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Mensaje de la notificacion"
          placeholderTextColor="#9FB3C8"
          value={notificationForm.mensaje}
          multiline
          onChangeText={(value) => handleNotificationChange('mensaje', value)}
        />
        <Text style={styles.label}>Canal</Text>
        <View style={styles.fixedChannelCard}>
          <Text style={styles.fixedChannelText}>Notificacion push</Text>
        </View>

        <Text style={styles.label}>Fecha y hora del aviso</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateButton, !notificationReady && styles.disabledField]}
            onPress={() => showPicker('notification-date')}
            disabled={!notificationReady}
          >
            <Text style={styles.dateButtonText}>{formatDisplayDate(notificationDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateButton, !notificationReady && styles.disabledField]}
            onPress={() => showPicker('notification-time')}
            disabled={!notificationReady}
          >
            <Text style={styles.dateButtonText}>{formatDisplayTime(notificationTime)}</Text>
          </TouchableOpacity>
        </View>
        {renderIOSPicker('notification-date')}
        {renderIOSPicker('notification-time')}

        <TouchableOpacity
          style={[styles.notificationBtn, !notificationReady && styles.notificationBtnDisabled]}
          onPress={handleCreateNotification}
          disabled={!notificationReady}
        >
          <Text style={styles.notificationBtnText}>Crear notificacion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#071120',
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 26,
    padding: 22,
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F4F8FF',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: 8,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 6,
  },
  sectionHelper: {
    color: '#29B6FF',
    lineHeight: 19,
    marginBottom: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#F4F8FF',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    marginBottom: 12,
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
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  fixedChannelText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#0D1B2A',
  },
  disabledField: {
    opacity: 0.45,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#F4F8FF',
    textAlign: 'center',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },
  secondaryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  notificationBtn: {
    backgroundColor: '#38F28E',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  notificationBtnDisabled: {
    opacity: 0.45,
  },
  notificationBtnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
  },
});
