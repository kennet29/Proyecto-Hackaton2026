import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_URL } from '../config/api';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'HistorialCompartido'>;

type SharedHistoryResponse = {
  generatedAt?: string;
  expiresAt?: string;
  permiso?: {
    permisoId?: number;
    pacienteId?: number;
    medicoId?: number;
    tipo?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string | null;
    notas?: string | null;
  };
  secciones?: string[];
  data?: Record<string, unknown>;
};

const SECTION_LABELS: Record<string, string> = {
  resumenClinico: 'Resumen clinico',
  consultasMedicas: 'Consultas medicas',
  saludMental: 'Salud mental',
  periodo: 'Periodo',
  seguimientoFisico: 'Seguimiento fisico',
  seguimientoPostevento: 'Seguimiento postevento',
  examenesClinicos: 'Examenes clinicos',
  citasMedicas: 'Citas medicas',
  medicaciones: 'Medicaciones',
  vacunas: 'Vacunas',
  alergias: 'Alergias',
  condicionesCronicas: 'Condiciones cronicas',
  antecedentesFamiliares: 'Antecedentes familiares',
  documentosClinicos: 'Documentos clinicos',
  desparasitaciones: 'Desparasitaciones',
  embarazos: 'Embarazos',
  estiloVida: 'Estilo de vida',
  evaluacionesHabitos: 'Evaluaciones de habitos',
  habitosEspecificos: 'Habitos especificos',
  lesiones: 'Lesiones',
  notificaciones: 'Notificaciones',
  operaciones: 'Operaciones',
  puntajesRiesgo: 'Puntajes de riesgo',
  recordatoriosCitas: 'Recordatorios de citas',
  registroDental: 'Registro dental',
  registrosMenstruales: 'Registros menstruales',
};

const extractToken = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const tokenFromPath = url.pathname.split('/').filter(Boolean).pop();
    const tokenFromQuery = url.searchParams.get('token');
    return tokenFromQuery || tokenFromPath || trimmed;
  } catch {
    const withoutScheme = trimmed.replace(/^gestionsalud:\/\/historial-compartido\/?/i, '');
    return withoutScheme.split(/[?#]/)[0].trim();
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
};

const humanizeKey = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

const renderValue = (value: unknown, depth = 0): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <AppText style={styles.emptyValue}>Sin dato</AppText>;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <AppText style={styles.valueText}>{String(value)}</AppText>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <AppText style={styles.emptyValue}>Sin registros</AppText>;
    }
    return (
      <View style={styles.arrayList}>
        {value.slice(0, 8).map((item, index) => (
          <View key={index} style={styles.arrayItem}>
            <AppText style={styles.arrayIndex}>#{index + 1}</AppText>
            {renderValue(item, depth + 1)}
          </View>
        ))}
        {value.length > 8 ? <AppText style={styles.moreText}>+{value.length - 8} registros mas</AppText> : null}
      </View>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => item !== undefined,
    );
    if (!entries.length) {
      return <AppText style={styles.emptyValue}>Sin datos</AppText>;
    }
    return (
      <View style={[styles.objectBox, depth > 0 && styles.objectBoxNested]}>
        {entries.slice(0, 12).map(([key, item]) => (
          <View key={key} style={styles.fieldRow}>
            <AppText style={styles.fieldLabel}>{humanizeKey(key)}</AppText>
            {renderValue(item, depth + 1)}
          </View>
        ))}
        {entries.length > 12 ? (
          <AppText style={styles.moreText}>+{entries.length - 12} campos mas</AppText>
        ) : null}
      </View>
    );
  }

  return <AppText style={styles.valueText}>{String(value)}</AppText>;
};

export function HistorialCompartidoScreen({ route }: Props) {
  const initialToken = route.params?.token ?? '';
  const [inputValue, setInputValue] = useState(initialToken);
  const [sharedHistory, setSharedHistory] = useState<SharedHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => extractToken(inputValue), [inputValue]);

  const loadSharedHistory = useCallback(async () => {
    if (!token) {
      setError('Pega el enlace o codigo recibido para abrir el historial.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permiso-acceso/compartido/${encodeURIComponent(token)}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo abrir el historial compartido.');
      }
      setSharedHistory(payload as SharedHistoryResponse);
    } catch (requestError) {
      setSharedHistory(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo abrir el historial compartido.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (initialToken) {
      void loadSharedHistory();
    }
  }, [initialToken, loadSharedHistory]);

  const sections = sharedHistory?.data ? Object.entries(sharedHistory.data) : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="open-outline" size={16} color={appColors.info} />
          <AppText style={styles.heroBadgeText}>Historial compartido</AppText>
        </View>
        <AppText style={styles.title}>Abrir enlace o codigo</AppText>
        <AppText style={styles.subtitle}>
          Pega el enlace web, el enlace interno de la app o el codigo recibido para consultar las
          secciones autorizadas.
        </AppText>
      </View>

      <View style={styles.formCard}>
        <AppText style={styles.label}>Enlace o codigo</AppText>
        <AppTextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="gestionsalud://historial-compartido/... o codigo"
          placeholderTextColor={appColors.textMuted}
          autoCapitalize="none"
          multiline
        />
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={() => void loadSharedHistory()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={appColors.text} />
          ) : (
            <>
              <Ionicons name="eye-outline" size={18} color={appColors.text} />
              <AppText style={styles.primaryButtonText}>Abrir historial</AppText>
            </>
          )}
        </TouchableOpacity>
        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
      </View>

      {sharedHistory ? (
        <View style={styles.summaryCard}>
          <AppText style={styles.sectionTitle}>Permiso</AppText>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Paciente</AppText>
              <AppText style={styles.metaValue}>#{sharedHistory.permiso?.pacienteId ?? 'N/D'}</AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Medico</AppText>
              <AppText style={styles.metaValue}>#{sharedHistory.permiso?.medicoId ?? 'N/D'}</AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Estado</AppText>
              <AppText style={styles.metaValue}>{sharedHistory.permiso?.estado ?? 'N/D'}</AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Expira</AppText>
              <AppText style={styles.metaValue}>{formatDateTime(sharedHistory.expiresAt)}</AppText>
            </View>
          </View>
        </View>
      ) : null}

      {sections.map(([sectionKey, sectionValue]) => (
        <View key={sectionKey} style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>{SECTION_LABELS[sectionKey] ?? humanizeKey(sectionKey)}</AppText>
          {renderValue(sectionValue)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: appColors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  formCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  label: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    minHeight: 76,
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    color: appColors.text,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  errorText: {
    color: appColors.accent,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: colorAlpha(appColors.success, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '55'),
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: appColors.backgroundMuted,
  },
  metaLabel: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  objectBox: {
    gap: 10,
    marginTop: 12,
  },
  objectBoxNested: {
    marginTop: 6,
  },
  fieldRow: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  fieldLabel: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  valueText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyValue: {
    color: appColors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  arrayList: {
    gap: 10,
    marginTop: 8,
  },
  arrayItem: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: colorAlpha(appColors.info, '08'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '22'),
  },
  arrayIndex: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  moreText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
