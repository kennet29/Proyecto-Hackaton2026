import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { invalidateLinkedPatientsCache } from '../utils/linkedPatients';

type Props = NativeStackScreenProps<RootStackParamList, 'HistorialCompartido'>;

type FullHistory = {
  generatedAt: string;
  expiresAt: string;
  permiso: {
    permisoId: number;
    pacienteId: number;
    medicoId: number;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
    notas?: string | null;
  };
  secciones: string[];
  data: Record<string, unknown>;
};

const SECTION_LABELS: Record<string, string> = {
  resumenClinico: 'Resumen clínico',
  consultasMedicas: 'Consultas médicas',
  saludMental: 'Salud mental',
  periodo: 'Ciclo menstrual',
  seguimientoFisico: 'Seguimiento físico',
  seguimientoPostevento: 'Seguimiento posterior',
  examenesClinicos: 'Exámenes clínicos',
  citasMedicas: 'Citas médicas',
  medicaciones: 'Medicaciones',
  vacunas: 'Vacunas',
  alergias: 'Alergias',
  condicionesCronicas: 'Condiciones crónicas',
  antecedentesFamiliares: 'Antecedentes familiares',
  documentosClinicos: 'Documentos clínicos',
  desparasitaciones: 'Desparasitaciones',
  embarazos: 'Embarazos',
  estiloVida: 'Estilo de vida',
  evaluacionesHabitos: 'Evaluaciones de hábitos',
  habitosEspecificos: 'Hábitos específicos',
  lesiones: 'Lesiones',
  notificaciones: 'Notificaciones',
  operaciones: 'Operaciones',
  puntajesRiesgo: 'Puntajes de riesgo',
  recordatoriosCitas: 'Recordatorios de citas',
  registroDental: 'Registro dental',
  registrosMenstruales: 'Registros menstruales',
};

type SectionCategory = 'todos' | 'resumen' | 'atencion' | 'tratamientos' | 'seguimiento' | 'otros';

const CATEGORY_LABELS: Record<SectionCategory, string> = {
  todos: 'Todo',
  resumen: 'Resumen',
  atencion: 'Atención',
  tratamientos: 'Tratamientos',
  seguimiento: 'Seguimiento',
  otros: 'Otros',
};

const SECTION_CATEGORIES: Record<string, Exclude<SectionCategory, 'todos'>> = {
  resumenClinico: 'resumen',
  consultasMedicas: 'atencion',
  citasMedicas: 'atencion',
  examenesClinicos: 'atencion',
  documentosClinicos: 'atencion',
  medicaciones: 'tratamientos',
  vacunas: 'tratamientos',
  alergias: 'tratamientos',
  condicionesCronicas: 'tratamientos',
  operaciones: 'tratamientos',
  lesiones: 'tratamientos',
  saludMental: 'seguimiento',
  seguimientoFisico: 'seguimiento',
  seguimientoPostevento: 'seguimiento',
  periodo: 'seguimiento',
  embarazos: 'seguimiento',
  registroDental: 'seguimiento',
  desparasitaciones: 'seguimiento',
};

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  resumenClinico: 'clipboard-outline',
  consultasMedicas: 'medkit-outline',
  citasMedicas: 'calendar-outline',
  examenesClinicos: 'flask-outline',
  documentosClinicos: 'document-text-outline',
  medicaciones: 'medical-outline',
  vacunas: 'shield-checkmark-outline',
  alergias: 'warning-outline',
  condicionesCronicas: 'pulse-outline',
  saludMental: 'happy-outline',
  seguimientoFisico: 'fitness-outline',
  periodo: 'water-outline',
  registroDental: 'sparkles-outline',
};

const FIELD_LABELS: Record<string, string> = {
  generatedAt: 'Actualizado',
  pacienteId: 'N.º de expediente',
  patientId: 'N.º de expediente',
  nombres: 'Nombres',
  apellidos: 'Apellidos',
  fechaNacimiento: 'Fecha de nacimiento',
  sexo: 'Sexo',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  totalConsultas: 'Consultas',
  condicionesActivas: 'Condiciones activas',
  alergiasActivas: 'Alergias activas',
  medicacionesActivas: 'Medicaciones activas',
  examenesClinicos: 'Exámenes',
  seguimientosActivos: 'Seguimientos activos',
  citasPendientes: 'Citas pendientes',
  recordatoriosPendientes: 'Recordatorios pendientes',
  ultimaConsulta: 'Última consulta',
  creadoEn: 'Creado',
  modificadoEn: 'Última modificación',
  fechaInicio: 'Fecha de inicio',
  fechaFin: 'Fecha de finalización',
};

const isDoctor = (role?: string) => role?.trim().toLowerCase() === 'medico';

const humanizeKey = (value: string) =>
  FIELD_LABELS[value] ||
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const getText = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const getSectionCount = (value: unknown) =>
  Array.isArray(value)
    ? value.length
    : value && typeof value === 'object'
      ? Object.keys(value as object).length
      : value === null || value === undefined || value === ''
        ? 0
        : 1;

const looksLikeDate = (key: string, value: string) =>
  /(fecha|date|at$|ultimaConsulta|creado|modificado)/i.test(key) &&
  !Number.isNaN(new Date(value).getTime());

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatRemaining = (milliseconds: number) => {
  if (milliseconds <= 0) return '00:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function HistorialCompartidoScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const { token, user } = useAuth();
  const initialCode = (route.params?.token || '').replace(/\D/g, '').slice(0, 6);
  const [code, setCode] = useState(initialCode);
  const [history, setHistory] = useState<FullHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [sectionQuery, setSectionQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SectionCategory>('todos');

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  useEffect(() => {
    if (!history?.expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [history?.expiresAt]);

  const remaining = history?.expiresAt
    ? new Date(history.expiresAt).getTime() - now
    : 0;
  const expired = Boolean(history && remaining <= 0);

  const loadFullHistory = useCallback(
    async (pacienteId: number) => {
      const response = await fetch(
        `${API_URL}/permiso-acceso/medico/historial/${pacienteId}`,
        { headers },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.message || 'No se pudo cargar el historial completo.',
        );
      }
      setHistory(payload as FullHistory);
      setNow(Date.now());
    },
    [headers],
  );

  const redeemCode = useCallback(async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Ingresa los 6 números del código temporal.');
      return;
    }
    setLoading(true);
    setError(null);
    setHistory(null);
    try {
      const claimResponse = await fetch(`${API_URL}/permiso-acceso/codigo/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      const claimPayload = await claimResponse.json().catch(() => null);
      if (!claimResponse.ok) {
        throw new Error(
          claimPayload?.message || 'El código no es válido o ya expiró.',
        );
      }
      invalidateLinkedPatientsCache(headers);
      await loadFullHistory(Number(claimPayload.pacienteId));
    } catch (claimError) {
      setError(
        claimError instanceof Error
          ? claimError.message
          : 'No se pudo validar el código.',
      );
    } finally {
      setLoading(false);
    }
  }, [code, headers, loadFullHistory]);

  useEffect(() => {
    if (initialCode.length === 6 && token && isDoctor(user?.role)) {
      void redeemCode();
    }
  }, [initialCode, redeemCode, token, user?.role]);

  const sections = useMemo(() => (history ? Object.entries(history.data) : []), [history]);
  const filteredSections = useMemo(() => {
    const normalizedQuery = sectionQuery.trim().toLocaleLowerCase('es');
    return sections.filter(([key, value]) => {
      const category = SECTION_CATEGORIES[key] || 'otros';
      const matchesCategory = activeCategory === 'todos' || category === activeCategory;
      const label = SECTION_LABELS[key] || humanizeKey(key);
      const searchableContent = normalizedQuery
        ? `${label} ${JSON.stringify(value)}`.toLocaleLowerCase('es')
        : '';
      return matchesCategory && (!normalizedQuery || searchableContent.includes(normalizedQuery));
    });
  }, [activeCategory, sectionQuery, sections]);
  const categoryCounts = useMemo(
    () =>
      sections.reduce<Record<SectionCategory, number>>(
        (counts, [key]) => {
          counts.todos += 1;
          counts[SECTION_CATEGORIES[key] || 'otros'] += 1;
          return counts;
        },
        { todos: 0, resumen: 0, atencion: 0, tratamientos: 0, seguimiento: 0, otros: 0 },
      ),
    [sections],
  );
  const clinicalSummary = asRecord(history?.data.resumenClinico);
  const patient = asRecord(clinicalSummary.patient);
  const overview = asRecord(clinicalSummary.overview);
  const patientName =
    [getText(patient.nombres), getText(patient.apellidos)].filter(Boolean).join(' ') ||
    'Paciente';
  const patientInitials = patientName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (!token || !isDoctor(user?.role)) {
    return (
      <View style={styles.accessScreen}>
        <View style={styles.accessCard}>
          <View style={styles.accessIcon}>
            <Ionicons name="medkit-outline" size={38} color={appColors.info} />
          </View>
          <AppText style={styles.accessTitle}>Acceso exclusivo para médicos</AppText>
          <AppText style={styles.accessText}>
            Esta herramienta requiere una sesión con rol médico aprobado.
          </AppText>
          <TouchableOpacity
            style={styles.accessButton}
            onPress={() =>
              token
                ? navigation.navigate('MenuPrincipal')
                : navigation.navigate('Login')
            }
          >
            <AppText style={styles.accessButtonText}>
              {token ? 'Volver al menú' : 'Iniciar sesión'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.hero, desktop && styles.heroDesktop]}>
        <View style={styles.heroIcon}>
          <Ionicons name="medical-outline" size={29} color={appColors.info} />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.eyebrow}>PORTAL MÉDICO TEMPORAL</AppText>
          <AppText style={styles.title}>Acceder a un historial compartido</AppText>
          <AppText style={styles.subtitle}>
            Introduce el código entregado por el paciente. Al validarlo tendrás
            una hora para consultar y actualizar su expediente.
          </AppText>
        </View>
        <View style={styles.doctorBadge}>
          <Ionicons name="shield-checkmark" size={16} color={appColors.success} />
          <AppText style={styles.doctorBadgeText}>Médico verificado</AppText>
        </View>
      </View>

      {!history ? (
        <View style={styles.codeCard}>
          <View style={styles.codeHeaderIcon}>
            <Ionicons name="keypad-outline" size={31} color={appColors.info} />
          </View>
          <AppText style={styles.codeTitle}>Código de 6 números</AppText>
          <AppText style={styles.codeHelper}>
            Solo puedes usar códigos asignados a tu cuenta médica.
          </AppText>
          <AppTextInput
            value={code}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={appColors.textMuted}
            style={styles.codeInput}
          />
          <View style={styles.digitGuide}>
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.guideDot,
                  code.length > index && styles.guideDotFilled,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              (loading || code.length !== 6) && styles.buttonDisabled,
            ]}
            disabled={loading || code.length !== 6}
            onPress={() => void redeemCode()}
          >
            {loading ? (
              <ActivityIndicator color={appColors.background} />
            ) : (
              <>
                <Ionicons name="lock-open-outline" size={19} color={appColors.background} />
                <AppText style={styles.redeemButtonText}>Validar y abrir historial</AppText>
              </>
            )}
          </TouchableOpacity>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={17} color={appColors.accent} />
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <>
          <View style={[styles.sessionCard, expired && styles.sessionExpired]}>
            <View style={styles.sessionCopy}>
              <AppText style={styles.sessionEyebrow}>
                {expired ? 'SESIÓN FINALIZADA' : 'ACCESO TEMPORAL ACTIVO'}
              </AppText>
              <AppText style={styles.sessionTitle}>
                Expediente #{history.permiso.pacienteId}
              </AppText>
              <AppText style={styles.sessionMeta}>
                Inicio: {formatDateTime(history.permiso.fechaInicio)} · Fin:{' '}
                {formatDateTime(history.expiresAt)}
              </AppText>
            </View>
            <View style={[styles.timer, expired && styles.timerExpired]}>
              <Ionicons
                name={expired ? 'time-outline' : 'hourglass-outline'}
                size={20}
                color={expired ? appColors.accent : appColors.success}
              />
              <View>
                <AppText style={styles.timerLabel}>Tiempo restante</AppText>
                <AppText
                  style={[
                    styles.timerValue,
                    expired && styles.timerValueExpired,
                  ]}
                >
                  {formatRemaining(remaining)}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editButton, expired && styles.buttonDisabled]}
              disabled={expired}
              onPress={() =>
                navigation.navigate('PacienteResumen', {
                  pacienteId: history.permiso.pacienteId,
                })
              }
            >
              <Ionicons name="create-outline" size={19} color={appColors.background} />
              <AppText style={styles.editButtonText}>Abrir expediente editable</AppText>
            </TouchableOpacity>
          </View>

          {history.permiso.notas ? (
            <View style={styles.noteCard}>
              <Ionicons name="chatbox-ellipses-outline" size={19} color={appColors.info} />
              <View style={styles.noteCopy}>
                <AppText style={styles.noteLabel}>Nota del paciente</AppText>
                <AppText style={styles.noteText}>{history.permiso.notas}</AppText>
              </View>
            </View>
          ) : null}

          <View style={styles.patientCard}>
            <View style={styles.patientMain}>
              <View style={styles.patientAvatar}>
                <AppText style={styles.patientInitials}>{patientInitials || 'P'}</AppText>
              </View>
              <View style={styles.patientIdentity}>
                <AppText style={styles.patientOverline}>PACIENTE COMPARTIDO</AppText>
                <AppText style={styles.patientName}>{patientName}</AppText>
                <View style={styles.patientDetails}>
                  <View style={styles.patientDetail}>
                    <Ionicons name="folder-outline" size={14} color={appColors.info} />
                    <AppText style={styles.patientDetailText}>
                      Expediente #{getText(patient.pacienteId) || history.permiso.pacienteId}
                    </AppText>
                  </View>
                  {getText(patient.sexo) ? (
                    <View style={styles.patientDetail}>
                      <Ionicons name="person-outline" size={14} color={appColors.info} />
                      <AppText style={styles.patientDetailText}>{getText(patient.sexo)}</AppText>
                    </View>
                  ) : null}
                  {getText(patient.fechaNacimiento) ? (
                    <View style={styles.patientDetail}>
                      <Ionicons name="calendar-outline" size={14} color={appColors.info} />
                      <AppText style={styles.patientDetailText}>
                        {formatDateTime(getText(patient.fechaNacimiento)).split(',')[0]}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <ClinicalMetric icon="medkit-outline" label="Consultas" value={overview.totalConsultas} />
              <ClinicalMetric
                icon="pulse-outline"
                label="Condiciones activas"
                value={overview.condicionesActivas}
                alert={Number(overview.condicionesActivas || 0) > 0}
              />
              <ClinicalMetric icon="medical-outline" label="Medicaciones" value={overview.medicacionesActivas} />
              <ClinicalMetric
                icon="warning-outline"
                label="Alergias"
                value={overview.alergiasActivas}
                alert={Number(overview.alergiasActivas || 0) > 0}
              />
            </View>
          </View>

          <View style={styles.historyHeading}>
            <View>
              <AppText style={styles.historyTitle}>Historial clínico completo</AppText>
              <AppText style={styles.historySubtitle}>
                {sections.length} secciones disponibles · actualizado{' '}
                {formatDateTime(history.generatedAt)}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.newCodeButton}
              onPress={() => {
                setHistory(null);
                setCode('');
                setError(null);
                setSectionQuery('');
                setActiveCategory('todos');
              }}
            >
              <Ionicons name="key-outline" size={16} color={appColors.info} />
              <AppText style={styles.newCodeText}>Otro código</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.historyTools}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={appColors.textMuted} />
              <AppTextInput
                value={sectionQuery}
                onChangeText={setSectionQuery}
                placeholder="Buscar en el historial"
                placeholderTextColor={appColors.textMuted}
                style={styles.searchInput}
              />
              {sectionQuery ? (
                <TouchableOpacity onPress={() => setSectionQuery('')}>
                  <Ionicons name="close-circle" size={18} color={appColors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {(Object.keys(CATEGORY_LABELS) as SectionCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    activeCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <AppText
                    style={[
                      styles.categoryText,
                      activeCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[category]}
                  </AppText>
                  <View
                    style={[
                      styles.categoryCount,
                      activeCategory === category && styles.categoryCountActive,
                    ]}
                  >
                    <AppText style={styles.categoryCountText}>{categoryCounts[category]}</AppText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.sectionsGrid, desktop && styles.sectionsGridDesktop]}>
            {filteredSections.map(([sectionKey, value]) => (
              <HistorySection
                key={sectionKey}
                sectionKey={sectionKey}
                title={SECTION_LABELS[sectionKey] || humanizeKey(sectionKey)}
                value={value}
              />
            ))}
            {!filteredSections.length ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={27} color={appColors.textMuted} />
                <AppText style={styles.noResultsTitle}>No encontramos esa sección</AppText>
                <AppText style={styles.noResultsText}>
                  Prueba otra búsqueda o selecciona la categoría Todo.
                </AppText>
              </View>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ClinicalMetric({
  icon,
  label,
  value,
  alert = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: unknown;
  alert?: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, alert && styles.metricIconAlert]}>
        <Ionicons
          name={icon}
          size={17}
          color={alert ? appColors.accent : appColors.info}
        />
      </View>
      <View>
        <AppText style={styles.metricValue}>{getText(value) || '0'}</AppText>
        <AppText style={styles.metricLabel}>{label}</AppText>
      </View>
    </View>
  );
}

function HistorySection({
  sectionKey,
  title,
  value,
}: {
  sectionKey: string;
  title: string;
  value: unknown;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = getSectionCount(value);
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded((current) => !current)}
      >
        <View style={styles.sectionIcon}>
          <Ionicons
            name={SECTION_ICONS[sectionKey] || 'folder-outline'}
            size={19}
            color={appColors.info}
          />
        </View>
        <View style={styles.sectionHeaderCopy}>
          <AppText style={styles.sectionTitle}>{title}</AppText>
          <AppText style={styles.sectionCount}>
            {count ? `${count} elementos` : 'Información clínica'}
          </AppText>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={19}
          color={appColors.textMuted}
        />
      </TouchableOpacity>
      {expanded ? <View style={styles.sectionBody}>{renderValue(value)}</View> : null}
    </View>
  );
}

function renderValue(value: unknown, depth = 0, fieldKey = ''): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <AppText style={styles.emptyValue}>Sin información registrada</AppText>;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    const formatted =
      typeof value === 'boolean'
        ? value
          ? 'Sí'
          : 'No'
        : typeof value === 'string' && looksLikeDate(fieldKey, value)
          ? formatDateTime(value)
          : String(value);
    return <AppText style={styles.valueText}>{formatted}</AppText>;
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return <AppText style={styles.emptyValue}>Sin registros</AppText>;
    }
    return (
      <View style={styles.arrayList}>
        {value.map((item, index) => (
          <View key={index} style={styles.recordCard}>
            <AppText style={styles.recordNumber}>REGISTRO {index + 1}</AppText>
            {renderValue(item, depth + 1, fieldKey)}
          </View>
        ))}
      </View>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) {
      return <AppText style={styles.emptyValue}>Sin datos</AppText>;
    }
    return (
      <View style={depth ? styles.nestedObject : styles.objectGrid}>
        {entries.map(([key, item]) => (
          <View key={key} style={styles.field}>
            <AppText style={styles.fieldLabel}>{humanizeKey(key)}</AppText>
            {renderValue(item, depth + 1, key)}
          </View>
        ))}
      </View>
    );
  }
  return <AppText style={styles.valueText}>{String(value)}</AppText>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  content: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: 16, paddingBottom: 50 },
  hero: { padding: 22, borderRadius: 23, borderWidth: 1, borderColor: appColors.borderStrong, backgroundColor: appColors.surfaceStrong },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28 },
  heroIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 19, marginRight: 16, backgroundColor: colorAlpha(appColors.info, '16') },
  heroCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: appColors.text, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 5 },
  subtitle: { color: appColors.textSoft, fontSize: 12, lineHeight: 19, marginTop: 6, maxWidth: 720 },
  doctorBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, marginTop: 14, borderRadius: 99, backgroundColor: colorAlpha(appColors.success, '12') },
  doctorBadgeText: { color: appColors.success, fontSize: 10, fontWeight: '900' },
  codeCard: { width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center', padding: 28, marginTop: 18, borderRadius: 23, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  codeHeaderIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colorAlpha(appColors.info, '14') },
  codeTitle: { color: appColors.text, fontSize: 22, fontWeight: '900', marginTop: 15 },
  codeHelper: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 5 },
  codeInput: { width: '100%', minHeight: 75, marginTop: 20, borderRadius: 16, borderWidth: 1, borderColor: colorAlpha(appColors.info, '65'), backgroundColor: appColors.backgroundMuted, color: appColors.text, fontSize: 35, fontWeight: '900', textAlign: 'center', letterSpacing: 13, outlineStyle: 'none' } as any,
  digitGuide: { flexDirection: 'row', gap: 8, marginTop: 11 },
  guideDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: appColors.borderStrong },
  guideDotFilled: { backgroundColor: appColors.success },
  redeemButton: { width: '100%', minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 19, borderRadius: 14, backgroundColor: appColors.info },
  redeemButtonText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  buttonDisabled: { opacity: 0.45 },
  errorBox: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, marginTop: 12, borderRadius: 11, backgroundColor: colorAlpha(appColors.accent, '10') },
  errorText: { flex: 1, color: appColors.accent, fontSize: 10, lineHeight: 15 },
  sessionCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13, padding: 17, marginTop: 15, borderRadius: 18, borderWidth: 1, borderColor: colorAlpha(appColors.success, '55'), backgroundColor: colorAlpha(appColors.success, '0C') },
  sessionExpired: { borderColor: colorAlpha(appColors.accent, '55'), backgroundColor: colorAlpha(appColors.accent, '0C') },
  sessionCopy: { flex: 1, minWidth: 220 },
  sessionEyebrow: { color: appColors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sessionTitle: { color: appColors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
  sessionMeta: { color: appColors.textMuted, fontSize: 9, marginTop: 4 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 120, padding: 10, borderRadius: 12, backgroundColor: colorAlpha(appColors.success, '12') },
  timerExpired: { backgroundColor: colorAlpha(appColors.accent, '12') },
  timerLabel: { color: appColors.textMuted, fontSize: 8 },
  timerValue: { color: appColors.success, fontSize: 17, fontWeight: '900', marginTop: 1 },
  timerValueExpired: { color: appColors.accent },
  editButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 15, borderRadius: 12, backgroundColor: appColors.success },
  editButtonText: { color: appColors.background, fontSize: 11, fontWeight: '900' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  noteCopy: { flex: 1 },
  noteLabel: { color: appColors.info, fontSize: 9, fontWeight: '900' },
  noteText: { color: appColors.textSoft, fontSize: 11, lineHeight: 17, marginTop: 3 },
  patientCard: { padding: 18, marginTop: 14, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  patientMain: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginRight: 13, backgroundColor: colorAlpha(appColors.info, '18') },
  patientInitials: { color: appColors.info, fontSize: 20, fontWeight: '900' },
  patientIdentity: { flex: 1 },
  patientOverline: { color: appColors.info, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  patientName: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 3 },
  patientDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 7 },
  patientDetail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  patientDetailText: { color: appColors.textMuted, fontSize: 10 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 17 },
  metricCard: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 13, backgroundColor: appColors.backgroundMuted },
  metricIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colorAlpha(appColors.info, '12') },
  metricIconAlert: { backgroundColor: colorAlpha(appColors.accent, '12') },
  metricValue: { color: appColors.text, fontSize: 17, fontWeight: '900' },
  metricLabel: { color: appColors.textMuted, fontSize: 8, marginTop: 1 },
  historyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22, marginBottom: 12 },
  historyTitle: { color: appColors.text, fontSize: 21, fontWeight: '900' },
  historySubtitle: { color: appColors.textMuted, fontSize: 10, marginTop: 3 },
  newCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 39, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  newCodeText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  historyTools: { gap: 10, padding: 11, marginBottom: 11, borderRadius: 16, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  searchBox: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 11, backgroundColor: appColors.backgroundMuted },
  searchInput: { flex: 1, minHeight: 41, paddingHorizontal: 0, borderWidth: 0, color: appColors.text, fontSize: 11, outlineStyle: 'none' } as any,
  categoryList: { gap: 7 },
  categoryChip: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  categoryChipActive: { borderColor: appColors.info, backgroundColor: colorAlpha(appColors.info, '16') },
  categoryText: { color: appColors.textMuted, fontSize: 9, fontWeight: '800' },
  categoryTextActive: { color: appColors.info },
  categoryCount: { minWidth: 19, height: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: 10, backgroundColor: appColors.surfaceStrong },
  categoryCountActive: { backgroundColor: colorAlpha(appColors.info, '24') },
  categoryCountText: { color: appColors.textSoft, fontSize: 8, fontWeight: '900' },
  sectionsGrid: { gap: 11 },
  sectionsGridDesktop: {},
  sectionCard: { borderRadius: 17, borderWidth: 1, borderColor: appColors.border, overflow: 'hidden', backgroundColor: appColors.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: appColors.surfaceStrong },
  sectionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginRight: 10, backgroundColor: colorAlpha(appColors.info, '13') },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { color: appColors.text, fontSize: 14, fontWeight: '900' },
  sectionCount: { color: appColors.textMuted, fontSize: 9, marginTop: 2 },
  sectionBody: { padding: 13, backgroundColor: appColors.backgroundMuted },
  objectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nestedObject: { gap: 7, marginTop: 5 },
  field: { flex: 1, minWidth: 220, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  fieldLabel: { color: appColors.info, fontSize: 9, fontWeight: '900', textTransform: 'capitalize', marginBottom: 4 },
  valueText: { color: appColors.textSoft, fontSize: 10, lineHeight: 16 },
  emptyValue: { color: appColors.textMuted, fontSize: 10, fontStyle: 'italic' },
  arrayList: { gap: 8 },
  recordCard: { padding: 10, borderRadius: 11, borderWidth: 1, borderColor: colorAlpha(appColors.info, '25'), backgroundColor: colorAlpha(appColors.info, '07') },
  recordNumber: { color: appColors.info, fontSize: 8, fontWeight: '900', letterSpacing: 0.6, marginBottom: 6 },
  noResults: { alignItems: 'center', padding: 28, borderRadius: 17, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  noResultsTitle: { color: appColors.text, fontSize: 14, fontWeight: '900', marginTop: 8 },
  noResultsText: { color: appColors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  accessScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: appColors.background },
  accessCard: { width: '100%', maxWidth: 440, alignItems: 'center', padding: 28, borderRadius: 23, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  accessIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: colorAlpha(appColors.info, '15') },
  accessTitle: { color: appColors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 15 },
  accessText: { color: appColors.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  accessButton: { minHeight: 46, minWidth: 175, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 12, marginTop: 18, backgroundColor: appColors.info },
  accessButtonText: { color: appColors.background, fontWeight: '900' },
});
