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
  useWindowDimensions,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';
import { WebTimeInput } from '../components/WebTimeInput';

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

type ReminderRecord = {
  reminderId: number;
  reminderType: 'recordatoriocita' | 'notificacion';
  citaId: number | null;
  pacienteId: number;
  fecharecordatorio: string;
  mensaje: string;
  canal: string | null;
  estado: string | null;
  sourceType: string | null;
  sourceId: string | null;
  sourceLabel: string | null;
};

type SourceTypeKey =
  | 'citamedica'
  | 'vacuna'
  | 'operacion'
  | 'medicacion'
  | 'consultamedica'
  | 'registrodental'
  | 'lesion'
  | 'examenclinico'
  | 'desparasitacion';

type SourceDefinition = {
  key: SourceTypeKey;
  label: string;
  endpoint: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  idKeys: string[];
  titleKeys: string[];
  dateKeys: string[];
  detailKeys: string[];
};

type SourceRecord = {
  id: number;
  type: SourceTypeKey;
  typeLabel: string;
  pacienteId: number;
  title: string;
  detail: string | null;
  date: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    key: 'citamedica',
    label: 'Citas',
    endpoint: '/citamedica',
    icon: 'calendar-outline',
    accent: appColors.info,
    idKeys: ['citaId', 'citaid', 'id'],
    titleKeys: ['motivo', 'especialidad'],
    dateKeys: ['fechacita', 'fecha'],
    detailKeys: ['estado', 'medico'],
  },
  {
    key: 'vacuna',
    label: 'Vacunas',
    endpoint: '/vacuna',
    icon: 'shield-checkmark-outline',
    accent: appColors.success,
    idKeys: ['vacunaId', 'vacunaid', 'id'],
    titleKeys: ['nombre'],
    dateKeys: ['proximadosis', 'fechaaplicacion'],
    detailKeys: ['lote', 'observaciones'],
  },
  {
    key: 'operacion',
    label: 'Operaciones',
    endpoint: '/operacion',
    icon: 'bandage-outline',
    accent: appColors.accent,
    idKeys: ['operacionId', 'operacionid', 'id'],
    titleKeys: ['tipo'],
    dateKeys: ['fechaoperacion'],
    detailKeys: ['hospital', 'estado', 'cirujano'],
  },
  {
    key: 'medicacion',
    label: 'Medicamentos',
    endpoint: '/medicacion',
    icon: 'flask-outline',
    accent: '#29B6FF',
    idKeys: ['medicacionId', 'medicacionid', 'id'],
    titleKeys: ['nombremedicamento', 'nombre'],
    dateKeys: ['fechafin', 'fechainicio'],
    detailKeys: ['dosis', 'viaadministracion', 'indicaciones'],
  },
  {
    key: 'consultamedica',
    label: 'Consultas',
    endpoint: '/consultamedica',
    icon: 'medkit-outline',
    accent: '#38F28E',
    idKeys: ['consultaId', 'consultaid', 'id'],
    titleKeys: ['motivo', 'diagnostico'],
    dateKeys: ['fechaconsulta'],
    detailKeys: ['medico', 'estado'],
  },
  {
    key: 'registrodental',
    label: 'Dental',
    endpoint: '/registrodental',
    icon: 'color-wand-outline',
    accent: '#FF4D73',
    idKeys: ['registrodentalId', 'registrodentalid', 'id'],
    titleKeys: ['procedimiento', 'pieza', 'observaciones'],
    dateKeys: ['fecharegistro', 'fecha'],
    detailKeys: ['odontologo', 'resultado'],
  },
  {
    key: 'lesion',
    label: 'Lesiones',
    endpoint: '/lesion',
    icon: 'body-outline',
    accent: appColors.success,
    idKeys: ['lesionId', 'lesionid', 'id'],
    titleKeys: ['descripcion', 'tipo', 'ubicacion'],
    dateKeys: ['fechalesion', 'fecha'],
    detailKeys: ['estado', 'severidad'],
  },
  {
    key: 'examenclinico',
    label: 'Examenes',
    endpoint: '/examenclinico',
    icon: 'document-text-outline',
    accent: appColors.info,
    idKeys: ['examenclinicoId', 'examenclinicoid', 'id'],
    titleKeys: ['tipoexamen', 'nombre', 'resultado'],
    dateKeys: ['fechaexamen', 'fecha'],
    detailKeys: ['laboratorio', 'observaciones'],
  },
  {
    key: 'desparasitacion',
    label: 'Desparasitacion',
    endpoint: '/desparasitacion',
    icon: 'leaf-outline',
    accent: appColors.success,
    idKeys: ['desparasitacionId', 'desparasitacionid', 'id'],
    titleKeys: ['producto', 'medicamento', 'nombre'],
    dateKeys: ['proximaaplicacion', 'fechaaplicacion', 'fecha'],
    detailKeys: ['dosis', 'observaciones'],
  },
];

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const firstText = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = normalizeText(item?.[key]);
    if (value) return value;
  }
  return null;
};

const firstNumber = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = Number(item?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
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

const extractDatePortion = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
};

const extractTimePortion = (value?: string | null) => {
  if (!value) return '08:00';
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '08:00';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
};

const composeDateTime = (date: string, time: string) => {
  if (!date || !time) return '';
  return `${date}T${time}`;
};

const mapSourceRecords = (payload: any[], definition: SourceDefinition): SourceRecord[] =>
  payload
    .map((item) => {
      const id = firstNumber(item, definition.idKeys);
      const pacienteId = Number(item?.pacienteId ?? item?.pacienteid ?? item?.paciente?.pacienteId);
      if (!id || !Number.isFinite(pacienteId)) return null;

      return {
        id,
        type: definition.key,
        typeLabel: definition.label,
        pacienteId,
        title: firstText(item, definition.titleKeys) ?? `${definition.label} #${id}`,
        detail: firstText(item, definition.detailKeys),
        date: firstText(item, definition.dateKeys),
        icon: definition.icon,
        accent: definition.accent,
      } satisfies SourceRecord;
    })
    .filter((item): item is SourceRecord => Boolean(item));

const mapRecordatorioCitas = (payload: any[]): ReminderRecord[] => {
  const items: ReminderRecord[] = [];

  payload.forEach((item) => {
    const recordatoriocitaId = Number(item?.recordatoriocitaId ?? item?.recordatoriocitaid ?? item?.id);
    const citaIdRaw = item?.citaId ?? item?.citaid;
    const citaId = citaIdRaw === null || citaIdRaw === undefined ? null : Number(citaIdRaw);
    const pacienteId = Number(item?.pacienteId ?? item?.pacienteid);
    const fecharecordatorio = normalizeText(item?.fecharecordatorio);
    const mensaje = normalizeText(item?.mensaje);

    if (!Number.isFinite(recordatoriocitaId) || !Number.isFinite(pacienteId) || !fecharecordatorio || !mensaje) {
      return;
    }

    items.push({
      reminderId: recordatoriocitaId,
      reminderType: 'recordatoriocita',
      citaId: Number.isFinite(citaId) ? citaId : null,
      pacienteId,
      fecharecordatorio,
      mensaje,
      canal: normalizeText(item?.canal),
      estado: normalizeText(item?.estado),
      sourceType: normalizeText(item?.campoprueba01),
      sourceId: normalizeText(item?.campoprueba02),
      sourceLabel: normalizeText(item?.campoprueba03),
    });
  });

  return items;
};

const mapNotifications = (payload: any[]): ReminderRecord[] => {
  const items: ReminderRecord[] = [];

  payload.forEach((item) => {
    const notificacionId = Number(item?.notificacionId ?? item?.notificacionid ?? item?.id);
    const pacienteId = Number(item?.pacienteId ?? item?.pacienteid);
    const fechaprogramada = normalizeText(item?.fechaprogramada);
    const mensaje = normalizeText(item?.mensaje);
    const entidadId =
      item?.entidadId === null || item?.entidadId === undefined
        ? null
        : Number(item?.entidadId ?? item?.entidadid);
    const entidadOrigen = normalizeText(item?.entidadorigen);
    const tipo = normalizeText(item?.tipo);
    const sourceLabel =
      normalizeText(item?.campoprueba03) ??
      (entidadOrigen && tipo ? `${entidadOrigen}: ${tipo}` : tipo ?? entidadOrigen);

    if (!Number.isFinite(notificacionId) || !Number.isFinite(pacienteId) || !fechaprogramada || !mensaje) {
      return;
    }

    items.push({
      reminderId: notificacionId,
      reminderType: 'notificacion',
      citaId: null,
      pacienteId,
      fecharecordatorio: fechaprogramada,
      mensaje,
      canal: normalizeText(item?.medio),
      estado: typeof item?.enviada === 'boolean' ? (item.enviada ? 'enviada' : 'pendiente') : 'pendiente',
      sourceType: entidadOrigen,
      sourceId: Number.isFinite(entidadId) ? String(entidadId) : null,
      sourceLabel,
    });
  });

  return items;
};

export function RecordatorioListScreen() {
  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [sourceRecords, setSourceRecords] = useState<SourceRecord[]>([]);
  const [sourceType, setSourceType] = useState<SourceTypeKey>('citamedica');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [notificationDate, setNotificationDate] = useState('');
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordatoriosResult, notificationsResult, patientsResult, ...sourceResults] = await Promise.allSettled([
        fetch(`${API_URL}/recordatoriocita`, { headers }),
        fetch(`${API_URL}/notificacion`, { headers }),
        fetchLinkedPatients(headers, { forceRefresh: true }),
        ...SOURCE_DEFINITIONS.map((definition) => fetch(`${API_URL}${definition.endpoint}`, { headers })),
      ]);

      const reminderErrors: string[] = [];
      const mergedReminders: ReminderRecord[] = [];

      if (recordatoriosResult.status === 'fulfilled') {
        const remindersPayload = await recordatoriosResult.value.json().catch(() => null);
        if (recordatoriosResult.value.ok) {
          mergedReminders.push(
            ...mapRecordatorioCitas(Array.isArray(remindersPayload) ? remindersPayload : []),
          );
        } else {
          reminderErrors.push(remindersPayload?.message ?? 'No se pudieron cargar los recordatorios manuales');
        }
      } else {
        reminderErrors.push('No se pudieron cargar los recordatorios manuales');
      }

      if (notificationsResult.status === 'fulfilled') {
        const notificationsPayload = await notificationsResult.value.json().catch(() => null);
        if (notificationsResult.value.ok) {
          mergedReminders.push(
            ...mapNotifications(Array.isArray(notificationsPayload) ? notificationsPayload : []),
          );
        } else {
          reminderErrors.push(notificationsPayload?.message ?? 'No se pudieron cargar las notificaciones automaticas');
        }
      } else {
        reminderErrors.push('No se pudieron cargar las notificaciones automaticas');
      }

      setReminders(mergedReminders);
      setPatients(patientsResult.status === 'fulfilled' ? patientsResult.value : []);

      const loadedSources = await Promise.all(
        sourceResults.map(async (result, index) => {
          if (result.status !== 'fulfilled' || !result.value.ok) return [];
          const payload = await result.value.json().catch(() => null);
          return mapSourceRecords(Array.isArray(payload) ? payload : [], SOURCE_DEFINITIONS[index]);
        }),
      );
      setSourceRecords(loadedSources.flat());
      setError(reminderErrors.length > 0 ? reminderErrors.join(' | ') : null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la informacion');
      setReminders([]);
      setPatients([]);
      setSourceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const patientNameById = useMemo(() => {
    const entries = patients.map((patient) => [patient.pacienteId, patient.displayName] as const);
    return Object.fromEntries(entries) as Record<number, string>;
  }, [patients]);

  const sourceByKey = useMemo(() => {
    const entries = sourceRecords.map((item) => [`${item.type}:${item.id}`, item] as const);
    return Object.fromEntries(entries) as Record<string, SourceRecord>;
  }, [sourceRecords]);

  const availableSources = useMemo(() => {
    return sourceRecords
      .filter((item) => item.type === sourceType)
      .filter((item) => !selectedPatientId || String(item.pacienteId) === selectedPatientId)
      .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
  }, [selectedPatientId, sourceRecords, sourceType]);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort(
        (a, b) => new Date(a.fecharecordatorio).getTime() - new Date(b.fecharecordatorio).getTime(),
      ),
    [reminders],
  );

  const selectedSource = selectedSourceKey ? sourceByKey[selectedSourceKey] : null;
  const selectedPatientName = selectedPatientId
    ? patientNameById[Number(selectedPatientId)] ?? `Paciente #${selectedPatientId}`
    : null;

  const handleSourceTypeChange = (value: SourceTypeKey) => {
    setSourceType(value);
    setSelectedSourceKey('');
  };

  const handleSourceSelect = (key: string) => {
    setSelectedSourceKey(key);
    const item = sourceByKey[key];
    if (!item) return;

    const patientName = patientNameById[item.pacienteId] ?? `Paciente #${item.pacienteId}`;
    setSelectedPatientId(String(item.pacienteId));
    setNotificationDate(extractDatePortion(item.date));
    setNotificationTime(extractTimePortion(item.date));
    setMessage(`Recordatorio: ${patientName} tiene pendiente ${item.typeLabel.toLowerCase()} - ${item.title}.`);
  };

  const handleSubmit = async () => {
    const scheduledReminder = composeDateTime(notificationDate.trim(), notificationTime.trim());

    if (!selectedPatientId || !selectedSource || !scheduledReminder || !message.trim()) {
      Alert.alert('Faltan datos', 'Selecciona persona, tipo, registro, fecha/hora y mensaje.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitJsonWithOfflineFallback({
        token,
        path: '/recordatoriocita',
        method: 'POST',
        description: 'crear recordatorio',
        body: {
          citaId: selectedSource.type === 'citamedica' ? selectedSource.id : null,
          pacienteId: Number(selectedPatientId),
          fecharecordatorio: scheduledReminder,
          mensaje: message.trim(),
          canal: 'push',
          estado: 'pendiente',
          creadopor: user?.username ?? undefined,
          campoprueba01: selectedSource.type,
          campoprueba02: String(selectedSource.id),
          campoprueba03: `${selectedSource.typeLabel}: ${selectedSource.title}`.slice(0, 200),
          campoprueba04: selectedSource.date,
        },
      });

      Alert.alert(
        result.status === 'queued' ? 'Recordatorio en cola' : 'Recordatorio creado',
        result.status === 'queued'
          ? 'No habia conexion. Se sincronizara cuando vuelva la red.'
          : 'El aviso quedo registrado correctamente.',
      );
      setSelectedSourceKey('');
      setMessage('');
      setNotificationDate('');
      setNotificationTime('08:00');
      fetchData();
    } catch (submitError) {
      Alert.alert('Error', submitError instanceof Error ? submitError.message : 'No se pudo crear el recordatorio');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReminder = (item: ReminderRecord) => {
    const sourceKey = item.sourceType && item.sourceId ? `${item.sourceType}:${item.sourceId}` : '';
    const source = sourceKey ? sourceByKey[sourceKey] : null;
    const patientName = patientNameById[item.pacienteId] ?? `Paciente #${item.pacienteId}`;
    const sourceLabel =
      item.sourceLabel ??
      source?.title ??
      (item.citaId ? `Cita #${item.citaId}` : item.reminderType === 'notificacion' ? 'Notificacion programada' : 'Registro vinculado');

    return (
      <View key={`${item.reminderType}-${item.reminderId}`} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.personRow}>
            <View style={[styles.personIcon, { backgroundColor: colorAlpha(source?.accent ?? appColors.info, '18') }]}>
              <Ionicons name={source?.icon ?? 'notifications-outline'} size={16} color={source?.accent ?? appColors.info} />
            </View>
            <View style={styles.personTextWrap}>
              <Text style={styles.personName}>{patientName}</Text>
              <Text style={styles.personSubtext}>{sourceLabel}</Text>
            </View>
          </View>
          <View style={styles.stateBadge}>
            <Text style={styles.stateBadgeText}>{item.estado ?? 'pendiente'}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <Text style={styles.metaTitle}>Fecha del aviso</Text>
          <Text style={styles.metaValue}>{formatDateTimeLabel(item.fecharecordatorio)}</Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.metaTitle}>Mensaje</Text>
          <Text style={styles.messageText}>{item.mensaje}</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerPill}>
            <Ionicons name="send-outline" size={14} color={appColors.success} />
            <Text style={styles.footerPillText}>{item.canal ?? 'Sin canal'}</Text>
          </View>
          <Text style={styles.footerId}>
            {item.reminderType === 'notificacion' ? 'Notif' : 'Rec'} #{item.reminderId}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.scroller}
      contentContainerStyle={[styles.container, isWide && styles.containerWide]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={appColors.text} />}
    >
      <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Crear recordatorio</Text>
            <Text style={styles.panelSubtitle}>Elige cualquier registro clinico y programa el aviso.</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => void fetchData()}>
            <Ionicons name="refresh-outline" size={18} color={appColors.info} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Persona</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedPatientId}
            onValueChange={(value) => {
              setSelectedPatientId(String(value));
              setSelectedSourceKey('');
            }}
            dropdownIconColor={appColors.text}
            style={styles.picker}
          >
            <Picker.Item label="Todas las personas" value="" />
            {patients.map((patient) => (
              <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Tipo de registro</Text>
        <View style={styles.typeGrid}>
          {SOURCE_DEFINITIONS.map((definition) => {
            const isActive = sourceType === definition.key;
            return (
              <TouchableOpacity
                key={definition.key}
                style={[styles.typeChip, isActive && { borderColor: definition.accent, backgroundColor: colorAlpha(definition.accent, '14') }]}
                onPress={() => handleSourceTypeChange(definition.key)}
              >
                <Ionicons name={definition.icon} size={16} color={isActive ? definition.accent : appColors.textSoft} />
                <Text style={[styles.typeChipText, isActive && { color: definition.accent }]}>{definition.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Registro</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSourceKey}
            onValueChange={(value) => handleSourceSelect(String(value))}
            dropdownIconColor={appColors.text}
            style={styles.picker}
          >
            <Picker.Item
              label={loading ? 'Cargando registros...' : availableSources.length ? 'Selecciona un registro' : 'No hay registros disponibles'}
              value=""
            />
            {availableSources.map((item) => (
              <Picker.Item
                key={`${item.type}:${item.id}`}
                label={`${item.title}${item.date ? ` - ${formatDateTimeLabel(item.date)}` : ''}`}
                value={`${item.type}:${item.id}`}
              />
            ))}
          </Picker>
        </View>

        {selectedSource ? (
          <View style={styles.selectedSourceCard}>
            <View style={[styles.personIcon, { backgroundColor: colorAlpha(selectedSource.accent, '18') }]}>
              <Ionicons name={selectedSource.icon} size={17} color={selectedSource.accent} />
            </View>
            <View style={styles.personTextWrap}>
              <Text style={styles.personName}>{selectedSource.title}</Text>
              <Text style={styles.personSubtext}>
                {selectedPatientName} - {selectedSource.typeLabel}
                {selectedSource.date ? ` - ${formatDateTimeLabel(selectedSource.date)}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>Fecha y hora del aviso</Text>
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
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={appColors.textMuted}
                value={notificationDate}
                onChangeText={setNotificationDate}
              />
              <TextInput
                style={styles.input}
                placeholder="HH:mm"
                placeholderTextColor={appColors.textMuted}
                value={notificationTime}
                onChangeText={setNotificationTime}
              />
            </>
          )}
        </View>

        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Mensaje del recordatorio"
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
              <Ionicons name="add-circle-outline" size={19} color={appColors.text} />
              <Text style={styles.primaryButtonText}>Guardar recordatorio</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.listPanel, isWide && styles.listPanelWide]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Listado</Text>
            <Text style={styles.panelSubtitle}>{sortedReminders.length} recordatorios y notificaciones registradas</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={appColors.info} />
            <Text style={styles.loadingText}>Cargando recordatorios...</Text>
          </View>
        ) : sortedReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={24} color={appColors.textMuted} />
            <Text style={styles.emptyTitle}>No hay recordatorios</Text>
            <Text style={styles.emptyText}>Crea un aviso desde el formulario para que aparezca aqui.</Text>
          </View>
        ) : (
          <View style={styles.list}>{sortedReminders.map(renderReminder)}</View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: appColors.background,
    gap: 16,
  },
  containerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 30,
    paddingTop: 26,
  },
  formPanel: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  formPanelWide: {
    flex: 0.9,
    maxWidth: 560,
  },
  listPanel: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  listPanelWide: {
    flex: 1.1,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  panelTitle: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  panelSubtitle: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
  },
  label: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: appColors.backgroundMuted,
  },
  picker: {
    color: appColors.text,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  typeChipText: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedSourceCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 14,
    padding: 13,
    color: appColors.text,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    fontSize: 14,
  },
  messageInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryButtonText: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    color: appColors.textSoft,
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  emptyTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: appColors.textSoft,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  list: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: 15,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  personRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  personIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personTextWrap: {
    flex: 1,
  },
  personName: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  personSubtext: {
    color: appColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  stateBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colorAlpha(appColors.success, '18'),
  },
  stateBadgeText: {
    color: appColors.success,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  metaBlock: {
    marginTop: 14,
  },
  metaTitle: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  messageCard: {
    marginTop: 14,
    borderRadius: 14,
    padding: 13,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  messageText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.success, '12'),
  },
  footerPillText: {
    color: appColors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  footerId: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: appColors.accent,
    marginTop: 16,
    textAlign: 'center',
  },
});
