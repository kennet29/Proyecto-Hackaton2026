/**
 * @file App movil/GestionSaludExpo/src/screens/PeriodoScreen.tsx
 * @description TypeScript module implementation.
 */

import { RecordActions } from '../components/RecordActions';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { AppColors, useAppColors } from '../theme/useAppColors';

type PeriodoRecord = {
  periodoId: number;
  pacienteId: number;
  fechaInicio: string;
  fechaFin: string | null;
  duracionDias: number | null;
  cicloDias: number | null;
  flujo: string | null;
  dolor: string | null;
  sintomas: string[];
  observaciones: string | null;
};

type PeriodoHistorial = {
  pacienteId: number;
  totalRegistros: number;
  promedioDuracionDias: number | null;
  promedioCicloDias: number | null;
  ultimoPeriodo: PeriodoRecord | null;
  registros: PeriodoRecord[];
};

type PeriodoPrediction = {
  confianza?: string | null;
  proximoPeriodo?: {
    fechaInicio: string;
    fechaFin: string;
    duracionDias: number;
    cicloDias: number;
  } | null;
  ventanaFertil?: {
    inicio: string;
    fin: string;
  } | null;
  ovulacionEstimada?: string | null;
};

const today = () => toLocalDateOnlyString();
const PERIODO_EXTRA_PASSWORD =
  process.env.EXPO_PUBLIC_PERIODO_EXTRA_PASSWORD?.trim() || 'Periodo2026!';

const normalizeSexo = (value?: string | null) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase();
};

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

const formatEnum = (value?: string | null) => {
  if (!value) return 'No registrado';
  return value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
};

export function PeriodoScreen() {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? colors.background : colors.text;
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [modulePassword, setModulePassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [historial, setHistorial] = useState<PeriodoHistorial | null>(null);
  const [prediction, setPrediction] = useState<PeriodoPrediction | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fechaInicio: today(),
    fechaFin: '',
    duracionDias: '',
    cicloDias: '',
    flujo: 'moderado',
    dolor: 'leve',
    sintomas: '',
    observaciones: '',
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
      const femalePatients = items.filter((item) => normalizeSexo(item.sexo) === 'F');

      setPatients(femalePatients);
      const defaultPatient = femalePatients[0]?.pacienteId
        ? String(femalePatients[0].pacienteId)
        : '';
      setSelectedPatientId((prev) => prev || defaultPatient);
      if (!femalePatients.length) {
        setIsUnlocked(false);
      }
      setForm((prev) => ({
        ...prev,
        pacienteId: prev.pacienteId || defaultPatient,
      }));
    } catch (error) {
      setPatientError(
        error instanceof Error ? error.message : 'No se pudieron cargar las pacientes',
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const loadData = useCallback(
    async (patientId: string, useRefresh = false) => {
      if (!patientId || !token) {
        setHistorial(null);
        setPrediction(null);
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
          `${API_URL}/periodo/paciente/${patientId}/historial`,
          { headers: authHeaders },
        );
        const historialBody = await historialResponse.json().catch(() => null);

        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }

        setHistorial(historialBody);

        const predictionResponse = await fetch(
          `${API_URL}/periodo/paciente/${patientId}/prediccion`,
          { headers: authHeaders },
        );
        const predictionBody = await predictionResponse.json().catch(() => null);

        if (predictionResponse.ok) {
          setPrediction(predictionBody);
        } else {
          setPrediction(null);
        }
      } catch (error) {
        setDataError(
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del módulo',
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
    if (selectedPatientId && isUnlocked) {
      loadData(selectedPatientId);
    }
  }, [isUnlocked, loadData, selectedPatientId]);

  const handleUnlock = () => {
    if (!patients.length) {
      Alert.alert(
        'Acceso no disponible',
        'El módulo de periodo requiere al menos una persona de género femenino registrada.',
      );
      return;
    }

    if (!modulePassword.trim()) {
      Alert.alert('Clave requerida', 'Ingresa la contraseña adicional del módulo.');
      return;
    }

    if (modulePassword.trim() !== PERIODO_EXTRA_PASSWORD) {
      Alert.alert('Clave incorrecta', 'La contraseña adicional del módulo no coincide.');
      return;
    }

    setIsUnlocked(true);
    setModulePassword('');
  };

  const handleSubmit = async () => {
    if (!patients.length) {
      Alert.alert(
        'Módulo bloqueado',
        'Debes tener al menos una paciente femenina vinculada para usar este módulo.',
      );
      return;
    }

    if (!isUnlocked) {
      Alert.alert('Acceso protegido', 'Desbloquea el módulo con la contraseña adicional.');
      return;
    }

    if (!form.pacienteId || !form.fechaInicio) {
      Alert.alert('Campos requeridos', 'Paciente y fecha de inicio son obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
          pacienteId: Number(form.pacienteId),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || undefined,
          duracionDias: form.duracionDias ? Number(form.duracionDias) : undefined,
          cicloDias: form.cicloDias ? Number(form.cicloDias) : undefined,
          flujo: form.flujo || undefined,
          dolor: form.dolor || undefined,
          sintomas: form.sintomas
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          observaciones: form.observaciones || undefined,
          creadoPor: user?.username ?? undefined,
        };
      const result = await submitJsonWithOfflineFallback({ token, path: '/periodo', method: 'POST', body: payload, description: 'registrar período' });
      if (result.status === 'queued') Alert.alert('Guardado sin conexión', 'El período se sincronizará automáticamente al recuperar internet.');

      if (result.status === 'online') Alert.alert('Registro creado', 'El periodo se guardó correctamente');
      setForm((prev) => ({
        ...prev,
        fechaInicio: today(),
        fechaFin: '',
        duracionDias: '',
        cicloDias: '',
        flujo: 'moderado',
        dolor: 'leve',
        sintomas: '',
        observaciones: '',
      }));
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientLabel = useMemo(
    () => patients.find((item) => String(item.pacienteId) === selectedPatientId)?.displayName,
    [patients, selectedPatientId],
  );
  const hasFemalePatients = patients.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(selectedPatientId, true)}
          tintColor={colors.text}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIcon}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroEyebrow}>Bienestar femenino</AppText>
            <AppText style={styles.heroTitle}>Módulo de Periodo</AppText>
          </View>
        </View>
        <AppText style={styles.heroText}>
          Registra ciclos, síntomas y revisa la predicción del siguiente periodo.
        </AppText>
        <View style={styles.heroChips}>
          <View style={styles.chip}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} />
            <AppText style={styles.chipText}>Ciclos</AppText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="pulse-outline" size={14} color={colors.info} />
            <AppText style={styles.chipText}>Síntomas</AppText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="analytics-outline" size={14} color={colors.success} />
            <AppText style={styles.chipText}>Predicción</AppText>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText style={styles.sectionLabel}>Seguridad</AppText>
            <AppText style={styles.sectionTitle}>Acceso y validación</AppText>
          </View>
          <View
            style={[
              styles.statusBadge,
              isUnlocked ? styles.statusBadgeSuccess : styles.statusBadgeLocked,
            ]}
          >
            <Ionicons
              name={isUnlocked ? 'lock-open-outline' : 'lock-closed-outline'}
              size={14}
              color={isUnlocked ? colors.success : colors.accent}
            />
            <AppText
              style={[
                styles.statusBadgeText,
                isUnlocked ? styles.statusBadgeTextSuccess : styles.statusBadgeTextLocked,
              ]}
            >
              {isUnlocked ? 'Activo' : 'Bloqueado'}
            </AppText>
          </View>
        </View>
        {!hasFemalePatients ? (
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <AppText style={styles.errorText}>
              Este módulo se habilita cuando existe una persona vinculada con género femenino.
            </AppText>
          </View>
        ) : isUnlocked ? (
          <>
            <AppText style={styles.successText}>
              Módulo desbloqueado. Ya puedes registrar y consultar periodos.
            </AppText>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setIsUnlocked(false);
                setHistorial(null);
                setPrediction(null);
              }}
            >
              <Ionicons name="lock-closed-outline" size={18} color={colors.text} />
              <AppText style={styles.secondaryBtnText}>Bloquear módulo</AppText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <AppText style={styles.helperText}>
              Se encontró al menos una paciente femenina. Ingresa la contraseña adicional para continuar.
            </AppText>
            <AppTextInput
              style={styles.input}
              value={modulePassword}
              onChangeText={setModulePassword}
              placeholder="Contraseña adicional del módulo"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUnlock}>
              <Ionicons name="lock-open-outline" size={18} color={colors.onAccent} />
              <AppText style={styles.primaryBtnText}>Desbloquear módulo</AppText>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!isUnlocked ? null : (
        <>
      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Paciente</AppText>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : patients.length === 0 ? (
          <AppText style={styles.emptyText}>
            No hay pacientes femeninas vinculadas para este módulo.
          </AppText>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
            >
              {patients.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={
                    patient.parentesco
                      ? `${patient.displayName} · ${patient.parentesco}`
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

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Nuevo registro</AppText>
        <AppTextInput
          style={styles.input}
          value={form.fechaInicio}
          onChangeText={(value) => handleChange('fechaInicio', value)}
          placeholder="Fecha inicio (YYYY-MM-DD)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <AppTextInput
          style={styles.input}
          value={form.fechaFin}
          onChangeText={(value) => handleChange('fechaFin', value)}
          placeholder="Fecha fin (opcional)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <AppTextInput
            style={[styles.input, styles.halfInput]}
            value={form.duracionDias}
            onChangeText={(value) => handleChange('duracionDias', value)}
            placeholder="Duración"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          <AppTextInput
            style={[styles.input, styles.halfInput]}
            value={form.cicloDias}
            onChangeText={(value) => handleChange('cicloDias', value)}
            placeholder="Ciclo"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.flujo} onValueChange={(value) => handleChange('flujo', String(value))}>
              <Picker.Item label="Flujo leve" value="leve" color={pickerItemColor} />
              <Picker.Item label="Flujo moderado" value="moderado" color={pickerItemColor} />
              <Picker.Item label="Flujo abundante" value="abundante" color={pickerItemColor} />
            </Picker>
          </View>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.dolor} onValueChange={(value) => handleChange('dolor', String(value))}>
              <Picker.Item label="Dolor leve" value="leve" color={pickerItemColor} />
              <Picker.Item label="Dolor moderado" value="moderado" color={pickerItemColor} />
              <Picker.Item label="Dolor intenso" value="intenso" color={pickerItemColor} />
              <Picker.Item label="Sin dolor" value="sin_dolor" color={pickerItemColor} />
            </Picker>
          </View>
        </View>
        <AppTextInput
          style={styles.input}
          value={form.sintomas}
          onChangeText={(value) => handleChange('sintomas', value)}
          placeholder="Síntomas separados por coma"
          placeholderTextColor={colors.textMuted}
        />
        <AppTextInput
          style={[styles.input, styles.textArea]}
          value={form.observaciones}
          onChangeText={(value) => handleChange('observaciones', value)}
          placeholder="Observaciones"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.onAccent} />
              <AppText style={styles.primaryBtnText}>Guardar periodo</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Resumen</AppText>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
            <AppText style={styles.loadingText}>Cargando historial...</AppText>
          </View>
        ) : !selectedPatientId ? (
          <AppText style={styles.emptyText}>Selecciona una paciente para ver información.</AppText>
        ) : (
          <>
            <AppText style={styles.metricText}>Paciente: {selectedPatientLabel ?? `#${selectedPatientId}`}</AppText>
            <AppText style={styles.metricText}>
              Total de registros: {historial?.totalRegistros ?? 0}
            </AppText>
            <AppText style={styles.metricText}>
              Promedio de duración: {historial?.promedioDuracionDias ?? 'Sin dato'}
            </AppText>
            <AppText style={styles.metricText}>
              Promedio de ciclo: {historial?.promedioCicloDias ?? 'Sin dato'}
            </AppText>
            {prediction?.proximoPeriodo ? (
              <View style={styles.highlightBox}>
                <AppText style={styles.highlightTitle}>Siguiente predicción</AppText>
                <AppText style={styles.highlightText}>
                  Inicio: {formatDate(prediction.proximoPeriodo.fechaInicio)}
                </AppText>
                <AppText style={styles.highlightText}>
                  Fin: {formatDate(prediction.proximoPeriodo.fechaFin)}
                </AppText>
                <AppText style={styles.highlightText}>
                  Ovulación estimada: {formatDate(prediction.ovulacionEstimada)}
                </AppText>
                {prediction.ventanaFertil ? (
                  <AppText style={styles.highlightText}>
                    Ventana fértil: {formatDate(prediction.ventanaFertil.inicio)} al{' '}
                    {formatDate(prediction.ventanaFertil.fin)}
                  </AppText>
                ) : null}
              </View>
            ) : null}
            {dataError ? <AppText style={styles.errorText}>{dataError}</AppText> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Historial reciente</AppText>
        {historial?.registros?.length ? (
          historial.registros.slice(0, 6).map((item) => (
<View key={item.periodoId} style={styles.listItem}>
<RecordActions resource="periodo" recordId={item.periodoId} onChanged={() => loadData(selectedPatientId, true)} />
              <AppText style={styles.itemTitle}>
                {formatDate(item.fechaInicio)} {item.fechaFin ? `- ${formatDate(item.fechaFin)}` : ''}
              </AppText>
              <AppText style={styles.itemText}>
                Flujo: {formatEnum(item.flujo)} · Dolor: {formatEnum(item.dolor)}
              </AppText>
              <AppText style={styles.itemText}>
                Duración: {item.duracionDias ?? 'N/D'} días · Ciclo: {item.cicloDias ?? 'N/D'} días
              </AppText>
              {item.sintomas?.length ? (
                <AppText style={styles.itemText}>Síntomas: {item.sintomas.join(', ')}</AppText>
              ) : null}
            </View>
          ))
        ) : (
          <AppText style={styles.emptyText}>Todavía no hay registros para esta paciente.</AppText>
        )}
      </View>
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: 'transparent',
    gap: 14,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, 'CC'),
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(colors.accent, '28'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, '65'),
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  heroText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colorAlpha(colors.backgroundMuted, 'C8'),
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colorAlpha(colors.border, '9A'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: colorAlpha(colors.success, '18'),
    borderColor: colorAlpha(colors.success, '6B'),
  },
  statusBadgeLocked: {
    backgroundColor: colorAlpha(colors.accent, '18'),
    borderColor: colorAlpha(colors.accent, '6B'),
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadgeTextSuccess: {
    color: colors.success,
  },
  statusBadgeTextLocked: {
    color: colors.accent,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colorAlpha(colors.accent, '12'),
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 92,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
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
    flex: 1,
    lineHeight: 20,
    fontWeight: '700',
  },
  successText: {
    color: colors.success,
    lineHeight: 20,
    fontWeight: '700',
  },
  helperText: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  metricText: {
    color: colors.text,
    fontSize: 14,
  },
  highlightBox: {
    backgroundColor: colorAlpha(colors.accent, '18'),
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, '4D'),
  },
  highlightTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  highlightText: {
    color: colors.accent,
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: colorAlpha(colors.backgroundMuted, '88'),
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  itemText: {
    color: colors.textSoft,
  },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colorAlpha(colors.backgroundMuted, '80'),
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
