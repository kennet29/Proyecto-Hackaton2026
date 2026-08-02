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
import { API_URL } from '../config/api';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';

type DateFieldKey = 'fechaEvento' | 'fechaSeguimiento' | 'proximoControl';

const webDateInputStyle = {
  flex: 1,
  minWidth: 0,
  minHeight: 52,
  borderRadius: 14,
  border: '1px solid #27496D',
  backgroundColor: '#071120',
  color: '#F4F8FF',
  padding: '0 14px',
  fontFamily: '"SpaceGrotesk_400Regular", "Segoe UI", Arial, sans-serif',
  fontSize: 15,
  fontWeight: 700,
  outline: 'none',
  colorScheme: 'dark',
};

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type RelatedEventOption = {
  id: number;
  title: string;
  date: string;
};

type FollowUpEntry = {
  seguimientoPosteventoId: number;
  tipoEvento: string;
  tituloEvento: string;
  fechaEvento: string;
  fechaSeguimiento: string;
  estado: string;
  nivelDolor: number | null;
  compartirConMedico: boolean;
  requiereAtencion: boolean;
  notas: string | null;
};

const eventTypeOptions = [
  { value: 'operacion', label: 'Operación', icon: 'medkit-outline' },
  { value: 'lesion', label: 'Lesión', icon: 'bandage-outline' },
  { value: 'emergencia', label: 'Emergencia', icon: 'alert-circle-outline' },
] as const;

const statusOptions = [
  { value: 'activo', label: 'Activo', color: '#29B6FF' },
  { value: 'en observacion', label: 'En observación', color: '#FFB547' },
  { value: 'cerrado', label: 'Cerrado', color: '#38E28E' },
] as const;

const todayString = () => toLocalDateOnlyString();

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
  const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  if (value) {
    const segments = value.split('-').map((segment) => Number(segment));
    if (segments.length === 3 && segments.every((segment) => Number.isFinite(segment))) {
      return new Date(segments[0], segments[1] - 1, segments[2]);
    }
  }
  return new Date();
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  const parsed = parseCalendarDate(value);
  if (!parsed) {
    return value;
  }
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildEntryMeta = (entry: FollowUpEntry) => {
  const markers: string[] = [];
  if (entry.compartirConMedico) {
    markers.push('Compartido');
  }
  if (entry.requiereAtencion) {
    markers.push('Requiere atencion');
  }
  if (entry.nivelDolor !== null) {
    markers.push(`Dolor ${entry.nivelDolor}/10`);
  }
  return markers.join(' - ');
};

export function SeguimientoPosteventoScreen() {
  const { token, user } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [form, setForm] = useState({
    pacienteId: '',
    tipoEvento: 'operacion',
    operacionId: '',
    lesionId: '',
    tituloEvento: '',
    fechaEvento: todayString(),
    fechaSeguimiento: todayString(),
    estado: 'activo',
    nivelDolor: '',
    evolucion: '',
    sintomas: '',
    medicacionActual: '',
    cuidadosHogar: '',
    notas: '',
    proximoControl: '',
  });
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [operationOptions, setOperationOptions] = useState<RelatedEventOption[]>([]);
  const [lesionOptions, setLesionOptions] = useState<RelatedEventOption[]>([]);
  const [recentEntries, setRecentEntries] = useState<FollowUpEntry[]>([]);
  const [requiereAtencion, setRequiereAtencion] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [iosDateField, setIosDateField] = useState<DateFieldKey | null>(null);

  const selectedPatientId = Number(form.pacienteId);
  const hasValidPatient = Number.isFinite(selectedPatientId) && selectedPatientId > 0;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openDatePicker = (key: DateFieldKey) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[key]),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            handleChange(key, toDateOnlyString(selected));
          }
        },
      });
      return;
    }

    setIosDateField(key);
  };

  const renderDateField = (key: DateFieldKey, label: string) => (
    <>
      <AppText style={styles.label}>{label}</AppText>
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'date',
          value: form[key],
          onChange: (event: any) => handleChange(key, event.target.value),
          style: webDateInputStyle,
          'aria-label': label,
        })
      ) : (
        <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker(key)}>
          <AppText style={styles.dateButtonText}>{form[key] ? formatDate(form[key]) : 'Selecciona fecha'}</AppText>
        </TouchableOpacity>
      )}
      {Platform.OS === 'ios' && iosDateField === key ? (
        <View style={styles.iosPickerCard}>
          <DateTimePicker
            mode="date"
            display="spinner"
            value={parseDateForPicker(form[key])}
            onChange={(_, selected) => {
              if (selected) {
                handleChange(key, toDateOnlyString(selected));
              }
            }}
          />
          <TouchableOpacity style={styles.iosPickerDoneBtn} onPress={() => setIosDateField(null)}>
            <AppText style={styles.iosPickerDoneText}>Listo</AppText>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }

    setLoadingPatients(true);
    setScreenError(null);
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
                if (patientResponse.ok && patient) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const combined = `${nombres} ${apellidos}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // Ignorar errores individuales.
              }

              return { pacienteId, displayName };
            }),
          )
        : [];

      setPatientOptions(items.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const fetchRelatedEvents = useCallback(async () => {
    if (!hasValidPatient) {
      setOperationOptions([]);
      setLesionOptions([]);
      return;
    }

    setLoadingEvents(true);
    try {
      const [operationsResponse, lesionsResponse] = await Promise.all([
        fetch(`${API_URL}/operacion`, { headers: authHeaders }),
        fetch(`${API_URL}/lesion`, { headers: authHeaders }),
      ]);

      const operationsPayload = await operationsResponse.json().catch(() => []);
      const lesionsPayload = await lesionsResponse.json().catch(() => []);

      if (!operationsResponse.ok) {
        throw new Error(operationsPayload?.message ?? 'No se pudieron cargar las operaciones');
      }
      if (!lesionsResponse.ok) {
        throw new Error(lesionsPayload?.message ?? 'No se pudieron cargar las lesiones');
      }

      const nextOperations = Array.isArray(operationsPayload)
        ? operationsPayload
            .map((item: any) => ({
              id: Number(item?.operacionId ?? item?.operacionid),
              patientId: Number(item?.pacienteId ?? item?.pacienteid),
              title: String(item?.tipo ?? 'Operacion'),
              date: String(item?.fechaoperacion ?? ''),
            }))
            .filter((item) => Number.isFinite(item.id) && item.patientId === selectedPatientId)
            .map((item) => ({ id: item.id, title: item.title, date: item.date }))
        : [];

      const nextLesions = Array.isArray(lesionsPayload)
        ? lesionsPayload
            .map((item: any) => ({
              id: Number(item?.lesionId ?? item?.lesionid),
              patientId: Number(item?.pacienteId ?? item?.pacienteid),
              title: String(item?.tipo ?? 'Lesion'),
              date: String(item?.fechalesion ?? ''),
            }))
            .filter((item) => Number.isFinite(item.id) && item.patientId === selectedPatientId)
            .map((item) => ({ id: item.id, title: item.title, date: item.date }))
        : [];

      setOperationOptions(nextOperations);
      setLesionOptions(nextLesions);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los eventos');
      setOperationOptions([]);
      setLesionOptions([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  const fetchEntries = useCallback(async () => {
    if (!hasValidPatient) {
      setRecentEntries([]);
      return;
    }

    setLoadingEntries(true);
    try {
      const response = await fetch(`${API_URL}/seguimientopostevento?pacienteId=${selectedPatientId}`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudieron cargar los seguimientos');
      }

      const mapped = Array.isArray(payload)
        ? payload.map((item: any) => ({
            seguimientoPosteventoId: Number(
              item?.seguimientoPosteventoId ?? item?.seguimientoposteventoid,
            ),
            tipoEvento: String(item?.tipoEvento ?? item?.tipoevento ?? ''),
            tituloEvento: String(item?.tituloEvento ?? item?.tituloevento ?? 'Seguimiento'),
            fechaEvento: String(item?.fechaEvento ?? item?.fechaevento ?? ''),
            fechaSeguimiento: String(item?.fechaSeguimiento ?? item?.fechaseguimiento ?? ''),
            estado: String(item?.estado ?? ''),
            nivelDolor:
              typeof item?.nivelDolor === 'number'
                ? item.nivelDolor
                : typeof item?.niveldolor === 'number'
                  ? item.niveldolor
                  : null,
            compartirConMedico: Boolean(
              item?.compartirConMedico ?? item?.compartirconmedico,
            ),
            requiereAtencion: Boolean(item?.requiereAtencion ?? item?.requiereatencion),
            notas: item?.notas ?? null,
          }))
        : [];

      setRecentEntries(mapped.slice(0, 10));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los seguimientos');
      setRecentEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchRelatedEvents();
    fetchEntries();
  }, [fetchRelatedEvents, fetchEntries]);

  const currentEventOptions =
    form.tipoEvento === 'operacion' ? operationOptions : lesionOptions;

  const applyRelatedEvent = (value: string) => {
    if (form.tipoEvento === 'operacion') {
      handleChange('operacionId', value);
      handleChange('lesionId', '');
      const selected = operationOptions.find((item) => String(item.id) === value);
      if (selected) {
        setForm((prev) => ({
          ...prev,
          tituloEvento: prev.tituloEvento.trim()
            ? prev.tituloEvento
            : `Postoperatorio: ${selected.title}`,
          fechaEvento: selected.date || prev.fechaEvento,
        }));
      }
      return;
    }

    handleChange('lesionId', value);
    handleChange('operacionId', '');
    const selected = lesionOptions.find((item) => String(item.id) === value);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        tituloEvento: prev.tituloEvento.trim()
          ? prev.tituloEvento
          : `Seguimiento lesion: ${selected.title}`,
        fechaEvento: selected.date || prev.fechaEvento,
      }));
    }
  };

  const handleTipoEventoChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      tipoEvento: value,
      operacionId: '',
      lesionId: '',
      tituloEvento: value === 'emergencia' ? prev.tituloEvento : '',
    }));
  };

  const resetForm = () => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      tipoEvento: 'operacion',
      operacionId: '',
      lesionId: '',
      tituloEvento: '',
      fechaEvento: todayString(),
      fechaSeguimiento: todayString(),
      estado: 'activo',
      nivelDolor: '',
      evolucion: '',
      sintomas: '',
      medicacionActual: '',
      cuidadosHogar: '',
      notas: '',
      proximoControl: '',
    }));
    setRequiereAtencion(false);
  };

  const handleSubmit = async () => {
    if (!hasValidPatient || !form.tituloEvento.trim() || !form.fechaEvento.trim()) {
      Alert.alert('Faltan datos', 'Paciente, titulo del evento y fecha del evento son obligatorios.');
      return;
    }

    if (form.tipoEvento === 'operacion' && !form.operacionId) {
      Alert.alert('Falta relacion', 'Selecciona la operacion a la que pertenece este seguimiento.');
      return;
    }
    if (form.tipoEvento === 'lesion' && !form.lesionId) {
      Alert.alert('Falta relacion', 'Selecciona la lesion a la que pertenece este seguimiento.');
      return;
    }
    const painLevel = form.nivelDolor === '' ? null : Number(form.nivelDolor);
    if (painLevel !== null && (!Number.isInteger(painLevel) || painLevel < 0 || painLevel > 10)) {
      Alert.alert('Nivel de dolor inválido', 'Selecciona un nivel entre 0 y 10.');
      return;
    }

    setSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/seguimientopostevento',
        method: 'POST',
        description: 'registrar seguimiento de caso',
        body: {
          pacienteId: selectedPatientId,
          tipoEvento: form.tipoEvento,
          operacionId: form.operacionId ? Number(form.operacionId) : undefined,
          lesionId: form.lesionId ? Number(form.lesionId) : undefined,
          tituloEvento: form.tituloEvento.trim(),
          fechaEvento: form.fechaEvento.trim(),
          fechaSeguimiento: form.fechaSeguimiento.trim(),
          estado: form.estado,
          nivelDolor: painLevel ?? undefined,
          evolucion: form.evolucion.trim() || undefined,
          sintomas: form.sintomas.trim() || undefined,
          medicacionActual: form.medicacionActual.trim() || undefined,
          cuidadosHogar: form.cuidadosHogar.trim() || undefined,
          notas: form.notas.trim() || undefined,
          compartirConMedico: false,
          requiereAtencion,
          proximoControl: form.proximoControl.trim() || undefined,
          creadoPor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Seguimiento en cola',
          'No habia conexion. El seguimiento quedo guardado en el dispositivo y se sincronizara cuando vuelva la red.',
        );
      } else {
        Alert.alert(
          'Seguimiento guardado',
          'La nota quedo registrada en el historial del caso.',
        );
        fetchEntries();
      }

      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el seguimiento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="pulse-outline" size={28} color="#29B6FF" />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.kicker}>EVOLUCIÓN CLÍNICA</AppText>
          <AppText style={styles.title}>Seguimiento de caso</AppText>
          <AppText style={styles.subtitle}>
            Registra cómo evoluciona una operación, lesión o emergencia y define el próximo paso.
          </AppText>
        </View>
      </View>

      <View style={styles.formCard}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <Ionicons name="folder-open-outline" size={20} color="#29B6FF" />
        </View>
        <View style={styles.blockHeaderCopy}>
          <AppText style={styles.blockTitle}>Caso relacionado</AppText>
          <AppText style={styles.blockHint}>Selecciona la persona y el evento que deseas seguir.</AppText>
        </View>
      </View>
      <AppText style={styles.label}>Paciente</AppText>
      <View style={styles.pickerWrapper}>
        <Picker
          style={styles.picker}
          selectedValue={form.pacienteId}
          onValueChange={(value) => {
            handleChange('pacienteId', String(value));
            handleChange('operacionId', '');
            handleChange('lesionId', '');
          }}
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

      <AppText style={styles.label}>Tipo de evento</AppText>
      <View style={styles.optionGrid}>
        {eventTypeOptions.map((option) => {
          const active = form.tipoEvento === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.eventOption, active && styles.eventOptionActive]}
              onPress={() => handleTipoEventoChange(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? '#071120' : '#29B6FF'}
              />
              <AppText style={[styles.eventOptionText, active && styles.eventOptionTextActive]}>
                {option.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.tipoEvento !== 'emergencia' ? (
        <>
          <AppText style={styles.label}>
            {form.tipoEvento === 'operacion' ? 'Operacion relacionada' : 'Lesion relacionada'}
          </AppText>
          <View style={styles.pickerWrapper}>
            <Picker
              style={styles.picker}
              selectedValue={form.tipoEvento === 'operacion' ? form.operacionId : form.lesionId}
              onValueChange={(value) => applyRelatedEvent(String(value))}
              enabled={hasValidPatient && !loadingEvents}
            >
              <Picker.Item
                label={
                  !hasValidPatient
                    ? 'Selecciona primero una persona'
                    : loadingEvents
                      ? 'Cargando eventos...'
                      : 'Selecciona el evento'
                }
                value=""
              />
              {currentEventOptions.map((event) => (
                <Picker.Item
                  key={event.id}
                  label={`#${event.id} - ${formatDate(event.date)} - ${event.title}`}
                  value={String(event.id)}
                />
              ))}
            </Picker>
          </View>
        </>
      ) : null}

      <AppText style={styles.label}>Titulo del seguimiento</AppText>
      <AppTextInput
        style={styles.input}
        placeholder="Escribe un titulo"
        placeholderTextColor="#F4F8FF"
        value={form.tituloEvento}
        onChangeText={(value) => handleChange('tituloEvento', value)}
      />

      <View style={styles.row}>
        <View style={styles.fieldGroupHalf}>
          {renderDateField('fechaEvento', 'Fecha del evento')}
        </View>
        <View style={styles.fieldGroupHalf}>
          {renderDateField('fechaSeguimiento', 'Fecha de seguimiento')}
        </View>
      </View>

      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <Ionicons name="analytics-outline" size={20} color="#29B6FF" />
        </View>
        <View style={styles.blockHeaderCopy}>
          <AppText style={styles.blockTitle}>Estado actual</AppText>
          <AppText style={styles.blockHint}>Resume el avance y cualquier cambio observado.</AppText>
        </View>
      </View>
      <AppText style={styles.label}>Estado actual</AppText>
      <View style={styles.statusOptions}>
        {statusOptions.map((status) => {
          const active = form.estado === status.value;
          return (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.statusOption,
                active && { borderColor: status.color, backgroundColor: `${status.color}18` },
              ]}
              onPress={() => handleChange('estado', status.value)}
            >
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <AppText style={[styles.statusOptionText, active && { color: status.color }]}>
                {status.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <AppText style={styles.label}>Nivel de dolor</AppText>
      <View style={styles.painScale}>
        {Array.from({ length: 11 }, (_, level) => {
          const active = form.nivelDolor === String(level);
          const color = level <= 3 ? '#38E28E' : level <= 6 ? '#FFB547' : '#FF4D73';
          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.painLevel,
                active && { borderColor: color, backgroundColor: `${color}20` },
              ]}
              onPress={() => handleChange('nivelDolor', active ? '' : String(level))}
            >
              <AppText style={[styles.painLevelText, active && { color }]}>{level}</AppText>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.painLegend}>
        <AppText style={styles.painLegendText}>Sin dolor</AppText>
        <AppText style={styles.painLegendText}>Dolor intenso</AppText>
      </View>

      <AppText style={styles.label}>Evolucion general</AppText>
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe la evolucion"
        placeholderTextColor="#F4F8FF"
        value={form.evolucion}
        multiline
        onChangeText={(value) => handleChange('evolucion', value)}
      />

      <AppText style={styles.label}>Sintomas o cambios observados</AppText>
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe sintomas o cambios"
        placeholderTextColor="#F4F8FF"
        value={form.sintomas}
        multiline
        onChangeText={(value) => handleChange('sintomas', value)}
      />

      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <Ionicons name="home-outline" size={20} color="#29B6FF" />
        </View>
        <View style={styles.blockHeaderCopy}>
          <AppText style={styles.blockTitle}>Plan de seguimiento</AppText>
          <AppText style={styles.blockHint}>Documenta el tratamiento y define si requiere atención.</AppText>
        </View>
      </View>
      <AppText style={styles.label}>Medicacion actual</AppText>
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Medicamentos en uso"
        placeholderTextColor="#F4F8FF"
        value={form.medicacionActual}
        multiline
        onChangeText={(value) => handleChange('medicacionActual', value)}
      />

      <AppText style={styles.label}>Cuidados en casa</AppText>
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Indica los cuidados"
        placeholderTextColor="#F4F8FF"
        value={form.cuidadosHogar}
        multiline
        onChangeText={(value) => handleChange('cuidadosHogar', value)}
      />

      <AppText style={styles.label}>Notas adicionales</AppText>
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Agrega notas complementarias"
        placeholderTextColor="#F4F8FF"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />

      {renderDateField('proximoControl', 'Próximo control')}

      <AppText style={styles.label}>Prioridad</AppText>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.attentionButton, requiereAtencion && styles.attentionButtonActive]}
          onPress={() => setRequiereAtencion((current) => !current)}
        >
          <Ionicons
            name={requiereAtencion ? 'alert-circle' : 'checkmark-circle-outline'}
            size={21}
            color={requiereAtencion ? '#FF4D73' : '#38E28E'}
          />
          <View style={styles.attentionCopy}>
            <AppText style={[styles.attentionTitle, requiereAtencion && styles.attentionTitleActive]}>
              {requiereAtencion ? 'Requiere atención médica' : 'Evolución sin urgencia'}
            </AppText>
            <AppText style={styles.attentionHint}>
              {requiereAtencion
                ? 'El caso quedará marcado como prioritario.'
                : 'Toca aquí si el caso necesita revisión prioritaria.'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9FB3C8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, submitting && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#071120" />
        ) : (
          <Ionicons name="save-outline" size={20} color="#071120" />
        )}
        <AppText style={styles.saveBtnText}>{submitting ? 'Guardando...' : 'Guardar seguimiento'}</AppText>
      </TouchableOpacity>
      </View>

      <View style={styles.historyHeader}>
        <View>
          <AppText style={styles.sectionTitle}>Historial reciente</AppText>
          <AppText style={styles.historyHint}>Últimas actualizaciones de la persona seleccionada.</AppText>
        </View>
        <View style={styles.historyCount}>
          <AppText style={styles.historyCountText}>{recentEntries.length}</AppText>
        </View>
      </View>
      {screenError ? <AppText style={styles.errorText}>{screenError}</AppText> : null}
      {loadingEntries ? (
        <ActivityIndicator color="#29B6FF" style={styles.loader} />
      ) : recentEntries.length ? (
        recentEntries.map((entry) => (
          <View key={entry.seguimientoPosteventoId} style={styles.entryCard}>
            <View style={styles.entryTopRow}>
              <View style={styles.entryTopCopy}>
                <AppText style={styles.entryTitle}>{entry.tituloEvento}</AppText>
                <AppText style={styles.entryType}>{entry.tipoEvento}</AppText>
              </View>
              <View
                style={[
                  styles.entryStatus,
                  entry.estado === 'cerrado'
                    ? styles.entryStatusClosed
                    : entry.estado === 'en observacion'
                      ? styles.entryStatusObservation
                      : styles.entryStatusActive,
                ]}
              >
                <AppText style={styles.entryStatusText}>{entry.estado}</AppText>
              </View>
            </View>
            <AppText style={styles.entryMeta}>
              Evento {formatDate(entry.fechaEvento)} · Seguimiento {formatDate(entry.fechaSeguimiento)}
            </AppText>
            {buildEntryMeta(entry) ? <AppText style={styles.entryHighlights}>{buildEntryMeta(entry)}</AppText> : null}
            {entry.notas ? <AppText style={styles.entryNotes}>{entry.notas}</AppText> : null}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <AppText style={styles.emptyStateText}>
            {hasValidPatient
              ? 'No hay seguimientos registrados para esta persona.'
              : 'Selecciona una persona para ver el historial del caso.'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
    backgroundColor: '#071120',
    gap: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 22,
    backgroundColor: '#071120',
  },
  heroIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#29B6FF18',
  },
  heroCopy: {
    flex: 1,
  },
  kicker: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 5,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  formCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 22,
    backgroundColor: '#071120',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27496D',
  },
  blockIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#29B6FF12',
  },
  blockHeaderCopy: {
    flex: 1,
  },
  blockTitle: {
    color: '#F4F8FF',
    fontSize: 17,
    fontWeight: '900',
  },
  blockHint: {
    color: '#9FB3C8',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
    marginTop: 8,
    marginBottom: 10,
  },
  label: {
    color: '#F4F8FF',
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  eventOption: {
    flex: 1,
    minWidth: 140,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    backgroundColor: '#071120',
  },
  eventOptionActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF',
  },
  eventOptionText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  eventOptionTextActive: {
    color: '#071120',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldGroupHalf: {
    flex: 1,
    minWidth: 220,
    gap: 8,
  },
  dateButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#071120',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateButtonText: {
    color: '#F4F8FF',
    fontSize: 16,
    textAlign: 'center',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: '#27496D',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#071120',
  },
  iosPickerDoneText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    minWidth: 135,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    backgroundColor: '#071120',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  painScale: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  painLevel: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    backgroundColor: '#071120',
  },
  painLevelText: {
    color: '#C9D7E8',
    fontWeight: '900',
  },
  painLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
    marginBottom: 16,
  },
  painLegendText: {
    color: '#9FB3C8',
    fontSize: 11,
  },
  toggleRow: {
    marginBottom: 16,
  },
  attentionButton: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: '#38E28E55',
    borderRadius: 15,
    padding: 13,
    backgroundColor: '#38E28E0C',
  },
  attentionButtonActive: {
    borderColor: '#FF4D73',
    backgroundColor: '#FF4D7312',
  },
  attentionCopy: {
    flex: 1,
  },
  attentionTitle: {
    color: '#38E28E',
    fontWeight: '900',
    fontSize: 14,
  },
  attentionTitleActive: {
    color: '#FF4D73',
  },
  attentionHint: {
    color: '#9FB3C8',
    fontSize: 12,
    marginTop: 3,
  },
  saveBtn: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#29B6FF',
    borderRadius: 14,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#071120',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyHint: {
    color: '#9FB3C8',
    fontSize: 12,
  },
  historyCount: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#29B6FF18',
  },
  historyCountText: {
    color: '#29B6FF',
    fontWeight: '900',
  },
  entryCard: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  entryTopCopy: {
    flex: 1,
  },
  entryTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  entryType: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 3,
  },
  entryStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  entryStatusActive: {
    backgroundColor: '#29B6FF18',
  },
  entryStatusObservation: {
    backgroundColor: '#FFB54718',
  },
  entryStatusClosed: {
    backgroundColor: '#38E28E18',
  },
  entryStatusText: {
    color: '#F4F8FF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  entryMeta: {
    color: '#C9D7E8',
    lineHeight: 19,
    marginBottom: 4,
  },
  entryHighlights: {
    color: '#29B6FF',
    marginBottom: 6,
    fontWeight: '700',
  },
  entryNotes: {
    color: '#F4F8FF',
    lineHeight: 19,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#132238',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#9FB3C8',
    lineHeight: 19,
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
});
