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

const isDoctor = (role?: string) => role?.trim().toLowerCase() === 'medico';

const humanizeKey = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

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

  const sections = history ? Object.entries(history.data) : [];

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
              }}
            >
              <Ionicons name="key-outline" size={16} color={appColors.info} />
              <AppText style={styles.newCodeText}>Otro código</AppText>
            </TouchableOpacity>
          </View>

          <View style={[styles.sectionsGrid, desktop && styles.sectionsGridDesktop]}>
            {sections.map(([sectionKey, value]) => (
              <HistorySection
                key={sectionKey}
                title={SECTION_LABELS[sectionKey] || humanizeKey(sectionKey)}
                value={value}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function HistorySection({ title, value }: { title: string; value: unknown }) {
  const [expanded, setExpanded] = useState(true);
  const count = Array.isArray(value)
    ? value.length
    : value && typeof value === 'object'
      ? Object.keys(value as object).length
      : 0;
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded((current) => !current)}
      >
        <View style={styles.sectionIcon}>
          <Ionicons name="folder-open-outline" size={19} color={appColors.info} />
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

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <AppText style={styles.emptyValue}>Sin información registrada</AppText>;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return <AppText style={styles.valueText}>{String(value)}</AppText>;
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
            {renderValue(item, depth + 1)}
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
            {renderValue(item, depth + 1)}
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
  historyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22, marginBottom: 12 },
  historyTitle: { color: appColors.text, fontSize: 21, fontWeight: '900' },
  historySubtitle: { color: appColors.textMuted, fontSize: 10, marginTop: 3 },
  newCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 39, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  newCodeText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  sectionsGrid: { gap: 11 },
  sectionsGridDesktop: {},
  sectionCard: { borderRadius: 17, borderWidth: 1, borderColor: appColors.border, overflow: 'hidden', backgroundColor: appColors.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: appColors.surfaceStrong },
  sectionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginRight: 10, backgroundColor: colorAlpha(appColors.info, '13') },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { color: appColors.text, fontSize: 14, fontWeight: '900' },
  sectionCount: { color: appColors.textMuted, fontSize: 9, marginTop: 2 },
  sectionBody: { padding: 13 },
  objectGrid: { gap: 8 },
  nestedObject: { gap: 7, marginTop: 5 },
  field: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  fieldLabel: { color: appColors.info, fontSize: 9, fontWeight: '900', textTransform: 'capitalize', marginBottom: 4 },
  valueText: { color: appColors.textSoft, fontSize: 10, lineHeight: 16 },
  emptyValue: { color: appColors.textMuted, fontSize: 10, fontStyle: 'italic' },
  arrayList: { gap: 8 },
  recordCard: { padding: 10, borderRadius: 11, borderWidth: 1, borderColor: colorAlpha(appColors.info, '25'), backgroundColor: colorAlpha(appColors.info, '07') },
  recordNumber: { color: appColors.info, fontSize: 8, fontWeight: '900', letterSpacing: 0.6, marginBottom: 6 },
  accessScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: appColors.background },
  accessCard: { width: '100%', maxWidth: 440, alignItems: 'center', padding: 28, borderRadius: 23, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  accessIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: colorAlpha(appColors.info, '15') },
  accessTitle: { color: appColors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 15 },
  accessText: { color: appColors.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  accessButton: { minHeight: 46, minWidth: 175, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 12, marginTop: 18, backgroundColor: appColors.info },
  accessButtonText: { color: appColors.background, fontWeight: '900' },
});
