import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';

type RegistroDentalRecord = {
  registrodentalId: number;
  pacienteId: number;
  fechaatencion: string;
  procedimiento: string;
  diagnostico?: string | null;
  odontologo?: string | null;
  piezastratadas?: string | null;
  notas?: string | null;
};

type PatientDentalSummary = {
  pacienteId: number;
  patientName: string;
  total: number;
  latestDate: string | null;
  latestProcedure: string | null;
  odontologos: string[];
};

type DatePickerField = 'date' | 'time' | 'notification-date' | 'notification-time';

type FormState = {
  pacienteId: string;
  fechaAtencion: string;
  procedimiento: string;
  diagnostico: string;
  odontologo: string;
  piezasTratadas: string;
  notas: string;
};

type RegistroDentalFormScreenProps = {
  mode?: 'list' | 'create';
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const trimmed = String(input).trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const parts = value.split('-').map(Number);
    if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  return new Date();
};

const parseTimeForPicker = (value?: string) => {
  const base = new Date();
  base.setSeconds(0, 0);
  const parts = value?.split(':').map(Number) ?? [];
  if (parts.length === 2 && parts.every((part) => !Number.isNaN(part))) {
    base.setHours(parts[0], parts[1], 0, 0);
    return base;
  }
  base.setHours(9, 0, 0, 0);
  return base;
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  const parsed = parseDateForPicker(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDisplayDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeLabel = (value?: string) => {
  if (!value) return 'Selecciona hora';
  const parts = value.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
  }
  return value;
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

export function RegistroDentalFormScreen({ mode = 'list' }: RegistroDentalFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<RegistroDentalRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateValue, setDateValue] = useState(toDateOnlyString(new Date()));
  const [timeValue, setTimeValue] = useState('09:00');
  const [showNotificationDatePicker, setShowNotificationDatePicker] = useState(false);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [createNotification, setCreateNotification] = useState(false);
  const [notificationDate, setNotificationDate] = useState(toDateOnlyString(new Date()));
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [notificationMessage, setNotificationMessage] = useState(
    'Recordatorio de seguimiento de atencion dental',
  );
  const [form, setForm] = useState<FormState>({
    pacienteId: user?.pacienteId ? String(user.pacienteId) : '',
    fechaAtencion: '',
    procedimiento: '',
    diagnostico: '',
    odontologo: '',
    piezasTratadas: '',
    notas: '',
  });

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback(() => {
    setDateValue(toDateOnlyString(new Date()));
    setTimeValue('09:00');
    setCreateNotification(false);
    setNotificationDate(toDateOnlyString(new Date()));
    setNotificationTime('08:00');
    setNotificationMessage('Recordatorio de seguimiento de atencion dental');
    setForm({
      pacienteId: user?.pacienteId ? String(user.pacienteId) : '',
      fechaAtencion: '',
      procedimiento: '',
      diagnostico: '',
      odontologo: '',
      piezasTratadas: '',
      notas: '',
    });
  }, [user?.pacienteId]);

  useEffect(() => {
    if (!createNotification) {
      return;
    }
    if (notificationDate !== dateValue) {
      setNotificationDate(dateValue);
    }
  }, [createNotification, dateValue, notificationDate]);

  useEffect(() => {
    if (!createNotification) {
      return;
    }
    const procedure = form.procedimiento.trim();
    setNotificationMessage(
      procedure
        ? `Recordatorio de seguimiento dental: ${procedure}`
        : 'Recordatorio de seguimiento de atencion dental',
    );
  }, [createNotification, form.procedimiento]);

  const fetchPatients = useCallback(async () => {
    if (!token) return;
    setLoadingPatients(true);
    try {
      let normalized = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }
      setPatientOptions(normalized);
      setForm((prev) => {
        if (prev.pacienteId || normalized.length === 0) return prev;
        return { ...prev, pacienteId: String(normalized[0].pacienteId) };
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/registrodental`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar los registros dentales');
      }
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any, index: number) => ({
            registrodentalId: Number(
              item?.registrodentalId ?? item?.registrodentalid ?? item?.id ?? index + 1,
            ),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            fechaatencion: item?.fechaatencion ?? '',
            procedimiento: normalizeText(item?.procedimiento) ?? '',
            diagnostico: normalizeText(item?.diagnostico),
            odontologo: normalizeText(item?.odontologo),
            piezastratadas: normalizeText(item?.piezastratadas ?? item?.piezasTratadas),
            notas: normalizeText(item?.notas),
          }))
          .filter(
            (item: RegistroDentalRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0,
          )
          .sort(
            (a: RegistroDentalRecord, b: RegistroDentalRecord) =>
              new Date(b.fechaatencion).getTime() - new Date(a.fechaatencion).getTime(),
          ),
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Fallo al cargar registros dentales',
      );
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
      fetchRecords();
    }, [fetchPatients, fetchRecords]),
  );

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return records.filter((record) => record.pacienteId === activePatientId);
    }
    return records;
  }, [records, selectedPatientId]);

  const patientSummaries = useMemo<PatientDentalSummary[]>(() => {
    const grouped = new Map<number, RegistroDentalRecord[]>();
    records.forEach((record) => {
      const list = grouped.get(record.pacienteId) ?? [];
      list.push(record);
      grouped.set(record.pacienteId, list);
    });

    return Array.from(grouped.entries())
      .map(([pacienteId, items]) => ({
        pacienteId,
        patientName: patientNameById[pacienteId] ?? `Paciente #${pacienteId}`,
        total: items.length,
        latestDate: items[0]?.fechaatencion ?? null,
        latestProcedure: normalizeText(items[0]?.procedimiento),
        odontologos: Array.from(
          new Set(
            items
              .map((item) => normalizeText(item.odontologo))
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.latestDate ?? 0).getTime() - new Date(a.latestDate ?? 0).getTime(),
      );
  }, [patientNameById, records]);

  const visibleSummaries = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return patientSummaries.filter((summary) => summary.pacienteId === activePatientId);
    }
    return patientSummaries;
  }, [patientSummaries, selectedPatientId]);

  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return {
      total: filteredRecords.length,
      patients: new Set(filteredRecords.map((record) => record.pacienteId)).size,
      thisMonth: filteredRecords.filter((record) => {
        const parsed = new Date(record.fechaatencion);
        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.getMonth() === currentMonth &&
          parsed.getFullYear() === currentYear
        );
      }).length,
      doctors: new Set(
        filteredRecords
          .map((record) => normalizeText(record.odontologo))
          .filter((value): value is string => Boolean(value)),
      ).size,
    };
  }, [filteredRecords]);

  const showPicker = (field: DatePickerField) => {
    if (Platform.OS === 'web') {
      const isDateField = field === 'date' || field === 'notification-date';
      const handled = openWebDateTimePicker(
        isDateField ? 'date' : 'time',
        isDateField
          ? field === 'date'
            ? dateValue
            : notificationDate
          : field === 'time'
            ? timeValue
            : notificationTime,
        (value) => {
          if (field === 'date') {
            setDateValue(value);
          } else if (field === 'notification-date') {
            setNotificationDate(value);
          } else if (field === 'time') {
            setTimeValue(value);
          } else {
            setNotificationTime(value);
          }
        },
      );
      if (handled) return;
    }

    if (Platform.OS === 'android') {
      if (field === 'date' || field === 'notification-date') {
        DateTimePickerAndroid.open({
          value: parseDateForPicker(field === 'date' ? dateValue : notificationDate),
          mode: 'date',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              const formatted = toDateOnlyString(selected);
              if (field === 'date') {
                setDateValue(formatted);
              } else {
                setNotificationDate(formatted);
              }
            }
          },
        });
      } else {
        DateTimePickerAndroid.open({
          value: parseTimeForPicker(field === 'time' ? timeValue : notificationTime),
          mode: 'time',
          is24Hour: true,
          onChange: (event, selected) => {
            if (event.type === 'set' && selected) {
              const hh = String(selected.getHours()).padStart(2, '0');
              const mm = String(selected.getMinutes()).padStart(2, '0');
              if (field === 'time') {
                setTimeValue(`${hh}:${mm}`);
              } else {
                setNotificationTime(`${hh}:${mm}`);
              }
            }
          },
        });
      }
      return;
    }
    if (field === 'date') {
      setShowIOSDatePicker(true);
    } else if (field === 'time') {
      setShowIOSTimePicker(true);
    } else if (field === 'notification-date') {
      setShowNotificationDatePicker(true);
    } else {
      setShowNotificationTimePicker(true);
    }
  };

  const renderIOSPicker = (field: DatePickerField) => {
    const visible =
      field === 'date'
        ? showIOSDatePicker
        : field === 'time'
          ? showIOSTimePicker
          : field === 'notification-date'
            ? showNotificationDatePicker
            : showNotificationTimePicker;
    if (Platform.OS !== 'ios' || !visible) return null;
    const isDate = field === 'date' || field === 'notification-date';
    return (
      <View style={styles.iosPickerCard}>
        <DateTimePicker
          mode={isDate ? 'date' : 'time'}
          display="spinner"
          value={
            isDate
              ? parseDateForPicker(field === 'date' ? dateValue : notificationDate)
              : parseTimeForPicker(field === 'time' ? timeValue : notificationTime)
          }
          onChange={(_, selected) => {
            if (!selected) return;
            if (isDate) {
              const formatted = toDateOnlyString(selected);
              if (field === 'date') {
                setDateValue(formatted);
              } else {
                setNotificationDate(formatted);
              }
            } else {
              const hh = String(selected.getHours()).padStart(2, '0');
              const mm = String(selected.getMinutes()).padStart(2, '0');
              if (field === 'time') {
                setTimeValue(`${hh}:${mm}`);
              } else {
                setNotificationTime(`${hh}:${mm}`);
              }
            }
          }}
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            if (field === 'date') setShowIOSDatePicker(false);
            if (field === 'time') setShowIOSTimePicker(false);
            if (field === 'notification-date') setShowNotificationDatePicker(false);
            if (field === 'notification-time') setShowNotificationTimePicker(false);
          }}
        >
          <Text style={styles.secondaryButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSubmit = async () => {
    const fechaAtencion = `${dateValue}T${timeValue}`;
    const fechaNotificacion = `${notificationDate}T${notificationTime}`;
    if (!form.pacienteId || !fechaAtencion || !form.procedimiento.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha y procedimiento son obligatorios');
      return;
    }
    if (createNotification && (!notificationDate || !notificationTime || !notificationMessage.trim())) {
      Alert.alert(
        'Faltan datos',
        'Si activas la notificacion debes completar fecha, hora y mensaje.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/registrodental',
        method: 'POST',
        description: 'registrar atencion dental',
        body: {
          pacienteId: Number(form.pacienteId),
          fechaatencion: fechaAtencion,
          procedimiento: form.procedimiento.trim(),
          diagnostico: form.diagnostico.trim() || undefined,
          odontologo: form.odontologo.trim() || undefined,
          piezastratadas: form.piezasTratadas.trim() || undefined,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (createNotification) {
        const createdId =
          offlineResult.status === 'online'
            ? Number(
                (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                  ?.registrodentalId ??
                  (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                    ?.registrodentalid ??
                  (offlineResult.data as { registrodentalId?: number; registrodentalid?: number; id?: number } | null)
                    ?.id,
              )
            : null;

        await submitJsonWithOfflineFallback({
          token,
          path: '/notificacion',
          method: 'POST',
          description: 'crear notificacion de seguimiento dental',
          body: {
            pacienteId: Number(form.pacienteId),
            tipo: 'registro_dental_seguimiento',
            mensaje: notificationMessage.trim(),
            fechaprogramada: fechaNotificacion,
            medio: 'push',
            entidadorigen: 'registrodental',
            entidadId: Number.isFinite(createdId) ? createdId : undefined,
            campoprueba03: `Dental: ${form.procedimiento.trim() || 'Seguimiento'}`.slice(0, 200),
            creadopor: user?.username ?? undefined,
          },
        });
      }

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Registro en cola',
          createNotification
            ? 'No habia conexion. La atencion dental y su notificacion quedaron guardadas localmente y se sincronizaran al volver la red.'
            : 'No habia conexion. La atencion dental quedo guardada localmente y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert(
          'Registro guardado',
          createNotification
            ? 'La atencion dental y su notificacion fueron registradas correctamente.'
            : 'La atencion dental fue registrada correctamente',
        );
      }

      resetForm();
      if (isCreateMode) {
        navigation.goBack();
      } else {
        fetchRecords();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Nuevo registro dental</Text>
      <Text style={styles.formSubtitle}>
        Registra la atencion, el procedimiento y las piezas tratadas para conservar el historial odontologico.
      </Text>

      <Text style={styles.label}>Paciente</Text>
      {loadingPatients ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#29B6FF" />
          <Text style={styles.loadingText}>Cargando pacientes...</Text>
        </View>
      ) : patientOptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No hay pacientes vinculados</Text>
          <Text style={styles.emptyText}>
            Primero agrega una persona desde Gestionar Expediente.
          </Text>
        </View>
      ) : (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.pacienteId}
            onValueChange={(value) => handleChange('pacienteId', String(value))}
            dropdownIconColor="#F4F8FF"
            style={styles.picker}
          >
            <Picker.Item label="Selecciona un paciente" value="" color="#F4F8FF" />
            {patientOptions.map((patient) => (
              <Picker.Item
                key={patient.pacienteId}
                label={patient.displayName}
                value={String(patient.pacienteId)}
                color="#F4F8FF"
              />
            ))}
          </Picker>
        </View>
      )}

      <Text style={styles.label}>Fecha y hora</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.dateButton, styles.flexItem]}
          onPress={() => showPicker('date')}
        >
          <Text style={styles.dateButtonText}>{formatDisplayDate(dateValue)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateButton, styles.flexItem]}
          onPress={() => showPicker('time')}
        >
          <Text style={styles.dateButtonText}>Hora: {formatTimeLabel(timeValue)}</Text>
        </TouchableOpacity>
      </View>
      {renderIOSPicker('date')}
      {renderIOSPicker('time')}

      <TextInput
        style={styles.input}
        placeholder="Procedimiento"
        placeholderTextColor="#9FB3C8"
        value={form.procedimiento}
        onChangeText={(value) => handleChange('procedimiento', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Diagnostico"
        placeholderTextColor="#9FB3C8"
        value={form.diagnostico}
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Odontologo"
        placeholderTextColor="#9FB3C8"
        value={form.odontologo}
        onChangeText={(value) => handleChange('odontologo', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Piezas tratadas"
        placeholderTextColor="#9FB3C8"
        value={form.piezasTratadas}
        onChangeText={(value) => handleChange('piezasTratadas', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas"
        placeholderTextColor="#9FB3C8"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />

      <View style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationHeaderCopy}>
            <Text style={styles.notificationTitle}>Notificacion de seguimiento</Text>
            <Text style={styles.notificationHint}>
              Decide si quieres dejar programado un recordatorio desde este mismo registro.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationToggle,
              createNotification ? styles.notificationToggleActive : null,
            ]}
            onPress={() => setCreateNotification((prev) => !prev)}
          >
            <Text style={styles.notificationToggleText}>
              {createNotification ? 'Si' : 'No'}
            </Text>
          </TouchableOpacity>
        </View>

        {createNotification ? (
          <>
            <Text style={styles.label}>Fecha y hora del recordatorio</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.dateButton, styles.flexItem]}
                onPress={() => showPicker('notification-date')}
              >
                <Text style={styles.dateButtonText}>{formatDisplayDate(notificationDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, styles.flexItem]}
                onPress={() => showPicker('notification-time')}
              >
                <Text style={styles.dateButtonText}>Hora: {formatTimeLabel(notificationTime)}</Text>
              </TouchableOpacity>
            </View>
            {renderIOSPicker('notification-date')}
            {renderIOSPicker('notification-time')}

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Mensaje de la notificacion"
              placeholderTextColor="#9FB3C8"
              value={notificationMessage}
              multiline
              onChangeText={setNotificationMessage}
            />
          </>
        ) : null}
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            resetForm();
            if (isCreateMode) {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <Text style={styles.primaryButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isCreateMode) {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        {renderForm()}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Atencion odontologica</Text>
          <Text style={styles.title}>Registro dental</Text>
          <Text style={styles.subtitle}>
            Revisa controles, procedimientos y profesionales por persona desde una sola vista.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.total}</Text>
            <Text style={styles.metricLabel}>Atenciones</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.patients}</Text>
            <Text style={styles.metricLabel}>Pacientes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.thisMonth}</Text>
            <Text style={styles.metricLabel}>Este mes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.doctors}</Text>
            <Text style={styles.metricLabel}>Odontologos</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.label}>Filtrar por paciente</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedPatientId}
              onValueChange={(value) => setSelectedPatientId(String(value))}
              enabled={!loadingPatients}
              dropdownIconColor="#F4F8FF"
              style={styles.picker}
            >
              <Picker.Item
                label={loadingPatients ? 'Cargando pacientes...' : 'Todos los pacientes'}
                value=""
                color="#F4F8FF"
              />
              {patientOptions.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={patient.displayName}
                  value={String(patient.pacienteId)}
                  color="#F4F8FF"
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.filterHint}>
            {selectedPatientId
              ? `Mostrando atenciones de ${patientNameById[Number(selectedPatientId)] ?? 'paciente'}`
              : 'Mostrando el historial odontologico completo'}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personas y controles</Text>
          <Text style={styles.sectionSubtitle}>{`${visibleSummaries.length} perfiles`}</Text>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <Text style={styles.loadingText}>Cargando resumen...</Text>
          </View>
        ) : visibleSummaries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavia no hay registros dentales</Text>
            <Text style={styles.emptyText}>
              Usa el boton flotante para registrar la primera atencion odontologica.
            </Text>
          </View>
        ) : (
          visibleSummaries.map((summary) => (
            <TouchableOpacity
              key={summary.pacienteId}
              style={[
                styles.summaryCard,
                Number(selectedPatientId) === summary.pacienteId ? styles.summaryCardActive : null,
              ]}
              onPress={() =>
                setSelectedPatientId((current) =>
                  Number(current) === summary.pacienteId ? '' : String(summary.pacienteId),
                )
              }
              activeOpacity={0.9}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.summaryHeaderBody}>
                  <Text style={styles.summaryName}>{summary.patientName}</Text>
                  <Text style={styles.summaryMeta}>
                    {summary.latestDate
                      ? `Ultima: ${formatDisplayDateTime(summary.latestDate)}`
                      : 'Sin fecha reciente'}
                  </Text>
                </View>
                <View style={styles.summaryCountBadge}>
                  <Text style={styles.summaryCountValue}>{summary.total}</Text>
                  <Text style={styles.summaryCountLabel}>visitas</Text>
                </View>
              </View>
              <Text style={styles.summaryPrimary}>
                {summary.latestProcedure ?? 'Atencion odontologica registrada'}
              </Text>
              <Text style={styles.summarySecondary}>
                {summary.odontologos.length > 0
                  ? `Odontologos: ${summary.odontologos.slice(0, 2).join(' Ã¢â‚¬Â¢ ')}`
                  : 'Sin profesional registrado'}
              </Text>
              <Text style={styles.summaryAction}>
                {Number(selectedPatientId) === summary.pacienteId
                  ? 'Toca para volver a ver todos'
                  : 'Toca para filtrar este historial'}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial dental</Text>
          <Text style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</Text>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay registros para este filtro</Text>
            <Text style={styles.emptyText}>
              Cambia el paciente seleccionado o registra una nueva atencion dental.
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.registrodentalId} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{formatDisplayDateTime(record.fechaatencion)}</Text>
                </View>
              </View>
              <Text style={styles.recordTitle}>{record.procedimiento || 'Atencion dental'}</Text>
              {!selectedPatientId ? (
                <Text style={styles.recordPatient}>
                  {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                </Text>
              ) : null}
              <Text style={styles.recordText}>
                Diagnostico: {normalizeText(record.diagnostico) ?? 'Sin dato'}
              </Text>
              <Text style={styles.recordText}>
                Odontologo: {normalizeText(record.odontologo) ?? 'Sin dato'}
              </Text>
              <Text style={styles.recordText}>
                Piezas tratadas: {normalizeText(record.piezastratadas) ?? 'Sin dato'}
              </Text>
              {normalizeText(record.notas) ? (
                <Text style={styles.recordText}>Notas: {normalizeText(record.notas)}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RegistroDentalCreate')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 120,
    backgroundColor: '#071120',
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  eyebrow: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 10,
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    marginHorizontal: -5,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  metricLabel: {
    marginTop: 6,
    color: '#C9D7E8',
    fontSize: 13,
  },
  filterCard: {
    backgroundColor: '#071120',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  filterHint: {
    marginTop: 10,
    color: '#9FB3C8',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  loadingCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#C9D7E8',
  },
  emptyCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: '#9FB3C8',
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 12,
  },
  summaryCardActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF18',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeaderBody: {
    flex: 1,
    paddingRight: 12,
  },
  summaryName: {
    color: '#F4F8FF',
    fontSize: 17,
    fontWeight: '900',
  },
  summaryMeta: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  summaryCountBadge: {
    minWidth: 74,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#38F28E18',
    borderWidth: 1,
    borderColor: '#38F28E',
    alignItems: 'center',
  },
  summaryCountValue: {
    color: '#38F28E',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryCountLabel: {
    color: '#38F28E',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryPrimary: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  summarySecondary: {
    marginTop: 6,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  summaryAction: {
    marginTop: 10,
    color: '#29B6FF',
    fontWeight: '700',
    fontSize: 13,
  },
  recordCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#29B6FF18',
  },
  datePillText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  recordPatient: {
    color: '#29B6FF',
    fontWeight: '700',
    marginBottom: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  formSubtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flexItem: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    backgroundColor: '#071120',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  notificationCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  notificationHeaderCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: '#F4F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  notificationHint: {
    color: '#9FB3C8',
    lineHeight: 19,
    marginTop: 4,
  },
  notificationToggle: {
    minWidth: 58,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  notificationToggleActive: {
    backgroundColor: '#29B6FF',
    borderColor: '#29B6FF',
  },
  notificationToggleText: {
    color: '#F4F8FF',
    fontWeight: '800',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#071120',
    marginRight: 6,
  },
  cancelButtonText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#29B6FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginLeft: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#F4F8FF',
    fontWeight: '900',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
  },
});
