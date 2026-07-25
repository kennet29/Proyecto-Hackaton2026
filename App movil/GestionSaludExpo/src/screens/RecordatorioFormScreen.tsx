import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../context/AuthContext';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';
import { WebTimeInput } from '../components/WebTimeInput';
import { getJsonWithOfflineFallback } from '../utils/offlineReadCache';

const webDateInputStyle = {
  flex: 1,
  minWidth: 0,
  height: 48,
  borderRadius: 14,
  border: `1px solid ${appColors.border}`,
  backgroundColor: appColors.backgroundMuted,
  color: appColors.text,
  padding: '0 13px',
  fontSize: 14,
  fontWeight: 700,
  outline: 'none',
  colorScheme: 'dark',
};

type AppointmentRecord = {
  citaId: number;
  pacienteId: number;
  patientName: string | null;
  motivo: string | null;
  especialidad: string | null;
  estado: string | null;
  fechacita: string;
};

type PickerField = 'date' | 'time';

const CHANNEL_OPTIONS = [
  { value: 'push', label: 'App' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
] as const;

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const extractDatePortion = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
};

const extractTimePortion = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
};

const parseDateForPicker = (value?: string) => {
  const [year, month, day] = value?.split('-').map((segment) => Number(segment)) ?? [];
  if ([year, month, day].every((item) => Number.isFinite(item))) {
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const parseTimeForPicker = (value?: string) => {
  const base = new Date();
  base.setSeconds(0, 0);
  const [hours, minutes] = value?.split(':').map((segment) => Number(segment)) ?? [];
  if ([hours, minutes].every((item) => Number.isFinite(item))) {
    base.setHours(hours, minutes, 0, 0);
    return base;
  }
  base.setHours(8, 0, 0, 0);
  return base;
};

const composeDateTime = (date: string, time: string) => {
  if (!date || !time) {
    return '';
  }
  return `${date}T${time}`;
};

const formatDateLabel = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTimeLabel = (value?: string) => {
  if (!value) return 'Selecciona hora';
  return parseTimeForPicker(value).toLocaleTimeString('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return 'Fecha no disponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const resolveAppointmentName = (item: any) => {
  const fullName = `${item?.paciente?.nombres ?? ''} ${item?.paciente?.apellidos ?? ''}`.trim();
  return (
    normalizeText(fullName) ??
    normalizeText(item?.nombrePaciente) ??
    normalizeText(item?.displayName) ??
    normalizeText(item?.pacienteNombre) ??
    null
  );
};

const mapAppointments = (payload: any[]): AppointmentRecord[] =>
  payload
    .map((item) => {
      const citaId = Number(item?.citaId ?? item?.citaid ?? item?.id);
      const pacienteId = Number(item?.pacienteId ?? item?.pacienteid ?? item?.paciente?.pacienteId);
      const fechacita = normalizeText(item?.fechacita ?? item?.fecha);

      if (!Number.isFinite(citaId) || !Number.isFinite(pacienteId) || !fechacita) {
        return null;
      }

      return {
        citaId,
        pacienteId,
        patientName: resolveAppointmentName(item),
        motivo: normalizeText(item?.motivo),
        especialidad: normalizeText(item?.especialidad),
        estado: normalizeText(item?.estado),
        fechacita,
      } satisfies AppointmentRecord;
    })
    .filter((item): item is AppointmentRecord => Boolean(item));

const buildReminderMessage = (appointment: AppointmentRecord, patientName?: string | null) => {
  const mainTopic = appointment.motivo ?? appointment.especialidad ?? 'tu cita medica';
  const person = patientName?.replace(/\s+\(Principal\)$/, '') ?? 'tu paciente';
  return `Recordatorio: ${person} tiene ${mainTopic} el ${formatDateTimeLabel(appointment.fechacita)}.`;
};

export function RecordatorioFormScreen() {
  const { token, user } = useAuth();
  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<(typeof CHANNEL_OPTIONS)[number]['value']>('push');
  const [notificationDate, setNotificationDate] = useState('');
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);

  const patientNameById = useMemo(() => {
    const entries = patientOptions.map((patient) => [patient.pacienteId, patient.displayName] as const);
    return Object.fromEntries(entries) as Record<number, string>;
  }, [patientOptions]);

  const selectedPatient = useMemo(
    () => patientOptions.find((patient) => String(patient.pacienteId) === selectedPatientId) ?? null,
    [patientOptions, selectedPatientId],
  );

  const availableAppointments = useMemo(() => {
    if (!selectedPatientId) {
      return appointments;
    }
    return appointments.filter((appointment) => String(appointment.pacienteId) === selectedPatientId);
  }, [appointments, selectedPatientId]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.citaId === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );

  const scheduledReminder = composeDateTime(notificationDate, notificationTime);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setSelectedPatientId('');
      return;
    }

    setLoadingPatients(true);
    setPatientError(null);
    try {
      const items = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      setPatientOptions(items);
      if (!selectedPatientId && items.length > 0) {
        setSelectedPatientId(String(items[0].pacienteId));
      }
    } catch (error) {
      setPatientError(error instanceof Error ? error.message : 'No se pudieron cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, selectedPatientId, token]);

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    setAppointmentError(null);
    try {
      const { data: payload } = await getJsonWithOfflineFallback<unknown>(
        '/citamedica',
        authHeaders,
      );
      setAppointments(mapAppointments(Array.isArray(payload) ? payload : []));
    } catch (error) {
      setAppointmentError(error instanceof Error ? error.message : 'No se pudieron cargar las citas');
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, [fetchAppointments, fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId || !selectedAppointmentId) {
      return;
    }

    const belongsToPatient = appointments.some(
      (appointment) =>
        appointment.citaId === selectedAppointmentId && String(appointment.pacienteId) === selectedPatientId,
    );

    if (!belongsToPatient) {
      setSelectedAppointmentId(null);
    }
  }, [appointments, selectedAppointmentId, selectedPatientId]);

  const handleSelectAppointment = (appointment: AppointmentRecord) => {
    const resolvedPatientName =
      patientNameById[appointment.pacienteId] ?? appointment.patientName ?? `Paciente #${appointment.pacienteId}`;

    setSelectedPatientId(String(appointment.pacienteId));
    setSelectedAppointmentId(appointment.citaId);
    setNotificationDate(extractDatePortion(appointment.fechacita));
    setNotificationTime(extractTimePortion(appointment.fechacita) || '08:00');
    setMessage(buildReminderMessage(appointment, resolvedPatientName));
  };

  const openPicker = (field: PickerField) => {
    if (Platform.OS === 'android') {
      if (field === 'date') {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(notificationDate),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type !== 'set' || !selected) {
              return;
            }
            setNotificationDate(
              [
                selected.getFullYear(),
                String(selected.getMonth() + 1).padStart(2, '0'),
                String(selected.getDate()).padStart(2, '0'),
              ].join('-'),
            );
          },
        });
        return;
      }

      DateTimePickerAndroid.open({
        value: parseTimeForPicker(notificationTime),
        mode: 'time',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type !== 'set' || !selected) {
            return;
          }
          setNotificationTime(
            `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
          );
        },
      });
      return;
    }

    if (field === 'date') {
      setShowIOSDatePicker(true);
      return;
    }
    setShowIOSTimePicker(true);
  };

  const handleSubmit = async () => {
    if (!selectedPatientId || !selectedAppointmentId || !scheduledReminder || !message.trim()) {
      Alert.alert(
        'Faltan datos',
        'Selecciona una persona, una cita, la fecha y hora del aviso y el mensaje.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitJsonWithOfflineFallback({
        token,
        path: '/recordatoriocita',
        method: 'POST',
        description: 'crear recordatorio de cita',
        body: {
          citaId: Number(selectedAppointmentId),
          pacienteId: Number(selectedPatientId),
          fecharecordatorio: scheduledReminder,
          mensaje: message.trim(),
          canal: channel,
          estado: 'pendiente',
          creadopor: user?.username ?? undefined,
        },
      });

      if (result.status === 'queued') {
        Alert.alert(
          'Recordatorio en cola',
          result.localReminder === 'scheduled'
            ? 'No había conexión. El recordatorio quedó programado en este dispositivo y se sincronizará después.'
            : 'El recordatorio quedó guardado y se sincronizará cuando vuelva la red.',
        );
      } else {
        Alert.alert(
          'Recordatorio creado',
          result.localReminder === 'scheduled'
            ? 'La cita tiene un aviso local que funcionará también sin conexión.'
            : 'La cita ya tiene su aviso programado.',
        );
      }

      setSelectedAppointmentId(null);
      setMessage('');
      setNotificationDate('');
      setNotificationTime('08:00');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el recordatorio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <AppText style={styles.kicker}>NOTIFICACIONES</AppText>
        <AppText style={styles.title}>Programar recordatorio</AppText>
        <AppText style={styles.subtitle}>
          Elige una persona, toca la cita que quieres recordar y define cuándo avisar.
        </AppText>
      </View>

      <View style={styles.sectionCard}>
        <AppText style={styles.sectionTitle}>1. Persona</AppText>
        <AppText style={styles.helperText}>Selecciona a quién pertenece el recordatorio.</AppText>

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedPatientId}
            onValueChange={(value) => setSelectedPatientId(String(value))}
            enabled={!loadingPatients}
            dropdownIconColor={appColors.text}
            style={styles.picker}
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

        {selectedPatient ? (
          <View style={styles.personCard}>
            <View style={styles.personBadge}>
              <Ionicons name="person-outline" size={18} color={appColors.info} />
            </View>
            <View style={styles.personCopy}>
              <AppText style={styles.personName}>{selectedPatient.displayName}</AppText>
              <AppText style={styles.personMeta}>
                {selectedPatient.parentesco ?? 'Paciente vinculado'}
                {selectedPatient.sexo ? ` · ${selectedPatient.sexo}` : ''}
              </AppText>
            </View>
          </View>
        ) : null}

        {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderCopy}>
            <AppText style={styles.sectionTitle}>2. Registro disponible</AppText>
            <AppText style={styles.helperText}>Estas son las citas a las que puedes asignar el aviso.</AppText>
          </View>
          <TouchableOpacity style={styles.refreshPill} onPress={() => void fetchAppointments()}>
            <Ionicons name="refresh-outline" size={16} color={appColors.info} />
            <AppText style={styles.refreshPillText}>Actualizar</AppText>
          </TouchableOpacity>
        </View>

        {loadingAppointments ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={appColors.info} />
            <AppText style={styles.loadingText}>Cargando registros...</AppText>
          </View>
        ) : availableAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={22} color={appColors.textMuted} />
            <AppText style={styles.emptyTitle}>No hay citas disponibles</AppText>
            <AppText style={styles.emptyText}>
              {selectedPatientId
                ? 'Esta persona no tiene citas registradas todavia.'
                : 'Primero selecciona una persona o registra una cita.'}
            </AppText>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {availableAppointments.map((appointment) => {
              const isActive = appointment.citaId === selectedAppointmentId;
              const patientLabel =
                patientNameById[appointment.pacienteId] ??
                appointment.patientName ??
                `Paciente #${appointment.pacienteId}`;

              return (
                <TouchableOpacity
                  key={appointment.citaId}
                  style={[
                    styles.appointmentCard,
                    isActive && styles.appointmentCardActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => handleSelectAppointment(appointment)}
                >
                  <View style={styles.appointmentTopRow}>
                    <AppText style={styles.appointmentTitle}>{patientLabel}</AppText>
                    <View style={[styles.statePill, isActive && styles.statePillActive]}>
                      <AppText style={[styles.statePillText, isActive && styles.statePillTextActive]}>
                        {isActive ? 'Seleccionada' : appointment.estado ?? 'Programada'}
                      </AppText>
                    </View>
                  </View>
                  <AppText style={styles.appointmentDate}>{formatDateTimeLabel(appointment.fechacita)}</AppText>
                  <AppText style={styles.appointmentDetail}>
                    {appointment.motivo ?? appointment.especialidad ?? `Cita #${appointment.citaId}`}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {appointmentError ? <AppText style={styles.errorText}>{appointmentError}</AppText> : null}
      </View>

      <View style={styles.sectionCard}>
        <AppText style={styles.sectionTitle}>3. Aviso</AppText>
        <AppText style={styles.helperText}>Configura cuándo se enviará y qué dirá el recordatorio.</AppText>

        <AppText style={styles.label}>Canal</AppText>
        <View style={styles.channelRow}>
          {CHANNEL_OPTIONS.map((option) => {
            const isActive = channel === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.channelChip, isActive && styles.channelChipActive]}
                onPress={() => setChannel(option.value)}
              >
                <AppText style={[styles.channelChipText, isActive && styles.channelChipTextActive]}>
                  {option.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppText style={styles.label}>Fecha y hora</AppText>
        <View style={styles.dateTimeRow}>
          {Platform.OS === 'web' ? (
            <>
              {React.createElement('input', {
                type: 'date',
                value: notificationDate,
                onChange: (event: any) => setNotificationDate(event.target.value),
                style: webDateInputStyle,
                'aria-label': 'Fecha del aviso',
              })}
              <WebTimeInput
                value={notificationTime}
                onChange={setNotificationTime}
                ariaLabel="Hora del aviso"
              />
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.dateButton} onPress={() => openPicker('date')}>
                <AppText style={styles.dateButtonText}>{formatDateLabel(notificationDate)}</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateButton} onPress={() => openPicker('time')}>
                <AppText style={styles.dateButtonText}>{formatTimeLabel(notificationTime)}</AppText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {Platform.OS === 'ios' && showIOSDatePicker ? (
          <View style={styles.iosPickerCard}>
            <DateTimePicker
              mode="date"
              display="spinner"
              value={parseDateForPicker(notificationDate)}
              onChange={(_, selected) => {
                if (!selected) return;
                setNotificationDate(
                  [
                    selected.getFullYear(),
                    String(selected.getMonth() + 1).padStart(2, '0'),
                    String(selected.getDate()).padStart(2, '0'),
                  ].join('-'),
                );
              }}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowIOSDatePicker(false)}>
              <AppText style={styles.doneButtonText}>Listo</AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        {Platform.OS === 'ios' && showIOSTimePicker ? (
          <View style={styles.iosPickerCard}>
            <DateTimePicker
              mode="time"
              display="spinner"
              value={parseTimeForPicker(notificationTime)}
              onChange={(_, selected) => {
                if (!selected) return;
                setNotificationTime(
                  `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`,
                );
              }}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowIOSTimePicker(false)}>
              <AppText style={styles.doneButtonText}>Listo</AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        <AppText style={styles.label}>Mensaje</AppText>
        <AppTextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Escribe el mensaje que verá la persona"
          placeholderTextColor={appColors.textMuted}
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={appColors.text} />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={18} color={appColors.text} />
              <AppText style={styles.primaryButtonText}>Guardar recordatorio</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: appColors.background,
    gap: 16,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  kicker: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: appColors.text,
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: appColors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  helperText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: appColors.backgroundMuted,
  },
  picker: {
    color: appColors.text,
  },
  personCard: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '50'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '20'),
  },
  personCopy: {
    flex: 1,
  },
  personName: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  personMeta: {
    color: appColors.textSoft,
    fontSize: 12,
    marginTop: 3,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
  },
  refreshPillText: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  loadingText: {
    color: appColors.textSoft,
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  emptyTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  appointmentList: {
    gap: 12,
  },
  appointmentCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  appointmentCardActive: {
    borderColor: appColors.info,
    backgroundColor: colorAlpha(appColors.info, '12'),
  },
  appointmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  appointmentTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  statePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colorAlpha(appColors.textMuted, '18'),
  },
  statePillActive: {
    backgroundColor: colorAlpha(appColors.info, '22'),
  },
  statePillText: {
    color: appColors.textSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  statePillTextActive: {
    color: appColors.info,
  },
  appointmentDate: {
    color: appColors.info,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  appointmentDetail: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  label: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  channelChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  channelChipActive: {
    backgroundColor: colorAlpha(appColors.success, '15'),
    borderColor: colorAlpha(appColors.success, '60'),
  },
  channelChipText: {
    color: appColors.textSoft,
    fontWeight: '700',
  },
  channelChipTextActive: {
    color: appColors.success,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  dateButtonText: {
    color: appColors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  iosPickerCard: {
    borderRadius: 16,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  doneButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },
  doneButtonText: {
    color: appColors.info,
    fontWeight: '800',
  },
  input: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    color: appColors.text,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 16,
    minHeight: 54,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: appColors.accent,
    marginTop: 12,
  },
});
