import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import {
  readClinicalSummaryCache,
  writeClinicalSummaryCache,
} from '../utils/clinicalSummaryCache';
import { appColors, colorAlpha } from '../theme/colors';
import { parseCalendarDate } from '../utils/localDate';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteResumen'>;

type ClinicalSummary = {
  generatedAt: string;
  patient: {
    pacienteId: number;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    email: string | null;
    sexo: string | null;
    fechaNacimiento: string | null;
    edadAproximada: number | null;
  };
  overview: {
    totalConsultas: number;
    ultimaConsulta: string | null;
    citasPendientes: number;
    vacunasAplicadas: number;
    medicacionesActivas: number;
    recordatoriosPendientes: number;
    alergiasActivas: number;
    condicionesActivas: number;
    examenesClinicos: number;
    seguimientosActivos: number;
  };
  alerts: Array<{
    level: 'high' | 'medium' | 'info';
    title: string;
    detail: string;
  }>;
  activeTreatments: Array<{
    medicacionId: number;
    nombre: string;
    dosis: string | null;
    viaAdministracion: string | null;
    fechaInicio: string;
    fechaFin: string | null;
    indicaciones: string | null;
  }>;
  upcoming: {
    nextAppointment: {
      citaId: number;
      fecha: string;
      especialidad: string | null;
      motivo: string | null;
      estado: string;
    } | null;
    nextFollowUp: string | null;
  };
  clinicalDetails?: {
    latestWeight: {
      value: number;
      date: string;
    } | null;
    lifestyle: {
      date: string;
      alimentacion: string | null;
      actividadFisica: string | null;
      consumoAlcohol: string | null;
      consumoTabaco: string | null;
      horasSueno: number | null;
      estres: string | null;
    } | null;
    habits: Array<{
      habitoId: number;
      categoria: string | null;
      nivel: string | null;
      frecuencia: string | null;
      cantidad: number | null;
      unidad: string | null;
      impactoSalud: string | null;
    }>;
    activeConditions: Array<{
      condicionId: number;
      nombre: string;
      severidad: string | null;
      tratamiento: string | null;
      fechaDiagnostico: string | null;
    }>;
    recentInjuries: Array<{
      lesionId: number;
      tipo: string;
      parteCuerpo: string | null;
      severidad: string | null;
      recuperado: boolean;
      fecha: string;
    }>;
    recentOperations: Array<{
      operacionId: number;
      tipo: string;
      estado: string;
      hospital: string | null;
      fecha: string;
    }>;
    mentalHealth: {
      latest: {
        date: string;
        mood: number;
        stress: number;
        anxiety: number;
        sleepHours: number | null;
      };
      recentRecords: number;
      averageMood: number;
      averageStress: number;
      averageAnxiety: number;
    } | null;
  };
  recentTimeline: Array<{
    type: string;
    title: string;
    date: string;
    detail: string;
  }>;
  carePointers: string[];
};

type ClinicalHistoryEvent = {
  type: string;
  title: string;
  date: string;
  fields: Array<{
    key: string;
    value: unknown;
  }>;
};

type Metric = {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

type ClinicalArea = {
  title: string;
  subtitle: string;
  route: keyof RootStackParamList;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin registro';
  const parsed = parseCalendarDate(value);
  if (!parsed) return String(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin registro';
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

const buildFullName = (summary?: ClinicalSummary | null, fallback?: string) => {
  if (!summary?.patient) return fallback || 'Paciente';
  return (
    `${summary.patient.nombres} ${summary.patient.apellidos}`.trim() ||
    fallback ||
    'Paciente'
  );
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';

const isMaleSex = (value?: string | null) => {
  const normalized = value
    ?.trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return ['m', 'masculino', 'hombre', 'varon'].includes(normalized ?? '');
};

const formatGender = (value?: string | null) => {
  const normalized = value
    ?.trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['m', 'masculino', 'hombre', 'varon'].includes(normalized ?? '')) {
    return 'Masculino';
  }
  if (['f', 'femenino', 'mujer'].includes(normalized ?? '')) {
    return 'Femenino';
  }
  if (!value?.trim()) return null;
  return `${value.trim().charAt(0).toLocaleUpperCase('es')}${value.trim().slice(1).toLocaleLowerCase('es')}`;
};

const historyFieldLabels: Record<string, string> = {
  alergiaId: 'Identificador de alergia', antecedenteId: 'Identificador de antecedente',
  citaId: 'Identificador de cita', condicioncronicaId: 'Identificador de condición',
  consultaId: 'Identificador de consulta', desparasitacionId: 'Identificador de desparasitación',
  documentoId: 'Identificador de documento', embarazoId: 'Identificador de embarazo',
  estilovidaId: 'Identificador de estilo de vida', evaluacionId: 'Identificador de evaluación',
  examenclinicoId: 'Identificador de examen', habitoId: 'Identificador de hábito',
  lesionId: 'Identificador de lesión', medicacionId: 'Identificador de medicación',
  operacionId: 'Identificador de operación', periodoId: 'Identificador de periodo',
  puntajeriesgoId: 'Identificador de puntaje', recordatoriocitaId: 'Identificador de recordatorio',
  registrodentalId: 'Identificador de registro dental', registromensualId: 'Identificador de registro menstrual',
  saludmentalId: 'Identificador de salud mental', seguimientoFisicoId: 'Identificador de seguimiento físico',
  seguimientoPosteventoId: 'Identificador de seguimiento', vacunaId: 'Identificador de vacuna',
  tipocondicionId: 'Tipo de condición', tipohabitoId: 'Tipo de hábito', tipolesionId: 'Tipo de lesión',
  tipooperacionId: 'Tipo de operación', tipodocumentoId: 'Tipo de documento', tipovacunaId: 'Tipo de vacuna',
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const humanizeHistoryKey = (key: string) => {
  if (historyFieldLabels[key]) return historyFieldLabels[key];
  const spaced = key
    .replace(/([a-záéíóúñ])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return spaced ? `${spaced.charAt(0).toLocaleUpperCase('es')}${spaced.slice(1).toLocaleLowerCase('es')}` : key;
};

const formatHistoryValue = (key: string, value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Sin registro';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (/(fecha|inicio|fin|control|intento)/i.test(key) && (typeof value === 'string' || value instanceof Date)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('es-NI', {
        year: 'numeric', month: 'long', day: 'numeric',
        ...(String(value).includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
      });
    }
  }
  if (typeof value === 'number') return value.toLocaleString('es-NI');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const buildClinicalHistoryPdfHtml = (
  summary: ClinicalSummary,
  patientName: string,
  history: ClinicalHistoryEvent[],
) => {
  const events = history.length
    ? history.map((event, index) => {
        const fieldRows = event.fields.map((field) => `
          <tr>
            <th>${escapeHtml(humanizeHistoryKey(field.key))}</th>
            <td>${escapeHtml(formatHistoryValue(field.key, field.value))}</td>
          </tr>`).join('');
        return `
          <section class="event">
            <div class="event-head">
              <div class="number">${index + 1}</div>
              <div class="event-copy">
                <div class="type">${escapeHtml(event.type)}</div>
                <h2>${escapeHtml(event.title)}</h2>
              </div>
              <time>${escapeHtml(formatDateTime(event.date))}</time>
            </div>
            <table><tbody>${fieldRows}</tbody></table>
          </section>`;
      }).join('')
    : '<div class="empty">No hay eventos clínicos registrados para este paciente.</div>';

  return `<!DOCTYPE html>
  <html lang="es"><head><meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 18mm 14mm 20mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.45; }
      .cover { border-bottom: 3px solid #2f80ed; margin-bottom: 18px; padding-bottom: 15px; }
      .eyebrow { color: #2f80ed; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
      h1 { color: #101828; font-size: 25px; margin: 4px 0 13px; }
      .patient { background: #f4f7fb; border: 1px solid #dbe4ef; border-radius: 9px; padding: 12px 14px; }
      .patient-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
      .meta { display: flex; flex-wrap: wrap; gap: 5px 22px; color: #475467; }
      .meta strong { color: #172033; }
      .intro { color: #475467; margin: 12px 0 0; }
      .event { border: 1px solid #dbe4ef; border-radius: 9px; margin: 0 0 13px; overflow: hidden; page-break-inside: avoid; }
      .event-head { align-items: center; background: #f8fafc; border-bottom: 1px solid #dbe4ef; display: flex; padding: 10px 12px; }
      .number { align-items: center; background: #2f80ed; border-radius: 50%; color: white; display: flex; font-size: 9px; font-weight: 700; height: 23px; justify-content: center; margin-right: 9px; min-width: 23px; }
      .event-copy { flex: 1; }
      .type { color: #2f80ed; font-size: 8px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
      h2 { color: #172033; font-size: 13px; margin: 1px 0 0; }
      time { color: #667085; font-size: 9px; margin-left: 12px; text-align: right; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border-bottom: 1px solid #edf1f5; padding: 6px 10px; text-align: left; vertical-align: top; }
      tr:last-child th, tr:last-child td { border-bottom: 0; }
      th { color: #475467; font-size: 9px; font-weight: 700; width: 35%; }
      td { color: #172033; overflow-wrap: anywhere; white-space: pre-wrap; }
      .empty { background: #f8fafc; border: 1px solid #dbe4ef; border-radius: 9px; color: #667085; padding: 24px; text-align: center; }
      .footer { bottom: 5mm; color: #98a2b3; font-size: 8px; left: 14mm; position: fixed; right: 14mm; text-align: center; }
      .footer::after { content: " · Página " counter(page); }
    </style>
  </head><body>
    <header class="cover">
      <div class="eyebrow">Expediente clínico</div>
      <h1>Historial clínico cronológico</h1>
      <div class="patient">
        <div class="patient-name">${escapeHtml(patientName)}</div>
        <div class="meta">
          <span><strong>Expediente:</strong> #${escapeHtml(summary.patient.pacienteId)}</span>
          <span><strong>Nacimiento:</strong> ${escapeHtml(formatDate(summary.patient.fechaNacimiento))}</span>
          <span><strong>Sexo:</strong> ${escapeHtml(formatGender(summary.patient.sexo) ?? 'Sin registro')}</span>
          <span><strong>Teléfono:</strong> ${escapeHtml(summary.patient.telefono ?? 'Sin registro')}</span>
          <span><strong>Correo:</strong> ${escapeHtml(summary.patient.email ?? 'Sin registro')}</span>
          <span><strong>Generado:</strong> ${escapeHtml(formatDateTime(new Date().toISOString()))}</span>
        </div>
      </div>
      <p class="intro">${history.length} evento(s), organizados del más antiguo al más reciente. Cada registro muestra sus campos clínicos disponibles.</p>
    </header>
    <main>${events}</main>
    <div class="footer">Documento confidencial de información clínica. Verifique su contenido con un profesional de salud.</div>
  </body></html>`;
};

const buildPatientNarrative = (summary: ClinicalSummary) => {
  const { patient, overview, upcoming, clinicalDetails } = summary;
  const gender = formatGender(patient.sexo);
  const profile = patient.edadAproximada !== null && gender
    ? `Paciente ${gender.toLocaleLowerCase('es')} de ${patient.edadAproximada} años.`
    : patient.edadAproximada !== null
      ? `Paciente de ${patient.edadAproximada} años.`
      : gender
        ? `Paciente de género ${gender.toLocaleLowerCase('es')}.`
        : 'Paciente con datos demográficos incompletos.';

  const records = `Registra ${overview.totalConsultas} ${
      overview.totalConsultas === 1 ? 'consulta' : 'consultas'
    }, ${overview.examenesClinicos} ${
      overview.examenesClinicos === 1 ? 'examen clínico' : 'exámenes clínicos'
    } y ${overview.vacunasAplicadas} ${
      overview.vacunasAplicadas === 1 ? 'vacuna registrada' : 'vacunas registradas'
    }.`;

  const conditionText = clinicalDetails?.activeConditions.length
    ? clinicalDetails.activeConditions
        .map((item) => `${item.nombre}${item.severidad ? ` (${item.severidad})` : ''}`)
        .join(', ')
    : null;
  const clinicalStatus = overview.condicionesActivas > 0 || overview.alergiasActivas > 0
    ? `${conditionText ? `Condiciones activas: ${conditionText}.` : `Presenta ${overview.condicionesActivas} ${
        overview.condicionesActivas === 1 ? 'condición activa' : 'condiciones activas'
      }.`} Registra ${overview.alergiasActivas} ${
          overview.alergiasActivas === 1 ? 'alergia activa' : 'alergias activas'
        }. ${
          overview.medicacionesActivas > 0
            ? `Mantiene ${overview.medicacionesActivas} ${
                overview.medicacionesActivas === 1 ? 'medicación activa' : 'medicaciones activas'
              }.`
            : 'No tiene medicaciones activas.'
        }`
    : overview.medicacionesActivas > 0
      ? `Actualmente tiene ${overview.medicacionesActivas} ${
          overview.medicacionesActivas === 1 ? 'medicación activa' : 'medicaciones activas'
        }.`
      : 'No registra condiciones crónicas, alergias ni medicaciones activas.';

  const weight = clinicalDetails?.latestWeight
    ? `${clinicalDetails.latestWeight.value.toLocaleString('es-NI', {
        maximumFractionDigits: 2,
      })} kg · registrado el ${formatDate(clinicalDetails.latestWeight.date)}.`
    : 'No hay un peso registrado.';

  const lifestyle = clinicalDetails?.lifestyle;
  const lifestyleItems = [
    lifestyle?.alimentacion ? `Alimentación: ${lifestyle.alimentacion}` : null,
    lifestyle?.actividadFisica ? `Actividad física: ${lifestyle.actividadFisica}` : null,
    lifestyle?.horasSueno !== null && lifestyle?.horasSueno !== undefined
      ? `Sueño: ${lifestyle.horasSueno} h`
      : null,
    lifestyle?.consumoTabaco ? `Tabaco: ${lifestyle.consumoTabaco}` : null,
    lifestyle?.consumoAlcohol ? `Alcohol: ${lifestyle.consumoAlcohol}` : null,
    lifestyle?.estres ? `Estrés: ${lifestyle.estres}` : null,
  ].filter((item): item is string => Boolean(item));
  const specificHabits = (clinicalDetails?.habits ?? [])
    .map((item) => {
      const name = item.categoria || 'Hábito';
      const detail = item.frecuencia || item.nivel;
      return detail ? `${name}: ${detail}` : name;
    })
    .filter(Boolean);
  const habits = [...lifestyleItems, ...specificHabits].length
    ? [...lifestyleItems, ...specificHabits].join(' · ')
    : 'No hay hábitos ni datos de estilo de vida registrados.';

  const injuryItems = (clinicalDetails?.recentInjuries ?? []).map(
    (item) =>
      `Lesión: ${item.tipo}${item.parteCuerpo ? ` en ${item.parteCuerpo}` : ''} (${formatDate(item.fecha)})`,
  );
  const operationItems = (clinicalDetails?.recentOperations ?? []).map(
    (item) => `Operación: ${item.tipo} (${formatDate(item.fecha)})`,
  );
  const recentHistory = [...injuryItems, ...operationItems].length
    ? [...injuryItems, ...operationItems].join(' · ')
    : 'No hay lesiones ni operaciones recientes registradas.';

  const schedule = upcoming.nextAppointment
    ? `Próxima cita: ${formatDateTime(upcoming.nextAppointment.fecha)}${
        upcoming.nextAppointment.especialidad
          ? ` · ${upcoming.nextAppointment.especialidad}`
          : ''
      }.`
    : 'No tiene una próxima cita programada.';

  return { profile, records, weight, habits, clinicalStatus, recentHistory, schedule };
};

const buildMentalHealthSummary = (
  mentalHealth: NonNullable<ClinicalSummary['clinicalDetails']>['mentalHealth'],
) => {
  if (!mentalHealth) {
    return 'No hay registros recientes. Abre el módulo para iniciar el seguimiento.';
  }

  const observations: string[] = [];
  if (mentalHealth.averageMood >= 4) observations.push('ánimo favorable');
  if (mentalHealth.averageMood <= 2) observations.push('ánimo bajo');
  if (mentalHealth.averageStress >= 4) observations.push('estrés elevado');
  if (mentalHealth.averageAnxiety >= 4) observations.push('ansiedad elevada');
  if (
    mentalHealth.latest.sleepHours !== null &&
    mentalHealth.latest.sleepHours < 6
  ) {
    observations.push('sueño corto en el último registro');
  }

  return observations.length
    ? `La tendencia reciente muestra ${observations.join(', ')}.`
    : 'Los indicadores recientes se mantienen en rangos intermedios.';
};

const clinicalAreas: ClinicalArea[] = [
  { title: 'Consultas', subtitle: 'Diagnósticos y tratamientos', route: 'ConsultaList', icon: 'document-text-outline' },
  { title: 'Citas', subtitle: 'Agenda médica', route: 'CitaForm', icon: 'calendar-outline' },
  { title: 'Medicaciones', subtitle: 'Tratamientos y recetas', route: 'MedicacionForm', icon: 'medical-outline' },
  { title: 'Alergias', subtitle: 'Reacciones y severidad', route: 'Alergia', icon: 'warning-outline' },
  { title: 'Crónicas', subtitle: 'Condiciones y controles', route: 'CondicionCronicaForm', icon: 'heart-outline' },
  { title: 'Exámenes', subtitle: 'Resultados clínicos', route: 'ExamenClinico', icon: 'flask-outline' },
  { title: 'Vacunas', subtitle: 'Esquema de inmunización', route: 'VacunaForm', icon: 'shield-checkmark-outline' },
  { title: 'Seguimientos', subtitle: 'Evolución posterior', route: 'SeguimientoPostevento', icon: 'pulse-outline' },
  { title: 'Salud mental', subtitle: 'Ánimo, sueño y estrés', route: 'SaludMental', icon: 'happy-outline' },
  { title: 'Salud física', subtitle: 'Peso, actividad y progreso', route: 'SeguimientoFisico', icon: 'fitness-outline' },
  { title: 'Ciclo menstrual', subtitle: 'Periodo y predicciones', route: 'Periodo', icon: 'calendar-number-outline' },
  { title: 'Embarazo', subtitle: 'Control gestacional', route: 'Embarazo', icon: 'heart-circle-outline' },
  { title: 'Odontología', subtitle: 'Registro dental', route: 'RegistroDentalForm', icon: 'sparkles-outline' },
  { title: 'Desparasitación', subtitle: 'Dosis y próximos controles', route: 'Desparasitacion', icon: 'water-outline' },
  { title: 'Documentos', subtitle: 'Archivos clínicos', route: 'DocumentoForm', icon: 'folder-open-outline' },
  { title: 'Recordatorios', subtitle: 'Pendientes de salud', route: 'RecordatorioList', icon: 'notifications-outline' },
  { title: 'Operaciones', subtitle: 'Antecedentes quirúrgicos', route: 'OperacionForm', icon: 'bandage-outline' },
  { title: 'Lesiones', subtitle: 'Traumas y recuperación', route: 'LesionForm', icon: 'body-outline' },
];

export function PacienteResumenScreen({ navigation, route }: Props) {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingHistoryPdf, setGeneratingHistoryPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'server' | 'cache' | null>(null);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setSelectedPatientId('');
      return;
    }

    setLoadingPatients(true);
    setError(null);
    try {
      let linked = await fetchLinkedPatients(authHeaders);
      if (linked.length === 0 && user?.pacienteId) {
        linked = [{
          pacienteId: Number(user.pacienteId),
          displayName: user.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
        }];
      }
      setPatientOptions(linked);
      setSelectedPatientId((current) => {
        const requestedId = route.params?.pacienteId;
        if (requestedId && linked.some((item) => item.pacienteId === requestedId)) {
          return String(requestedId);
        }
        return current || String(linked[0]?.pacienteId ?? '');
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudieron cargar los pacientes.');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, route.params?.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchSummary = useCallback(async (patientIdValue: string, silent = false) => {
    const pacienteId = Number(patientIdValue);
    const ownerUserId = user?.id;
    if (!token || !ownerUserId || !Number.isFinite(pacienteId) || pacienteId <= 0) {
      setSummary(null);
      setDataSource(null);
      return;
    }

    silent ? setRefreshing(true) : setLoadingSummary(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/paciente/${pacienteId}/resumen-clinico`, {
        headers: authHeaders,
      });
      const body = (await response.json().catch(() => null)) as ClinicalSummary | null;
      if (!response.ok || !body) {
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo cargar el resumen.');
      }
      setSummary(body);
      setDataSource('server');
      await writeClinicalSummaryCache(ownerUserId, pacienteId, body);
    } catch (fetchError) {
      const cached = await readClinicalSummaryCache<ClinicalSummary>(
        ownerUserId,
        pacienteId,
      );
      if (cached) {
        setSummary(cached);
        setDataSource('cache');
        setError('Sin conexión. Se muestra la última copia guardada.');
      } else {
        setSummary(null);
        setDataSource(null);
        setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar el resumen.');
      }
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  }, [authHeaders, token, user?.id]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) fetchSummary(selectedPatientId);
  }, [fetchSummary, selectedPatientId]);

  const patientName = useMemo(() => {
    const selected = patientOptions.find((item) => String(item.pacienteId) === selectedPatientId);
    return buildFullName(summary, selected?.displayName ?? user?.username?.split('@')[0]);
  }, [patientOptions, selectedPatientId, summary, user?.username]);

  const metrics = useMemo<Metric[]>(() => summary ? [
    { label: 'Consultas', value: summary.overview.totalConsultas, icon: 'document-text-outline', color: appColors.info },
    { label: 'Condiciones', value: summary.overview.condicionesActivas, icon: 'heart-outline', color: '#A78BFA' },
    { label: 'Alergias', value: summary.overview.alergiasActivas, icon: 'warning-outline', color: appColors.accent },
    { label: 'Medicaciones', value: summary.overview.medicacionesActivas, icon: 'medical-outline', color: appColors.success },
    { label: 'Exámenes', value: summary.overview.examenesClinicos, icon: 'flask-outline', color: '#F9A826' },
    { label: 'Vacunas', value: summary.overview.vacunasAplicadas, icon: 'shield-checkmark-outline', color: '#2DD4BF' },
    { label: 'Seguimientos', value: summary.overview.seguimientosActivos, icon: 'pulse-outline', color: '#60A5FA' },
    { label: 'Citas pendientes', value: summary.overview.citasPendientes, icon: 'calendar-outline', color: '#FB7185' },
    { label: 'Recordatorios', value: summary.overview.recordatoriosPendientes, icon: 'notifications-outline', color: '#C084FC' },
  ] : [], [summary]);

  const selectedLabel =
    patientOptions.find((item) => String(item.pacienteId) === selectedPatientId)?.displayName ??
    patientName;
  const visibleClinicalAreas = summary
    ? clinicalAreas.filter(
        (area) => area.title !== 'Ciclo menstrual' || !isMaleSex(summary.patient.sexo),
      )
    : clinicalAreas;
  const patientNarrative = summary ? buildPatientNarrative(summary) : null;
  const mentalHealth = summary?.clinicalDetails?.mentalHealth ?? null;
  const mentalHealthSummary = buildMentalHealthSummary(mentalHealth);

  const generateClinicalHistoryPdf = async () => {
    if (!summary) return;
    setGeneratingHistoryPdf(true);
    try {
      const response = await fetch(
        `${API_URL}/paciente/${summary.patient.pacienteId}/historial-clinico`,
        { headers: authHeaders },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body)) {
        throw new Error(body?.message ?? 'No se pudo cargar el historial clínico.');
      }

      const html = buildClinicalHistoryPdfHtml(
        summary,
        patientName,
        body as ClinicalHistoryEvent[],
      );
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      const pdf = await Print.printToFileAsync({ html });
      if (!pdf?.uri) throw new Error('No se pudo crear el archivo PDF.');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `Historial clínico de ${patientName}`,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (pdfError) {
      Alert.alert(
        'No se pudo generar el PDF',
        pdfError instanceof Error ? pdfError.message : 'Inténtalo nuevamente.',
      );
    } finally {
      setGeneratingHistoryPdf(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchSummary(selectedPatientId, true)}
          tintColor={appColors.info}
          colors={[appColors.info]}
        />
      }
    >
      <View style={styles.pageHeader}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="clipboard-pulse-outline" size={25} color={appColors.info} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>EXPEDIENTE CLÍNICO</Text>
          <Text style={styles.pageTitle}>Resumen del paciente</Text>
          <Text style={styles.pageSubtitle}>Información relevante para una lectura clínica rápida e integral.</Text>
        </View>
      </View>

      <View style={styles.selectorCard}>
        <Text style={styles.fieldLabel}>Paciente</Text>
        <View style={styles.pickerShell}>
          <Picker
            selectedValue={selectedPatientId}
            onValueChange={(value) => setSelectedPatientId(String(value))}
            enabled={!loadingPatients}
            style={styles.picker}
            dropdownIconColor={appColors.textSoft}
          >
            <Picker.Item
              label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'}
              value=""
              color={appColors.textMuted}
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
      </View>

      {error ? (
        <View style={[styles.notice, dataSource === 'cache' ? styles.noticeWarning : styles.noticeError]}>
          <Ionicons
            name={dataSource === 'cache' ? 'cloud-offline-outline' : 'alert-circle-outline'}
            size={18}
            color={dataSource === 'cache' ? '#F9A826' : appColors.accent}
          />
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : null}

      {!loadingPatients && patientOptions.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No hay pacientes asociados"
          text="Asocia un paciente a esta cuenta para consultar su expediente clínico."
        />
      ) : null}

      {(loadingPatients || loadingSummary) && !refreshing ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={appColors.info} />
          <Text style={styles.loadingTitle}>Preparando expediente</Text>
          <Text style={styles.loadingText}>Estamos reuniendo la información clínica de {selectedLabel}.</Text>
        </View>
      ) : null}

      {!loadingPatients && !loadingSummary && selectedPatientId && !summary && !error ? (
        <EmptyState
          icon="document-text-outline"
          title="Resumen no disponible"
          text="Desliza hacia abajo para actualizar o selecciona otro paciente."
        />
      ) : null}

      {summary ? (
        <>
          <View style={styles.patientCard}>
            <View style={styles.patientTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(patientName)}</Text>
              </View>
              <View style={styles.patientIdentity}>
                <Text style={styles.patientName}>{patientName}</Text>
                <Text style={styles.patientId}>Expediente #{summary.patient.pacienteId}</Text>
                <View style={styles.tagRow}>
                  {summary.patient.edadAproximada !== null ? (
                    <View style={styles.tag}><Text style={styles.tagText}>{summary.patient.edadAproximada} años</Text></View>
                  ) : null}
                  {formatGender(summary.patient.sexo) ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{formatGender(summary.patient.sexo)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('PacienteEditor', { pacienteId: summary.patient.pacienteId })}
                accessibilityLabel="Editar datos del paciente"
              >
                <Ionicons name="create-outline" size={20} color={appColors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.contactGrid}>
              <InfoItem icon="calendar-outline" label="Nacimiento" value={formatDate(summary.patient.fechaNacimiento)} />
              <InfoItem icon="call-outline" label="Teléfono" value={summary.patient.telefono || 'Sin registro'} />
              <InfoItem icon="mail-outline" label="Correo" value={summary.patient.email || 'Sin registro'} wide />
              <InfoItem icon="time-outline" label="Última consulta" value={formatDateTime(summary.overview.ultimaConsulta)} wide />
            </View>

            <TouchableOpacity
              style={[styles.pdfButton, generatingHistoryPdf && styles.pdfButtonDisabled]}
              onPress={generateClinicalHistoryPdf}
              disabled={generatingHistoryPdf}
              accessibilityRole="button"
              accessibilityLabel="Generar historial clínico en PDF"
            >
              {generatingHistoryPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="document-text-outline" size={19} color="#FFFFFF" />
              )}
              <Text style={styles.pdfButtonText}>
                {generatingHistoryPdf ? 'Generando PDF...' : 'Generar historial clínico PDF'}
              </Text>
            </TouchableOpacity>

            <View style={styles.syncRow}>
              <Ionicons
                name={dataSource === 'cache' ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={15}
                color={dataSource === 'cache' ? '#F9A826' : appColors.success}
              />
              <Text style={styles.syncText}>
                {dataSource === 'cache' ? 'Copia local' : 'Sincronizado'} · {formatDateTime(summary.generatedAt)}
              </Text>
            </View>
          </View>

          <SectionHeader
            title="Síntesis del paciente"
            subtitle="Lectura rápida de la situación clínica actual"
          />
          <View style={styles.narrativeCard}>
            <View style={styles.narrativeIcon}>
              <Ionicons name="reader-outline" size={21} color={appColors.info} />
            </View>
            <View style={styles.narrativeContent}>
              <Text style={styles.narrativeLead}>{patientNarrative?.profile}</Text>
              <NarrativeLine label="Expediente" text={patientNarrative?.records ?? ''} />
              <NarrativeLine label="Peso más reciente" text={patientNarrative?.weight ?? ''} />
              <NarrativeLine label="Hábitos y estilo de vida" text={patientNarrative?.habits ?? ''} />
              <NarrativeLine label="Estado actual" text={patientNarrative?.clinicalStatus ?? ''} />
              <NarrativeLine label="Lesiones y operaciones recientes" text={patientNarrative?.recentHistory ?? ''} />
              <NarrativeLine label="Agenda" text={patientNarrative?.schedule ?? ''} last />
            </View>
          </View>

          <SectionHeader
            title="Salud mental"
            subtitle="Resumen del seguimiento reciente"
          />
          <TouchableOpacity
            style={styles.mentalHealthCard}
            onPress={() => navigation.navigate('SaludMental')}
            accessibilityRole="button"
            accessibilityLabel="Abrir módulo de salud mental"
          >
            <View style={styles.mentalHealthHeader}>
              <View style={styles.mentalHealthIcon}>
                <Ionicons name="happy-outline" size={22} color="#C084FC" />
              </View>
              <View style={styles.mentalHealthHeaderCopy}>
                <Text style={styles.mentalHealthTitle}>
                  {mentalHealth
                    ? `${mentalHealth.recentRecords} ${
                        mentalHealth.recentRecords === 1 ? 'registro reciente' : 'registros recientes'
                      }`
                    : 'Sin registros recientes'}
                </Text>
                <Text style={styles.mentalHealthDate}>
                  {mentalHealth
                    ? `Último registro: ${formatDate(mentalHealth.latest.date)}`
                    : 'Toca para registrar cómo te sientes'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={appColors.textMuted} />
            </View>

            {mentalHealth ? (
              <View style={styles.mentalMetricRow}>
                <View style={styles.mentalMetric}>
                  <Text style={styles.mentalMetricValue}>{mentalHealth.averageMood}/5</Text>
                  <Text style={styles.mentalMetricLabel}>Ánimo</Text>
                </View>
                <View style={styles.mentalMetricDivider} />
                <View style={styles.mentalMetric}>
                  <Text style={styles.mentalMetricValue}>{mentalHealth.averageStress}/5</Text>
                  <Text style={styles.mentalMetricLabel}>Estrés</Text>
                </View>
                <View style={styles.mentalMetricDivider} />
                <View style={styles.mentalMetric}>
                  <Text style={styles.mentalMetricValue}>{mentalHealth.averageAnxiety}/5</Text>
                  <Text style={styles.mentalMetricLabel}>Ansiedad</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.mentalHealthSummary}>{mentalHealthSummary}</Text>
          </TouchableOpacity>

          <SectionHeader
            title="Atención prioritaria"
            subtitle="Hallazgos que conviene revisar primero"
            badge={summary.alerts.length}
          />
          <View style={styles.sectionCard}>
            {summary.alerts.length === 0 ? (
              <HealthyState />
            ) : (
              summary.alerts.map((alert, index) => {
                const tone = alert.level === 'high'
                  ? appColors.accent
                  : alert.level === 'medium'
                    ? '#F9A826'
                    : appColors.info;
                return (
                  <View key={`${alert.title}-${index}`} style={styles.alertRow}>
                    <View style={[styles.alertIcon, { backgroundColor: colorAlpha(tone, '18') }]}>
                      <Ionicons
                        name={alert.level === 'info' ? 'information-circle-outline' : 'warning-outline'}
                        size={19}
                        color={tone}
                      />
                    </View>
                    <View style={styles.alertCopy}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertDetail}>{alert.detail}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <SectionHeader title="Panorama clínico" subtitle="Registros disponibles en el expediente" />
          <View style={styles.metricGrid}>
            {metrics.map((metric) => (
              <View key={metric.label} style={styles.metricCard}>
                <View style={[styles.metricIcon, { backgroundColor: colorAlpha(metric.color, '18') }]}>
                  <Ionicons name={metric.icon} size={19} color={metric.color} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>

          <SectionHeader title="Próximos cuidados" subtitle="Citas y controles planificados" />
          <View style={styles.sectionCard}>
            <View style={styles.upcomingRow}>
              <View style={[styles.upcomingIcon, { backgroundColor: colorAlpha(appColors.info, '18') }]}>
                <Ionicons name="calendar-outline" size={21} color={appColors.info} />
              </View>
              <View style={styles.upcomingCopy}>
                <Text style={styles.itemLabel}>PRÓXIMA CITA</Text>
                <Text style={styles.itemTitle}>
                  {summary.upcoming.nextAppointment?.especialidad || 'Sin cita pendiente'}
                </Text>
                <Text style={styles.itemDetail}>
                  {summary.upcoming.nextAppointment
                    ? `${formatDateTime(summary.upcoming.nextAppointment.fecha)}${
                        summary.upcoming.nextAppointment.motivo
                          ? ` · ${summary.upcoming.nextAppointment.motivo}`
                          : ''
                      }`
                    : 'No hay citas programadas en este momento.'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.upcomingRow}>
              <View style={[styles.upcomingIcon, { backgroundColor: colorAlpha(appColors.success, '18') }]}>
                <Ionicons name="pulse-outline" size={21} color={appColors.success} />
              </View>
              <View style={styles.upcomingCopy}>
                <Text style={styles.itemLabel}>PRÓXIMO CONTROL</Text>
                <Text style={styles.itemTitle}>{formatDate(summary.upcoming.nextFollowUp)}</Text>
                <Text style={styles.itemDetail}>
                  {summary.upcoming.nextFollowUp
                    ? 'Control indicado en el seguimiento clínico.'
                    : 'No hay un control de seguimiento programado.'}
                </Text>
              </View>
            </View>
          </View>

          <SectionHeader
            title="Tratamientos activos"
            subtitle="Medicaciones vigentes"
            badge={summary.activeTreatments.length}
          />
          <View style={styles.sectionCard}>
            {summary.activeTreatments.length === 0 ? (
              <EmptyInline icon="medical-outline" text="No hay tratamientos activos registrados." />
            ) : (
              summary.activeTreatments.map((item, index) => (
                <View key={item.medicacionId}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.treatmentRow}>
                    <View style={styles.pillIcon}>
                      <MaterialCommunityIcons name="pill" size={20} color={appColors.success} />
                    </View>
                    <View style={styles.treatmentCopy}>
                      <Text style={styles.itemTitle}>{item.nombre}</Text>
                      <Text style={styles.treatmentDose}>
                        {[item.dosis, item.viaAdministracion].filter(Boolean).join(' · ') || 'Dosis no especificada'}
                      </Text>
                      <Text style={styles.itemDetail}>{item.indicaciones || 'Sin indicaciones adicionales'}</Text>
                      <Text style={styles.dateCaption}>
                        Desde {formatDate(item.fechaInicio)}
                        {item.fechaFin ? ` hasta ${formatDate(item.fechaFin)}` : ' · tratamiento vigente'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Actividad reciente" subtitle="Últimos eventos del expediente" />
          <View style={styles.sectionCard}>
            {summary.recentTimeline.length === 0 ? (
              <EmptyInline icon="time-outline" text="Aún no hay actividad clínica reciente." />
            ) : (
              summary.recentTimeline.map((item, index) => (
                <View key={`${item.type}-${item.date}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < summary.recentTimeline.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineType}>{item.type}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(item.date)}</Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Plan de cuidado" subtitle="Sugerencias basadas en el expediente" />
          <View style={styles.sectionCard}>
            {summary.carePointers.length === 0 ? (
              <EmptyInline icon="checkmark-circle-outline" text="No hay recomendaciones pendientes." />
            ) : (
              summary.carePointers.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.pointerRow}>
                  <View style={styles.pointerNumber}><Text style={styles.pointerNumberText}>{index + 1}</Text></View>
                  <Text style={styles.pointerText}>{item}</Text>
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Explorar expediente" subtitle="Consulta cada aspecto clínico en detalle" />
          <View style={styles.areaGrid}>
            {visibleClinicalAreas.map((area) => (
              <TouchableOpacity
                key={area.title}
                style={styles.areaCard}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(area.route as never)}
              >
                <View style={styles.areaIcon}>
                  <Ionicons name={area.icon} size={21} color={appColors.info} />
                </View>
                <View style={styles.areaCopy}>
                  <Text style={styles.areaTitle}>{area.title}</Text>
                  <Text style={styles.areaSubtitle}>{area.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={appColors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {badge !== undefined ? (
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{badge}</Text></View>
      ) : null}
    </View>
  );
}

function InfoItem({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.infoItem, wide && styles.infoItemWide]}>
      <Ionicons name={icon} size={16} color={appColors.info} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function NarrativeLine({
  label,
  text,
  last = false,
}: {
  label: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.narrativeLine, last && styles.narrativeLineLast]}>
      <Text style={styles.narrativeLabel}>{label}</Text>
      <Text style={styles.narrativeText}>{text}</Text>
    </View>
  );
}

function HealthyState() {
  return (
    <View style={styles.healthyState}>
      <View style={styles.healthyIcon}>
        <Ionicons name="checkmark-circle" size={25} color={appColors.success} />
      </View>
      <View style={styles.healthyCopy}>
        <Text style={styles.healthyTitle}>Sin alertas prioritarias</Text>
        <Text style={styles.itemDetail}>No se detectaron pendientes clínicos que requieran atención inmediata.</Text>
      </View>
    </View>
  );
}

function EmptyInline({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  return (
    <View style={styles.emptyInline}>
      <Ionicons name={icon} size={22} color={appColors.textMuted} />
      <Text style={styles.emptyInlineText}>{text}</Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}><Ionicons name={icon} size={28} color={appColors.info} /></View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 44 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 3 },
  pageTitle: { color: appColors.text, fontSize: 25, lineHeight: 30, fontWeight: '900' },
  pageSubtitle: { color: appColors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  selectorCard: {
    backgroundColor: appColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 14,
  },
  fieldLabel: { color: appColors.textSoft, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  pickerShell: {
    height: 52,
    backgroundColor: appColors.backgroundMuted,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: { color: appColors.text, marginHorizontal: -4 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  noticeWarning: { backgroundColor: '#F9A82612', borderColor: '#F9A82655' },
  noticeError: { backgroundColor: colorAlpha(appColors.accent, '12'), borderColor: colorAlpha(appColors.accent, '55') },
  noticeText: { color: appColors.textSoft, fontSize: 12, lineHeight: 17, marginLeft: 9, flex: 1 },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: 28,
  },
  loadingTitle: { color: appColors.text, fontSize: 17, fontWeight: '800', marginTop: 13 },
  loadingText: { color: appColors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 5 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: 26,
  },
  emptyStateIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colorAlpha(appColors.info, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: { color: appColors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyStateText: { color: appColors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  patientCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 17,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 24,
  },
  patientTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: appColors.background, fontSize: 20, fontWeight: '900' },
  patientIdentity: { flex: 1, minWidth: 0 },
  patientName: { color: appColors.text, fontSize: 21, lineHeight: 26, fontWeight: '900' },
  patientId: { color: appColors.textMuted, fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: appColors.backgroundMuted, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { color: appColors.textSoft, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: appColors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pdfButton: {
    alignItems: 'center',
    backgroundColor: appColors.info,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 13,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  pdfButtonDisabled: { opacity: 0.65 },
  pdfButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginLeft: 8 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 17 },
  infoItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    marginBottom: 14,
  },
  infoItemWide: { width: '100%' },
  infoCopy: { flex: 1, marginLeft: 8 },
  infoLabel: { color: appColors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: appColors.text, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 2 },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: appColors.borderStrong,
    paddingTop: 12,
  },
  syncText: { color: appColors.textMuted, fontSize: 11, marginLeft: 7, flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 11, marginTop: 2 },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: appColors.textMuted, fontSize: 12, marginTop: 3 },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  countBadgeText: { color: appColors.textSoft, fontSize: 12, fontWeight: '900' },
  sectionCard: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 24,
  },
  narrativeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colorAlpha(appColors.info, '0D'),
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '3D'),
    marginBottom: 24,
  },
  narrativeIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colorAlpha(appColors.info, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  narrativeContent: {
    flex: 1,
    minWidth: 0,
  },
  narrativeLead: {
    color: appColors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 10,
  },
  narrativeLine: {
    borderTopWidth: 1,
    borderTopColor: colorAlpha(appColors.info, '26'),
    paddingVertical: 9,
  },
  narrativeLineLast: {
    paddingBottom: 0,
  },
  narrativeLabel: {
    color: appColors.info,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  narrativeText: {
    color: appColors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  mentalHealthCard: {
    backgroundColor: colorAlpha('#C084FC', '0F'),
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colorAlpha('#C084FC', '42'),
    marginBottom: 24,
  },
  mentalHealthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentalHealthIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colorAlpha('#C084FC', '1C'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  mentalHealthHeaderCopy: { flex: 1, minWidth: 0 },
  mentalHealthTitle: { color: appColors.text, fontSize: 14, fontWeight: '800' },
  mentalHealthDate: { color: appColors.textMuted, fontSize: 11, marginTop: 3 },
  mentalMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colorAlpha('#C084FC', '2E'),
  },
  mentalMetric: { flex: 1, alignItems: 'center' },
  mentalMetricValue: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  mentalMetricLabel: { color: appColors.textMuted, fontSize: 10, marginTop: 2 },
  mentalMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: colorAlpha('#C084FC', '2E'),
  },
  mentalHealthSummary: {
    color: appColors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  alertCopy: { flex: 1 },
  alertTitle: { color: appColors.text, fontSize: 14, fontWeight: '800' },
  alertDetail: { color: appColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  healthyState: { flexDirection: 'row', alignItems: 'center' },
  healthyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colorAlpha(appColors.success, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  healthyCopy: { flex: 1 },
  healthyTitle: { color: appColors.text, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metricCard: {
    width: '31.5%',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: { color: appColors.text, fontSize: 25, lineHeight: 29, fontWeight: '900' },
  metricLabel: { color: appColors.textMuted, fontSize: 11, lineHeight: 15, minHeight: 30 },
  upcomingRow: { flexDirection: 'row', alignItems: 'flex-start' },
  upcomingIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  upcomingCopy: { flex: 1 },
  itemLabel: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  itemTitle: { color: appColors.text, fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 2 },
  itemDetail: { color: appColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  divider: { height: 1, backgroundColor: appColors.borderStrong, marginVertical: 15 },
  treatmentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colorAlpha(appColors.success, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  treatmentCopy: { flex: 1 },
  treatmentDose: { color: appColors.success, fontSize: 12, fontWeight: '800', marginTop: 2 },
  dateCaption: { color: appColors.textSoft, fontSize: 10, lineHeight: 15, marginTop: 6 },
  timelineRow: { flexDirection: 'row', minHeight: 76 },
  timelineRail: { width: 22, alignItems: 'center', marginRight: 8 },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: appColors.info,
    borderWidth: 3,
    borderColor: colorAlpha(appColors.info, '33'),
    marginTop: 4,
  },
  timelineLine: { width: 1, flex: 1, backgroundColor: appColors.border, marginVertical: 4 },
  timelineCopy: { flex: 1, paddingBottom: 16 },
  timelineHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  timelineType: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  timelineDate: { color: appColors.textMuted, fontSize: 9, textAlign: 'right', maxWidth: '48%' },
  pointerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
  pointerNumber: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: colorAlpha(appColors.success, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pointerNumberText: { color: appColors.success, fontSize: 11, fontWeight: '900' },
  pointerText: { color: appColors.textSoft, fontSize: 12, lineHeight: 18, flex: 1, paddingTop: 3 },
  emptyInline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  emptyInlineText: { color: appColors.textMuted, fontSize: 13, lineHeight: 18, marginLeft: 9, flex: 1 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  areaCard: {
    width: '50%',
    minHeight: 88,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 17,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ scale: 0.97 }],
  },
  areaIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: colorAlpha(appColors.info, '14'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  areaCopy: { flex: 1, minWidth: 0 },
  areaTitle: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  areaSubtitle: { color: appColors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 2 },
});
