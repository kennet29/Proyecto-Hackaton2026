/**
 * @file App movil/GestionSaludExpo/src/screens/ConsultaFormScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaForm'>;
type DatePickerField = 'consulta-date' | 'consulta-time' | 'notification-date' | 'notification-time';
type ConsultaPayload = {
  consultaId: number;
  pacienteId: number;
  fechaconsulta: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
};

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
  const [currentConsultaId, setCurrentConsultaId] = useState<number | null>(
    consulta?.consultaId ?? null,
  );
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
  const hasNotificationDraft = Boolean(notificationDate && notificationTime && notificationForm.mensaje.trim());

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

  useEffect(() => {
    setCurrentConsultaId(consulta?.consultaId ?? null);
  }, [consulta?.consultaId]);

  const showPicker = (field: DatePickerField) => {
    const isDateField = field.endsWith('date');
    const isNotificationField = field.startsWith('notification');
    const dateValue = isNotificationField ? notificationDate : consultaDate;
    const timeValue = isNotificationField ? notificationTime : consultaTime;

    if (Platform.OS === 'web') {
      const handled = openWebDateTimePicker(
        isDateField ? 'date' : 'time',
        isDateField ? dateValue : timeValue,
        (value) => {
          if (isDateField) {
            if (isNotificationField) {
              setNotificationDate(value);
            } else {
              setConsultaDate(value);
            }
            return;
          }
          if (isNotificationField) {
            setNotificationTime(value);
          } else {
            setConsultaTime(value);
          }
        },
      );
      if (handled) return;
    }

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
          <AppText style={styles.secondaryBtnText}>Listo</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  const createNotificationForConsulta = async (consultaId: number) => {
    const scheduledAt = composeDateTime(notificationDate, notificationTime);

    if (!form.pacienteId || !scheduledAt || !notificationForm.mensaje.trim()) {
      return null;
    }

    return submitJsonWithOfflineFallback({
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
        entidadId: consultaId,
        campoprueba03: `Consulta: ${form.motivo.trim() || 'Seguimiento medico'}`.slice(0, 200),
        creadopor: user?.username ?? undefined,
      },
    });
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.motivo) {
      Alert.alert('Faltan Datos', 'Paciente, fecha y motivo son obligatorios');
      return;
    }

    try {
      const offlineResult = await submitJsonWithOfflineFallback<ConsultaPayload>({
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
        const queuedMessage =
          hasNotificationDraft && !isEditing
            ? 'No habia conexion. La consulta quedo pendiente de sincronizacion. La notificacion se podra programar cuando la consulta ya exista en el servidor.'
            : 'No habia conexion. La consulta quedo pendiente de sincronizacion y se enviara automaticamente cuando vuelva la red.';
        Alert.alert(
          'Consulta en cola',
          queuedMessage,
        );
      } else {
        const persistedConsultaId =
          offlineResult.data?.consultaId ?? currentConsultaId ?? consulta?.consultaId ?? null;

        if (persistedConsultaId) {
          setCurrentConsultaId(persistedConsultaId);
        }

        if (!isEditing && persistedConsultaId && hasNotificationDraft) {
          try {
            const notificationResult = await createNotificationForConsulta(persistedConsultaId);

            if (notificationResult?.status === 'queued') {
              Alert.alert(
                'Consulta guardada',
                'La consulta se registro correctamente. La notificacion quedo en cola y se enviara cuando vuelva la red.',
              );
            } else if (notificationResult) {
              Alert.alert(
                'Consulta y notificacion guardadas',
                'La consulta se registro y su notificacion de seguimiento quedo programada.',
              );
            } else {
              Alert.alert('Consulta guardada', `Se ${consulta ? 'actualizo' : 'registro'} la atencion.`);
            }
          } catch (notificationError) {
            Alert.alert(
              'Consulta guardada',
              notificationError instanceof Error
                ? `La consulta se guardo, pero la notificacion no se pudo crear: ${notificationError.message}`
                : 'La consulta se guardo, pero la notificacion no se pudo crear.',
            );
          }
        } else {
          Alert.alert('Consulta guardada', `Se ${consulta ? 'actualizo' : 'registro'} la atencion.`);
        }
      }

      if (!isEditing) {
        setForm({ pacienteId: '', fecha: '', motivo: '', diagnostico: '', tratamiento: '' });
        setConsultaDate('');
        setConsultaTime('');
        setNotificationDate('');
        setNotificationTime('08:00');
        setNotificationForm({
          mensaje: 'Recordatorio de seguimiento de consulta medica',
        });
        setCurrentConsultaId(null);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  };

  const handleCreateNotification = async () => {
    const scheduledAt = composeDateTime(notificationDate, notificationTime);

    if (!(currentConsultaId ?? consulta?.consultaId)) {
      Alert.alert('Notificación no disponible', 'Primero guarda la consulta para poder vincular una notificación.');
      return;
    }

    if (!form.pacienteId || !scheduledAt || !notificationForm.mensaje.trim()) {
      Alert.alert('Faltan datos', 'Fecha, hora y mensaje son obligatorios para la notificación.');
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
          entidadId: currentConsultaId ?? consulta?.consultaId ?? undefined,
          campoprueba03: `Consulta: ${form.motivo.trim() || 'Seguimiento medico'}`.slice(0, 200),
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Notificación en cola',
          'No había conexión. La notificación quedó pendiente y se enviará cuando vuelva la red.',
        );
      } else {
        Alert.alert('Notificación creada', 'La consulta ya tiene una notificación programada.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la notificación');
    }
  };

  const notificationReady = Boolean(currentConsultaId ?? consulta?.consultaId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <AppText style={styles.kicker}>{isEditing ? 'EDITAR CONSULTA' : 'NUEVA CONSULTA'}</AppText>
        <AppText style={styles.title}>{isEditing ? 'Actualizar consulta medica' : 'Registrar consulta medica'}</AppText>
        <AppText style={styles.subtitle}>
          Ajusta los datos clinicos y deja lista la notificacion de seguimiento desde la misma vista.
        </AppText>
      </View>

      <View style={styles.sectionCard}>
        <AppText style={styles.sectionTitle}>Datos de la consulta</AppText>

        <AppText style={styles.label}>Paciente o persona disponible</AppText>
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
        {patientLoadError ? <AppText style={styles.errorText}>{patientLoadError}</AppText> : null}

        <AppText style={styles.label}>Fecha y hora de la consulta</AppText>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('consulta-date')}>
            <AppText style={styles.dateButtonText}>{formatDisplayDate(consultaDate)}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPicker('consulta-time')}>
            <AppText style={styles.dateButtonText}>{formatDisplayTime(consultaTime)}</AppText>
          </TouchableOpacity>
        </View>
        {renderIOSPicker('consulta-date')}
        {renderIOSPicker('consulta-time')}

        <AppText style={styles.label}>Motivo</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Motivo principal de la consulta"
          placeholderTextColor="#9FB3C8"
          value={form.motivo}
          onChangeText={(value) => handleChange('motivo', value)}
        />

        <AppText style={styles.label}>Diagnostico</AppText>
        <AppTextInput
          style={[styles.input, styles.multiline]}
          placeholder="Diagnostico clinico"
          placeholderTextColor="#9FB3C8"
          value={form.diagnostico}
          multiline
          onChangeText={(value) => handleChange('diagnostico', value)}
        />

        <AppText style={styles.label}>Tratamiento</AppText>
        <AppTextInput
          style={[styles.input, styles.multiline]}
          placeholder="Tratamiento o indicaciones"
          placeholderTextColor="#9FB3C8"
          value={form.tratamiento}
          multiline
          onChangeText={(value) => handleChange('tratamiento', value)}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
          <AppText style={styles.primaryBtnText}>
            {consulta
              ? 'Actualizar consulta'
              : hasNotificationDraft
                ? 'Guardar consulta y notificacion'
                : 'Guardar consulta'}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, styles.notificationCard]}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconBadge}>
            <Ionicons name="notifications-outline" size={22} color="#071120" />
          </View>
          <View style={styles.notificationHeaderCopy}>
            <AppText style={styles.sectionTitle}>Notificación de seguimiento</AppText>
            <AppText style={styles.sectionHelper}>
              {notificationReady
                ? 'Programa un aviso push vinculado a esta consulta médica.'
                : 'Deja listo el aviso y se programara automaticamente cuando guardes la consulta.'}
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.notificationStatusCard,
            notificationReady ? styles.notificationStatusReady : styles.notificationStatusLocked,
          ]}
        >
          <Ionicons
            name={notificationReady ? 'checkmark-circle-outline' : 'lock-closed-outline'}
            size={19}
            color={notificationReady ? '#38E28E' : '#FF4D73'}
          />
          <AppText
            style={[
              styles.notificationStatusText,
              notificationReady ? styles.notificationStatusTextReady : styles.notificationStatusTextLocked,
            ]}
          >
            {notificationReady ? 'Lista para programar' : 'Lista para guardar con la consulta'}
          </AppText>
        </View>

        <View style={styles.notificationMetaRow}>
          <View style={styles.channelPill}>
            <Ionicons name="phone-portrait-outline" size={15} color="#29B6FF" />
            <AppText style={styles.channelPillText}>Push</AppText>
          </View>
          <AppText style={styles.notificationMetaText}>Se enviará en la fecha y hora seleccionadas.</AppText>
        </View>

        <AppText style={styles.label}>Mensaje del aviso</AppText>
        <AppTextInput
          style={[styles.input, styles.multiline]}
          placeholder="Mensaje de la notificación"
          placeholderTextColor="#9FB3C8"
          value={notificationForm.mensaje}
          multiline
          onChangeText={(value) => handleNotificationChange('mensaje', value)}
        />

        <AppText style={styles.label}>Fecha y hora del aviso</AppText>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showPicker('notification-date')}
          >
            <AppText style={styles.dateButtonText}>{formatDisplayDate(notificationDate)}</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showPicker('notification-time')}
          >
            <AppText style={styles.dateButtonText}>{formatDisplayTime(notificationTime)}</AppText>
          </TouchableOpacity>
        </View>
        {renderIOSPicker('notification-date')}
        {renderIOSPicker('notification-time')}

        <TouchableOpacity
          style={[styles.notificationBtn, !notificationReady && styles.notificationBtnDisabled]}
          onPress={handleCreateNotification}
          disabled={!notificationReady}
        >
          <Ionicons name="alarm-outline" size={18} color="#071120" />
          <AppText style={styles.notificationBtnText}>
            {notificationReady ? 'Programar notificación' : 'Guarda la consulta primero'}
          </AppText>
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
  notificationCard: {
    gap: 12,
    borderColor: '#1B3355',
    backgroundColor: '#182A44',
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notificationIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38E28E',
  },
  notificationHeaderCopy: {
    flex: 1,
  },
  notificationStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
  },
  notificationStatusReady: {
    backgroundColor: '#38E28E18',
    borderColor: '#38E28E66',
  },
  notificationStatusLocked: {
    backgroundColor: '#FF4D7318',
    borderColor: '#FF4D7366',
  },
  notificationStatusText: {
    flex: 1,
    fontWeight: '800',
    fontSize: 13,
  },
  notificationStatusTextReady: {
    color: '#38E28E',
  },
  notificationStatusTextLocked: {
    color: '#FF4D73',
  },
  notificationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#29B6FF18',
    borderWidth: 1,
    borderColor: '#29B6FF55',
  },
  channelPillText: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
  },
  notificationMetaText: {
    flex: 1,
    minWidth: 180,
    color: '#C9D7E8',
    fontSize: 12,
    lineHeight: 17,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38E28E',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
  },
  notificationBtnDisabled: {
    opacity: 0.45,
  },
  notificationBtnText: {
    color: '#071120',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
  },
});
