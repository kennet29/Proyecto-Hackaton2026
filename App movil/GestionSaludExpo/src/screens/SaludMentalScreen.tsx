/**
 * @file App movil/GestionSaludExpo/src/screens/SaludMentalScreen.tsx
 * @description TypeScript module implementation.
 */

import { RecordActions } from '../components/RecordActions';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { NanoSectionIllustration } from '../components/NanoSectionIllustration';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { AppColors, useAppColors } from '../theme/useAppColors';

type SaludMentalRecord = {
  saludmentalId: number;
  pacienteId: number;
  fecha: string;
  estadoAnimo: number;
  estres: number;
  ansiedad: number;
  horasSueno: number | null;
  notaPersonal: string | null;
  ejercicioMinutos: number | null;
  hidratacionLitros: number | null;
  descansoHoras: number | null;
  tiempoSocialMinutos: number | null;
  pausasDigitales: number | null;
};

type SaludMentalHistorial = {
  pacienteId: number;
  totalRegistros: number;
  historialPorFecha: SaludMentalRecord[];
};

type SaludMentalStats = {
  promedioSemanal?: {
    registros: number;
    estadoAnimo: number | null;
    estres: number | null;
    ansiedad: number | null;
    horasSueno: number | null;
  };
  tendenciaMensual?: Array<{
    mes: string;
    registros: number;
    estadoAnimoPromedio: number | null;
    estresPromedio: number | null;
    ansiedadPromedio: number | null;
    horasSuenoPromedio: number | null;
  }>;
};

type SaludMentalAlerts = {
  totalAlertas: number;
  alertas: Array<{
    tipo: string;
    severidad: 'media' | 'alta';
    fecha: string;
    detalle: string;
  }>;
};

const today = () => toLocalDateOnlyString();

const scoreOptions = [
  { label: '1 - Muy bajo', value: '1' },
  { label: '2 - Bajo', value: '2' },
  { label: '3 - Medio', value: '3' },
  { label: '4 - Alto', value: '4' },
  { label: '5 - Muy alto', value: '5' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseCalendarDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getScoreLabel = (value?: string | number | null) => {
  const normalized = String(value ?? '3');
  return scoreOptions.find((item) => item.value === normalized)?.label ?? '3 - Medio';
};

const getScoreColor = (value?: string | number | null, inverse = false) => {
  const score = Number(value ?? 3);
  if (inverse) {
    if (score >= 4) return '#FF4D73';
    if (score === 3) return '#F9A826';
    return '#38E28E';
  }
  if (score <= 2) return '#FF4D73';
  if (score === 3) return '#F9A826';
  return '#38E28E';
};

type CalmMission = {
  title: string;
  instruction: string;
  durationMinutes: number;
  category: 'respiracion' | 'movimiento' | 'conexion' | 'descanso' | 'entorno';
};

const fallbackCalmMissions: CalmMission[] = [
  { title: 'Respira con Nano', instruction: 'Inhala suavemente durante 4 segundos y exhala durante 6. Repite cinco veces sin forzar la respiración.', durationMinutes: 2, category: 'respiracion' },
  { title: 'Encuentra cinco cosas', instruction: 'Mira a tu alrededor y nombra cinco cosas que ves, cuatro que puedes tocar y tres que puedes escuchar.', durationMinutes: 4, category: 'entorno' },
  { title: 'Conecta con alguien', instruction: 'Envía un mensaje breve a una persona de confianza para contarle cómo te sientes o simplemente saludar.', durationMinutes: 5, category: 'conexion' },
];

const calmMissionIcons: Record<CalmMission['category'], keyof typeof Ionicons.glyphMap> = {
  respiracion: 'leaf-outline',
  movimiento: 'walk-outline',
  conexion: 'people-outline',
  descanso: 'bed-outline',
  entorno: 'eye-outline',
};

type FormValues = {
  pacienteId: string;
  fecha: string;
  estadoAnimo: string;
  estres: string;
  ansiedad: string;
  horasSueno: string;
  ejercicioMinutos: string;
  descansoHoras: string;
  tiempoSocialMinutos: string;
  pausasDigitales: string;
  notaPersonal: string;
};

const numericFieldRules: Array<{
  key: keyof FormValues;
  label: string;
  min: number;
  max: number;
  integer?: boolean;
}> = [
  { key: 'horasSueno', label: 'Horas de sueño', min: 0, max: 24 },
  { key: 'descansoHoras', label: 'Horas de descanso', min: 0, max: 24 },
  { key: 'ejercicioMinutos', label: 'Ejercicio en minutos', min: 0, max: 1440, integer: true },
  { key: 'tiempoSocialMinutos', label: 'Tiempo social en minutos', min: 0, max: 1440, integer: true },
  { key: 'pausasDigitales', label: 'Pausas digitales', min: 0, max: 100, integer: true },
];

const emotionOptions = [
  { id: 'triste', label: 'Triste', emoji: '😢', score: '1', color: '#60A5FA' },
  { id: 'agotado', label: 'Agotado', emoji: '😫', score: '1', color: '#94A3B8' },
  { id: 'preocupado', label: 'Preocupado', emoji: '😟', score: '2', color: '#F59E0B' },
  { id: 'ansioso', label: 'Ansioso', emoji: '😰', score: '2', color: '#FB7185' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', score: '3', color: '#A78BFA' },
  { id: 'calmado', label: 'Calmado', emoji: '😌', score: '4', color: '#2DD4BF' },
  { id: 'esperanzado', label: 'Esperanzado', emoji: '🌤️', score: '4', color: '#38BDF8' },
  { id: 'feliz', label: 'Feliz', emoji: '😊', score: '5', color: '#38E28E' },
  { id: 'motivado', label: 'Motivado', emoji: '💪', score: '5', color: '#22C55E' },
  { id: 'agradecido', label: 'Agradecido', emoji: '💚', score: '5', color: '#10B981' },
] as const;

const validateForm = (form: FormValues) => {
  if (!form.pacienteId) return 'Selecciona un paciente.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha) || !parseCalendarDate(form.fecha)) {
    return 'Fecha: usa el formato AAAA-MM-DD e indica una fecha válida.';
  }

  for (const field of numericFieldRules) {
    const value = form[field.key].trim();
    if (!value) continue;
    const normalized = value.replace(',', '.');
    const number = Number(normalized);
    if (!Number.isFinite(number)) return `${field.label}: escribe un número válido.`;
    if (field.integer && !Number.isInteger(number)) return `${field.label}: debe ser un número entero.`;
    if (number < field.min || number > field.max) {
      return `${field.label}: debe estar entre ${field.min} y ${field.max}.`;
    }
  }
  if (form.notaPersonal.trim().length > 2500) return 'Nota personal: permite un máximo de 2,500 caracteres.';
  return null;
};

const formatValidationDetails = (body: any) => {
  const details = Array.isArray(body?.detalles)
    ? body.detalles
    : Array.isArray(body?.details?.detalles)
      ? body.details.detalles
      : [];
  if (!details.length) return body?.message ?? 'No se pudo guardar el registro.';
  const labels: Record<string, string> = {
    pacienteId: 'Paciente', fecha: 'Fecha', estadoAnimo: 'Ánimo', estres: 'Estrés', ansiedad: 'Ansiedad',
    horasSueno: 'Horas de sueño', descansoHoras: 'Horas de descanso', ejercicioMinutos: 'Ejercicio en minutos',
    tiempoSocialMinutos: 'Tiempo social en minutos',
    pausasDigitales: 'Pausas digitales', notaPersonal: 'Nota personal',
  };
  return details.map((detail: { path?: string; message?: string }) => {
    const field = detail.path?.split('.')[0] ?? '';
    return `${(labels[field] ?? field) || 'Dato'}: ${detail.message ?? 'valor inválido'}`;
  }).join('\n');
};

const formatAlertTitle = (value: string) => {
  const labels: Record<string, string> = {
    estres_alto: 'Estrés alto',
    poco_sueno: 'Descanso insuficiente',
    cambio_fuerte_animo: 'Cambio marcado de ánimo',
  };
  return labels[value] ?? value.replace(/_/g, ' ');
};

export function SaludMentalScreen() {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 480;
  const pickerItemColor = colors.text;
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historial, setHistorial] = useState<SaludMentalHistorial | null>(null);
  const [stats, setStats] = useState<SaludMentalStats | null>(null);
  const [alerts, setAlerts] = useState<SaludMentalAlerts | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [calmMissions, setCalmMissions] = useState<CalmMission[]>([]);
  const [calmIntro, setCalmIntro] = useState('');
  const [calmSafetyNote, setCalmSafetyNote] = useState('');
  const [generatingMissions, setGeneratingMissions] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Set<number>>(new Set());
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: today(),
    estadoAnimo: '3',
    estres: '3',
    ansiedad: '3',
    horasSueno: '',
    ejercicioMinutos: '',
    descansoHoras: '',
    tiempoSocialMinutos: '',
    pausasDigitales: '',
    notaPersonal: '',
  });

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'pacienteId') {
      setSelectedPatientId(value);
    }
  };

  const loadPatients = useCallback(async () => {
    if (!token) {
      setPatients([]);
      setSelectedPatientId('');
      return;
    }

    setLoadingPatients(true);
    setPatientError(null);

    try {
      const items = await fetchLinkedPatients(authHeaders);
      setPatients(items);
      // El paciente debe elegirse de forma explícita; evita registrar datos en otra persona por error.
      setSelectedPatientId((prev) => items.some((item) => String(item.pacienteId) === prev) ? prev : '');
      setForm((prev) => ({
        ...prev,
        pacienteId: items.some((item) => String(item.pacienteId) === prev.pacienteId)
          ? prev.pacienteId
          : '',
      }));
    } catch (error) {
      setPatientError(
        error instanceof Error ? error.message : 'No se pudieron cargar los pacientes',
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const loadData = useCallback(
    async (patientId: string, useRefresh = false) => {
      if (!patientId || !token) {
        setHistorial(null);
        setStats(null);
        setAlerts(null);
        return;
      }

      if (useRefresh) {
        setRefreshing(true);
      } else {
        setLoadingData(true);
      }
      setDataError(null);

      try {
        const historialResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/historial`,
          { headers: authHeaders },
        );
        const historialBody = await historialResponse.json().catch(() => null);
        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }
        setHistorial(historialBody);

        const statsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/estadisticas`,
          { headers: authHeaders },
        );
        const statsBody = await statsResponse.json().catch(() => null);
        setStats(statsResponse.ok ? statsBody : null);

        const alertsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/alertas`,
          { headers: authHeaders },
        );
        const alertsBody = await alertsResponse.json().catch(() => null);
        setAlerts(alertsResponse.ok ? alertsBody : null);
      } catch (error) {
        setDataError(
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del modulo',
        );
      } finally {
        if (useRefresh) {
          setRefreshing(false);
        } else {
          setLoadingData(false);
        }
      }
    },
    [authHeaders, token],
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      loadData(selectedPatientId);
    }
  }, [loadData, selectedPatientId]);

  const handleSubmit = async () => {
    const validationMessage = validateForm(form);
    if (validationMessage) {
      Alert.alert('Revisa el registro', validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
          pacienteId: Number(form.pacienteId),
          fecha: form.fecha,
          estadoAnimo: Number(form.estadoAnimo),
          estres: Number(form.estres),
          ansiedad: Number(form.ansiedad),
          horasSueno: form.horasSueno ? Number(form.horasSueno.replace(',', '.')) : undefined,
          ejercicioMinutos: form.ejercicioMinutos ? Number(form.ejercicioMinutos.replace(',', '.')) : undefined,
          descansoHoras: form.descansoHoras ? Number(form.descansoHoras.replace(',', '.')) : undefined,
          tiempoSocialMinutos: form.tiempoSocialMinutos
            ? Number(form.tiempoSocialMinutos.replace(',', '.'))
            : undefined,
          pausasDigitales: form.pausasDigitales ? Number(form.pausasDigitales.replace(',', '.')) : undefined,
          notaPersonal: form.notaPersonal || undefined,
          creadoPor: user?.username ?? undefined,
        };
      const result = await submitJsonWithOfflineFallback({ token, path: '/salud-mental', method: 'POST', body: payload, description: 'registrar salud mental' });
      if (result.status === 'queued') Alert.alert('Guardado sin conexión', 'El registro se sincronizará automáticamente al recuperar internet.');

      if (result.status === 'online') Alert.alert('Registro creado', 'La entrada de salud mental se guardó correctamente');
      setForm((prev) => ({
        ...prev,
        fecha: today(),
        estadoAnimo: '3',
        estres: '3',
        ansiedad: '3',
        horasSueno: '',
        ejercicioMinutos: '',
        descansoHoras: '',
        tiempoSocialMinutos: '',
        pausasDigitales: '',
        notaPersonal: '',
      }));
      setSelectedEmotion('neutral');
      setShowForm(false);
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const statsSummary = useMemo(() => {
    const weekly = stats?.promedioSemanal ?? null;
    const monthly = Array.isArray(stats?.tendenciaMensual)
      ? stats.tendenciaMensual[stats.tendenciaMensual.length - 1]
      : null;
    return { weekly, monthly };
  }, [stats]);

  const latestRecord = historial?.historialPorFecha?.[0] ?? null;

  const generateCalmMissions = async () => {
    const selectedEmotionLabel = emotionOptions.find((item) => item.id === selectedEmotion)?.label;
    setGeneratingMissions(true);
    setCompletedMissions(new Set());
    try {
      if (!token) throw new Error('Inicia sesión para generar misiones personalizadas.');
      const response = await fetch(`${API_URL}/nano/calm-missions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emotion: selectedEmotionLabel,
          stressLevel: Number(form.estres),
          anxietyLevel: Number(form.ansiedad),
          context: form.notaPersonal.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        intro?: string;
        missions?: CalmMission[];
        safetyNote?: string;
        message?: string;
      } | null;
      const validMissions = payload?.missions?.filter((mission) =>
        mission &&
        typeof mission.title === 'string' &&
        typeof mission.instruction === 'string' &&
        Number.isFinite(mission.durationMinutes) &&
        mission.category in calmMissionIcons,
      );
      if (!response.ok || validMissions?.length !== 3) {
        throw new Error(payload?.message || 'Nano no pudo crear las misiones en este momento.');
      }
      setCalmMissions(validMissions);
      setCalmIntro(payload?.intro || 'Nano preparó tres pasos pequeños para acompañarte.');
      setCalmSafetyNote(payload?.safetyNote || 'Estas misiones apoyan tu bienestar, pero no reemplazan atención profesional.');
    } catch (error) {
      setCalmMissions(fallbackCalmMissions);
      setCalmIntro('Mientras recuperamos la conexión con Nano, prueba estas tres misiones seguras.');
      setCalmSafetyNote('Si sientes que estás en peligro o podrías hacerte daño, busca ayuda de emergencia y contacta ahora a una persona de confianza.');
      Alert.alert('Misiones locales de Nano', error instanceof Error ? error.message : 'Se mostrarán actividades disponibles sin conexión.');
    } finally {
      setGeneratingMissions(false);
    }
  };

  const toggleCalmMission = (index: number) => {
    setCompletedMissions((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderScoreControl = (field: 'estadoAnimo' | 'estres' | 'ansiedad') => {
    if (isCompact) {
      return (
        <View style={styles.mobileScoreOptions}>
          {scoreOptions.map((item) => {
            const selected = form[field] === item.value;
            return (
              <TouchableOpacity
                key={`${field}-${item.value}`}
                style={[styles.mobileScoreOption, selected && styles.mobileScoreOptionSelected]}
                onPress={() => {
                  if (field === 'estadoAnimo') setSelectedEmotion('');
                  handleChange(field, item.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
              >
                <AppText style={[styles.mobileScoreValue, selected && styles.mobileScoreValueSelected]}>
                  {item.value}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return (
      <View style={[styles.pickerWrapper, styles.halfInput]}>
        <Picker
          selectedValue={form[field]}
          onValueChange={(value) => {
            if (field === 'estadoAnimo') setSelectedEmotion('');
            handleChange(field, String(value));
          }}
          style={styles.picker}
          dropdownIconColor={colors.text}
          mode="dropdown"
        >
          {scoreOptions.map((item) => (
            <Picker.Item key={`${field}-${item.value}`} label={item.label} value={item.value} color={pickerItemColor} />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(selectedPatientId, true)}
          tintColor={colors.text}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <NanoSectionIllustration section="salud-mental" size={62} />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.heroEyebrow}>BIENESTAR EMOCIONAL</AppText>
          <AppText style={styles.heroTitle}>Salud mental</AppText>
          <AppText style={styles.heroText}>
            Estado de ánimo, descanso y hábitos diarios en una sola vista.
          </AppText>
        </View>
        <TouchableOpacity style={styles.heroAction} onPress={() => setShowForm((current) => !current)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color={colors.onAccent} />
          <AppText style={styles.heroActionText}>{showForm ? 'Cerrar' : 'Nuevo registro'}</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.patientSelectorCard}>
        <View style={styles.patientSelectorIcon}>
          <Ionicons name="person-outline" size={20} color="#A78BFA" />
        </View>
        <View style={styles.patientSelectorCopy}>
          <AppText style={styles.fieldEyebrow}>PACIENTE</AppText>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.success} />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : patients.length === 0 ? (
          <AppText style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</AppText>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
              style={styles.picker}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Selecciona un paciente" value="" color={colors.textSoft} />
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={
                    patient.parentesco
                      ? `${patient.displayName} - ${patient.parentesco}`
                      : patient.displayName
                  }
                  value={String(patient.pacienteId)}
                  color={pickerItemColor}
                />
              ))}
            </Picker>
          </View>
        )}
        {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.formToggle}
          onPress={() => setShowForm((current) => !current)}
          activeOpacity={0.82}
        >
          <View style={styles.formToggleIcon}>
            <Ionicons name="create-outline" size={20} color="#A78BFA" />
          </View>
          <View style={styles.formToggleCopy}>
            <AppText style={styles.sectionTitle}>Nuevo registro diario</AppText>
            <AppText style={styles.sectionSubtitle}>
              Añade contexto emocional, descanso y hábitos.
            </AppText>
          </View>
          <Ionicons
            name={showForm ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showForm ? (
          <>
        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Fecha</AppText>
          <AppText style={styles.fieldLabel}>Día del registro</AppText>
          <AppTextInput
            style={styles.input}
            value={form.fecha}
            onChangeText={(value) => handleChange('fecha', value)}
            placeholderTextColor={colors.textMuted}
            placeholder="Fecha (YYYY-MM-DD)"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>¿Cómo te sientes hoy?</AppText>
          <AppText style={styles.scaleHint}>
            Elige la emoción que mejor representa este momento. Nano ajustará automáticamente el nivel de ánimo.
          </AppText>
          <View style={styles.emotionGrid}>
            {emotionOptions.map((emotion) => {
              const selected = selectedEmotion === emotion.id;
              return (
                <TouchableOpacity
                  key={emotion.id}
                  style={[
                    styles.emotionCard,
                    selected && {
                      borderColor: emotion.color,
                      backgroundColor: `${emotion.color}18`,
                    },
                  ]}
                  onPress={() => {
                    setSelectedEmotion(emotion.id);
                    handleChange('estadoAnimo', emotion.score);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Me siento ${emotion.label}`}
                >
                  <View style={styles.emotionNano}>
                    <NanoSectionIllustration section="salud-mental" size={48} />
                    <View style={[styles.emotionBadge, { backgroundColor: emotion.color }]}>
                      <AppText style={styles.emotionEmoji}>{emotion.emoji}</AppText>
                    </View>
                  </View>
                  <AppText style={[styles.emotionLabel, selected && { color: emotion.color }]}>
                    {emotion.label}
                  </AppText>
                  <AppText style={styles.emotionScore}>Ánimo {emotion.score}/5</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.importanceNote}>
            <Ionicons name="heart-circle-outline" size={20} color="#A78BFA" />
            <AppText style={styles.importanceText}>
              Importante: ninguna emoción es incorrecta. Registrarla ayuda a reconocer cambios y pedir apoyo a tiempo.
            </AppText>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Estado emocional</AppText>
          <AppText style={styles.scaleHint}>
            Usa la escala del 1 al 5 para registrar cómo se sintió la persona hoy.
          </AppText>
          <View style={[styles.row, isCompact && styles.compactRow]}>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <View style={styles.fieldLabelRow}>
                <AppText style={styles.fieldLabel}>Ánimo</AppText>
                <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.estadoAnimo) }]}>
                  <AppText style={styles.scorePillText}>{getScoreLabel(form.estadoAnimo)}</AppText>
                </View>
              </View>
              {renderScoreControl('estadoAnimo')}
            </View>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <View style={styles.fieldLabelRow}>
                <AppText style={styles.fieldLabel}>Estrés</AppText>
                <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.estres, true) }]}>
                  <AppText style={styles.scorePillText}>{getScoreLabel(form.estres)}</AppText>
                </View>
              </View>
              {renderScoreControl('estres')}
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <AppText style={styles.fieldLabel}>Ansiedad</AppText>
              <View style={[styles.scorePill, { backgroundColor: getScoreColor(form.ansiedad, true) }]}>
                <AppText style={styles.scorePillText}>{getScoreLabel(form.ansiedad)}</AppText>
              </View>
            </View>
            {renderScoreControl('ansiedad')}
          </View>
        </View>

        <View style={[styles.calmCard, Number(form.estres) >= 4 && styles.calmCardHighStress]}>
          <View style={styles.calmHeader}>
            <NanoSectionIllustration section="salud-mental" size={68} />
            <View style={styles.calmHeaderCopy}>
              <AppText style={styles.calmEyebrow}>NANO CALMA</AppText>
              <AppText style={styles.calmTitle}>Pequeñas misiones para este momento</AppText>
              <AppText style={styles.calmSubtitle}>
                {Number(form.estres) >= 4
                  ? 'Tu estrés está alto. Hagamos algo pequeño, sin presión.'
                  : 'Nano puede proponerte tres acciones breves según cómo te sientes.'}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.calmButton, generatingMissions && styles.disabledBtn]}
            onPress={() => void generateCalmMissions()}
            disabled={generatingMissions}
            accessibilityRole="button"
            accessibilityLabel="Generar misiones de calma con Nano"
          >
            {generatingMissions
              ? <ActivityIndicator color="#FFFFFF" />
              : <Ionicons name="sparkles" size={19} color="#FFFFFF" />}
            <AppText style={styles.calmButtonText}>
              {generatingMissions ? 'Nano está preparando tus misiones...' : calmMissions.length ? 'Crear otras misiones' : 'Crear misiones con Nano'}
            </AppText>
          </TouchableOpacity>

          {calmMissions.length ? (
            <View style={styles.calmMissionList}>
              <AppText style={styles.calmIntro}>{calmIntro}</AppText>
              {calmMissions.map((mission, index) => {
                const completed = completedMissions.has(index);
                return (
                  <TouchableOpacity
                    key={`${mission.title}-${index}`}
                    style={[styles.calmMission, completed && styles.calmMissionCompleted]}
                    onPress={() => toggleCalmMission(index)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: completed }}
                  >
                    <View style={styles.calmMissionIcon}>
                      <Ionicons name={calmMissionIcons[mission.category]} size={20} color="#7C3AED" />
                    </View>
                    <View style={styles.calmMissionCopy}>
                      <View style={styles.calmMissionTitleRow}>
                        <AppText style={[styles.calmMissionTitle, completed && styles.calmMissionTitleCompleted]}>{mission.title}</AppText>
                        <AppText style={styles.calmDuration}>{mission.durationMinutes} min</AppText>
                      </View>
                      <AppText style={[styles.calmMissionText, completed && styles.calmMissionTextCompleted]}>{mission.instruction}</AppText>
                    </View>
                    <Ionicons name={completed ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={completed ? colors.success : colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
              <View style={styles.calmSafety}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.info} />
                <AppText style={styles.calmSafetyText}>{calmSafetyNote}</AppText>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Sueño y descanso</AppText>
          <View style={[styles.row, isCompact && styles.compactRow]}>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <AppText style={styles.fieldLabel}>Horas de sueño</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.horasSueno}
                onChangeText={(value) => handleChange('horasSueno', value)}
                placeholderTextColor={colors.textMuted}
                placeholder="Ej. 7.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <AppText style={styles.fieldLabel}>Horas de descanso</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.descansoHoras}
                onChangeText={(value) => handleChange('descansoHoras', value)}
                placeholderTextColor={colors.textMuted}
                placeholder="Ej. 2"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Hábitos del día</AppText>
          <View style={[styles.row, isCompact && styles.compactRow]}>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <AppText style={styles.fieldLabel}>Ejercicio en minutos</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.ejercicioMinutos}
                onChangeText={(value) => handleChange('ejercicioMinutos', value)}
                placeholderTextColor={colors.textMuted}
                placeholder="Ej. 30"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroupHalf, isCompact && styles.compactField]}>
              <AppText style={styles.fieldLabel}>Tiempo social en minutos</AppText>
              <AppTextInput
                style={[styles.input, styles.halfInput]}
                value={form.tiempoSocialMinutos}
                onChangeText={(value) => handleChange('tiempoSocialMinutos', value)}
                placeholderTextColor={colors.textMuted}
                placeholder="Ej. 45"
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Pausas digitales</AppText>
              <AppTextInput
                style={styles.input}
                value={form.pausasDigitales}
                onChangeText={(value) => handleChange('pausasDigitales', value)}
                placeholderTextColor={colors.textMuted}
                placeholder="Cantidad"
                keyboardType="numeric"
              />
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Reflexión personal</AppText>
          <AppText style={styles.fieldLabel}>Nota personal</AppText>
          <AppTextInput
            style={[styles.input, styles.textArea]}
            value={form.notaPersonal}
            onChangeText={(value) => handleChange('notaPersonal', value)}
            placeholderTextColor={colors.textMuted}
            placeholder="Escribe observaciones, detonantes o algo importante del día"
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <AppText style={styles.primaryBtnText}>Guardar registro</AppText>
          )}
        </TouchableOpacity>
          </>
        ) : (
          <View style={styles.formCollapsedHint}>
            <Ionicons name="information-circle-outline" size={17} color={colors.textMuted} />
            <AppText style={styles.formCollapsedText}>
              Abre esta sección cuando quieras registrar cómo se siente el paciente.
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.summaryHeading}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Panorama emocional</AppText>
            <AppText style={styles.sectionSubtitle}>Lectura rápida del seguimiento actual.</AppText>
          </View>
          <View style={styles.recordBadge}>
            <AppText style={styles.recordBadgeValue}>{historial?.totalRegistros ?? 0}</AppText>
            <AppText style={styles.recordBadgeLabel}>registros</AppText>
          </View>
        </View>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.success} />
            <AppText style={styles.loadingText}>Cargando estadísticas...</AppText>
          </View>
        ) : (
          <>
            {latestRecord ? (
              <View style={styles.latestRecordBox}>
                <View style={styles.latestRecordHeader}>
                  <View>
                    <AppText style={styles.latestRecordEyebrow}>ÚLTIMO REGISTRO</AppText>
                    <AppText style={styles.latestRecordTitle}>{formatDate(latestRecord.fecha)}</AppText>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#A78BFA" />
                </View>
                <View style={styles.mentalMetricGrid}>
                  <MentalMetric label="Ánimo" value={latestRecord.estadoAnimo} color={getScoreColor(latestRecord.estadoAnimo)} />
                  <MentalMetric label="Estrés" value={latestRecord.estres} color={getScoreColor(latestRecord.estres, true)} />
                  <MentalMetric label="Ansiedad" value={latestRecord.ansiedad} color={getScoreColor(latestRecord.ansiedad, true)} />
                  <MentalMetric label="Sueño" value={latestRecord.horasSueno ?? 'N/D'} suffix={latestRecord.horasSueno !== null ? ' h' : ''} color={colors.info} />
                </View>
              </View>
            ) : null}

            {statsSummary.weekly ? (
              <>
                <AppText style={styles.subsectionTitle}>Promedio de los últimos 7 días</AppText>
                <View style={styles.mentalMetricGrid}>
                  <MentalMetric label="Ánimo" value={statsSummary.weekly.estadoAnimo ?? 'N/D'} color={getScoreColor(statsSummary.weekly.estadoAnimo)} />
                  <MentalMetric label="Estrés" value={statsSummary.weekly.estres ?? 'N/D'} color={getScoreColor(statsSummary.weekly.estres, true)} />
                  <MentalMetric label="Ansiedad" value={statsSummary.weekly.ansiedad ?? 'N/D'} color={getScoreColor(statsSummary.weekly.ansiedad, true)} />
                  <MentalMetric label="Sueño" value={statsSummary.weekly.horasSueno ?? 'N/D'} suffix={statsSummary.weekly.horasSueno !== null ? ' h' : ''} color={colors.info} />
                </View>
              </>
            ) : null}

            {statsSummary.monthly ? (
              <View style={styles.monthlyBox}>
                <Ionicons name="trending-up-outline" size={20} color={colors.success} />
                <View style={styles.monthlyCopy}>
                  <AppText style={styles.monthlyTitle}>Tendencia de {statsSummary.monthly.mes}</AppText>
                  <AppText style={styles.monthlyText}>
                    {statsSummary.monthly.registros} registros · ánimo {statsSummary.monthly.estadoAnimoPromedio ?? 'N/D'} · estrés {statsSummary.monthly.estresPromedio ?? 'N/D'} · ansiedad {statsSummary.monthly.ansiedadPromedio ?? 'N/D'}
                  </AppText>
                </View>
              </View>
            ) : null}

            {dataError ? <AppText style={styles.errorText}>{dataError}</AppText> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Alertas</AppText>
          <AppText style={styles.sectionSubtitle}>Mensajes que merecen seguimiento cercano.</AppText>
        </View>
        {alerts?.alertas?.length ? (
          alerts.alertas.map((item, index) => (
            <View
              key={`${item.tipo}-${item.fecha}-${index}`}
              style={[
                styles.alertItem,
                item.severidad === 'alta' ? styles.alertHigh : styles.alertMedium,
              ]}
            >
              <View style={styles.alertIcon}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={item.severidad === 'alta' ? colors.accent : '#F9A826'}
                />
              </View>
              <View style={styles.alertCopy}>
                <View style={styles.alertHeader}>
                  <AppText style={styles.alertTitle}>
                    {formatAlertTitle(item.tipo)}
                  </AppText>
                  <AppText style={styles.alertDate}>{formatDate(item.fecha)}</AppText>
                </View>
                <AppText style={styles.alertText}>{item.detalle}</AppText>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.healthyState}>
            <Ionicons name="checkmark-circle-outline" size={23} color={colors.success} />
            <AppText style={styles.healthyText}>No hay alertas que requieran atención por ahora.</AppText>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Historial reciente</AppText>
          <AppText style={styles.sectionSubtitle}>Últimas entradas registradas para este paciente.</AppText>
        </View>
        {historial?.historialPorFecha?.length ? (
          historial.historialPorFecha.slice(0, 6).map((item) => (
<View key={item.saludmentalId} style={styles.listItem}>
<RecordActions resource="salud-mental" recordId={item.saludmentalId} onChanged={() => loadData(selectedPatientId, true)} />
              <AppText style={styles.itemTitle}>{formatDate(item.fecha)}</AppText>
              <View style={styles.historyScoreRow}>
                <HistoryScore label="Ánimo" value={item.estadoAnimo} color={getScoreColor(item.estadoAnimo)} />
                <HistoryScore label="Estrés" value={item.estres} color={getScoreColor(item.estres, true)} />
                <HistoryScore label="Ansiedad" value={item.ansiedad} color={getScoreColor(item.ansiedad, true)} />
              </View>
              <AppText style={styles.itemText}>
                Sueño: {item.horasSueno ?? 'N/D'} h · Descanso: {item.descansoHoras ?? 'N/D'} h
              </AppText>
              <AppText style={styles.itemText}>Ejercicio: {item.ejercicioMinutos ?? 'N/D'} min</AppText>
              <AppText style={styles.itemText}>
                Tiempo social: {item.tiempoSocialMinutos ?? 'N/D'} min · Pausas digitales: {item.pausasDigitales ?? 'N/D'}
              </AppText>
              {item.notaPersonal ? (
                <AppText style={styles.itemText}>Nota: {item.notaPersonal}</AppText>
              ) : null}
            </View>
          ))
        ) : (
          <AppText style={styles.emptyText}>Todavía no hay registros para este paciente.</AppText>
        )}
      </View>
    </ScrollView>
  );
}

function MentalMetric({
  label,
  value,
  suffix = '',
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.mentalMetric}>
      <View style={[styles.mentalMetricAccent, { backgroundColor: color }]} />
      <AppText style={styles.mentalMetricValue}>{String(value)}{suffix}</AppText>
      <AppText style={styles.mentalMetricLabel}>{label}</AppText>
    </View>
  );
}

function HistoryScore({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.historyScore, { borderColor: `${color}55`, backgroundColor: `${color}12` }]}>
      <AppText style={[styles.historyScoreValue, { color }]}>{value}</AppText>
      <AppText style={styles.historyScoreLabel}>{label}</AppText>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 42,
    backgroundColor: colors.surface,
    gap: 16,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    minHeight: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.surfaceStrong,
  },
  hero: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#A78BFA18',
    borderWidth: 1,
    borderColor: '#A78BFA55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
  },
  heroEyebrow: {
    color: '#A78BFA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  heroText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  heroAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  heroActionText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '900',
  },
  patientSelectorCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientSelectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#A78BFA18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientSelectorCopy: {
    flex: 1,
    minWidth: 0,
  },
  fieldEyebrow: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  emotionCard: {
    minWidth: 96,
    flexBasis: '28%',
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  emotionNano: {
    position: 'relative',
    marginBottom: 2,
  },
  emotionBadge: {
    position: 'absolute',
    right: -7,
    bottom: -3,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  emotionEmoji: {
    fontSize: 13,
    lineHeight: 17,
  },
  emotionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  emotionScore: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  importanceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 13,
    padding: 11,
    backgroundColor: '#A78BFA14',
    borderWidth: 1,
    borderColor: '#A78BFA3D',
  },
  importanceText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  calmCard: {
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    backgroundColor: '#F5F3FF',
    gap: 13,
  },
  calmCardHighStress: {
    borderColor: '#A78BFA',
    borderWidth: 2,
  },
  calmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calmHeaderCopy: {
    flex: 1,
  },
  calmEyebrow: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  calmTitle: {
    color: '#25114D',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  calmSubtitle: {
    color: '#5B4A78',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  calmButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  calmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  calmMissionList: {
    gap: 9,
  },
  calmIntro: {
    color: '#4C376E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  calmMission: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  calmMissionCompleted: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  calmMissionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmMissionCopy: {
    flex: 1,
  },
  calmMissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calmMissionTitle: {
    flex: 1,
    color: '#25114D',
    fontSize: 13,
    fontWeight: '900',
  },
  calmMissionTitleCompleted: {
    color: '#15803D',
  },
  calmDuration: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '900',
  },
  calmMissionText: {
    color: '#5B4A78',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  calmMissionTextCompleted: {
    color: '#4B7A5C',
  },
  calmSafety: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#EAF3FF',
  },
  calmSafetyText: {
    flex: 1,
    color: '#315271',
    fontSize: 11,
    lineHeight: 16,
  },
  formSectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  formToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  formToggleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#A78BFA18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formToggleCopy: {
    flex: 1,
  },
  formCollapsedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 12,
  },
  formCollapsedText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  scaleHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldGroupHalf: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scorePillText: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
  },
  pickerWrapper: {
    minHeight: 48,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 110,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  compactRow: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 16,
  },
  compactField: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    width: '100%',
  },
  halfInput: {
    width: '100%',
  },
  mobileScoreOptions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  mobileScoreOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileScoreOptionSelected: {
    backgroundColor: '#A78BFA',
    borderColor: '#A78BFA',
  },
  mobileScoreValue: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  mobileScoreValueSelected: {
    color: colors.onAccent,
  },
  primaryBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSoft,
    marginTop: 8,
  },
  emptyText: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  errorText: {
    color: colors.accent,
    lineHeight: 20,
  },
  latestRecordBox: {
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  latestRecordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  latestRecordEyebrow: {
    color: '#A78BFA',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  latestRecordTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordBadge: {
    minWidth: 64,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  recordBadgeValue: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
  },
  recordBadgeLabel: {
    color: colors.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subsectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  mentalMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  mentalMetric: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 120,
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 11,
  },
  mentalMetricAccent: {
    width: 22,
    height: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  mentalMetricValue: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900',
  },
  mentalMetricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  monthlyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${colors.success}0D`,
    borderWidth: 1,
    borderColor: `${colors.success}45`,
    borderRadius: 15,
    padding: 13,
  },
  monthlyCopy: {
    flex: 1,
  },
  monthlyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  monthlyText: {
    color: colors.textSoft,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
  },
  alertHigh: {
    borderColor: `${colors.accent}55`,
    backgroundColor: `${colors.accent}12`,
  },
  alertMedium: {
    borderColor: '#F9A82655',
    backgroundColor: '#F9A82612',
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCopy: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  alertDate: {
    color: colors.textMuted,
    fontSize: 10,
  },
  alertText: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  healthyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: `${colors.success}0D`,
    borderWidth: 1,
    borderColor: `${colors.success}45`,
    borderRadius: 14,
    padding: 13,
  },
  healthyText: {
    color: colors.textSoft,
    fontSize: 12,
    flex: 1,
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    backgroundColor: colors.background,
  },
  historyScoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginVertical: 3,
  },
  historyScore: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  historyScoreValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  historyScoreLabel: {
    color: colors.textSoft,
    fontSize: 10,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  itemText: {
    color: colors.textSoft,
    lineHeight: 19,
  },
});
