/**
 * @file App movil/GestionSaludExpo/src/screens/HabitosScreen.tsx
 * @description TypeScript module implementation.
 */

import { RecordActions } from '../components/RecordActions';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { NanoSectionIllustration } from '../components/NanoSectionIllustration';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Habitos'>;

type TipoHabito = {
  tipohabitoId: number;
  nombre: string;
  categoria?: string | null;
};

type Habito = {
  habitoId: number;
  pacienteId: number;
  tipohabitoId: number;
  categoria?: string | null;
  nivel?: string | null;
  frecuencia?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  inicio?: string | null;
  impactosalud?: string | null;
  observaciones?: string | null;
};

const today = () => toLocalDateOnlyString();

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = parseCalendarDate(value);
  return date ? date.toLocaleDateString('es-NI') : value;
};

const getImpactAccent = (value?: string | null) => {
  const normalized = (value ?? '').toLowerCase();
  if (normalized.includes('alto') || normalized.includes('severo') || normalized.includes('riesgo')) {
    return '#FF4D73';
  }
  if (normalized.includes('medio') || normalized.includes('moderado')) {
    return '#FF4D73';
  }
  if (normalized.includes('bajo') || normalized.includes('positivo') || normalized.includes('saludable')) {
    return '#38E28E';
  }
  return '#29B6FF';
};

export function HabitosScreen(_: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? colors.background : colors.text;
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [types, setTypes] = useState<TipoHabito[]>([]);
  const [records, setRecords] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hydrationSaving, setHydrationSaving] = useState(false);
  const [hydrationMessage, setHydrationMessage] = useState('');
  const [form, setForm] = useState({
    pacienteId: '',
    tipohabitoId: '',
    categoria: '',
    nivel: '',
    frecuencia: '',
    cantidad: '',
    unidad: '',
    inicio: today(),
    impactosalud: '',
    observaciones: '',
  });

  const headers = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }, [token]);

  const selectedPatientId = Number(form.pacienteId);
  const selectedPatient = patients.find((patient) => String(patient.pacienteId) === form.pacienteId) ?? null;
  const hydrationType = types.find((type) => /agua|hidrat/i.test(`${type.nombre} ${type.categoria ?? ''}`)) ?? null;

  const visibleRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      if (!selectedPatientId) return true;
      return Number(record.pacienteId) === selectedPatientId;
    });

    return filtered.slice().sort((left, right) => {
      const leftDate = left.inicio ?? '';
      const rightDate = right.inicio ?? '';
      return rightDate.localeCompare(leftDate);
    });
  }, [records, selectedPatientId]);

  const hydrationToday = useMemo(() => visibleRecords
    .filter((record) => record.tipohabitoId === hydrationType?.tipohabitoId && record.inicio === today())
    .reduce((total, record) => {
      const amount = Number(record.cantidad ?? 0);
      const unit = (record.unidad ?? '').toLowerCase();
      return total + (unit.includes('ml') ? amount / 1000 : amount);
    }, 0), [hydrationType?.tipohabitoId, visibleRecords]);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [linkedPatients, typesResponse, recordsResponse] = await Promise.all([
        fetchLinkedPatients(headers),
        fetch(`${API_URL}/tipohabito`, { headers }),
        fetch(`${API_URL}/habitoespecifico`, { headers }),
      ]);

      const typeBody = await typesResponse.json().catch(() => []);
      const recordBody = await recordsResponse.json().catch(() => []);

      if (!typesResponse.ok) {
        throw new Error(typeBody?.message ?? 'No se pudieron cargar los tipos de habito');
      }
      if (!recordsResponse.ok) {
        throw new Error(recordBody?.message ?? 'No se pudieron cargar los habitos');
      }

      const normalizedTypes = Array.isArray(typeBody) ? typeBody : [];
      setPatients(linkedPatients);
      setTypes(normalizedTypes);
      setRecords(Array.isArray(recordBody) ? recordBody : []);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudieron cargar los datos',
      );
    } finally {
      setLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const pacienteId = Number(form.pacienteId);
    const tipohabitoId = Number(form.tipohabitoId);
    if (!pacienteId || !tipohabitoId) {
      Alert.alert('Faltan datos', 'Selecciona un paciente y un tipo de habito');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/habitoespecifico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId,
          tipohabitoId,
          categoria: form.categoria.trim() || undefined,
          nivel: form.nivel.trim() || undefined,
          frecuencia: form.frecuencia.trim() || undefined,
          cantidad: form.cantidad.trim() ? Number(form.cantidad) : undefined,
          unidad: form.unidad.trim() || undefined,
          inicio: form.inicio.trim() || undefined,
          impactosalud: form.impactosalud.trim() || undefined,
          observaciones: form.observaciones.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar el habito');
      }
      Alert.alert('Habito registrado', 'El registro se guardo correctamente');
      setForm((prev) => ({
        ...prev,
        categoria: '',
        nivel: '',
        frecuencia: '',
        cantidad: '',
        unidad: '',
        inicio: today(),
        impactosalud: '',
        observaciones: '',
      }));
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const registerHydration = async (liters: number) => {
    if (!selectedPatient) {
      Alert.alert('Selecciona una persona', 'Elige primero quién está registrando su hidratación.');
      return;
    }
    if (!hydrationType) {
      Alert.alert('Falta el hábito de hidratación', 'Configura el tipo de hábito “Tomar agua” para usar el registro rápido.');
      return;
    }
    setHydrationSaving(true);
    setHydrationMessage('');
    try {
      const response = await fetch(`${API_URL}/habitoespecifico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: selectedPatient.pacienteId,
          tipohabitoId: hydrationType.tipohabitoId,
          categoria: 'hidratacion',
          nivel: 'saludable',
          frecuencia: 'diaria',
          cantidad: liters,
          unidad: 'litros',
          inicio: today(),
          impactosalud: 'positivo',
          observaciones: 'Registro rápido de hidratación',
          creadopor: user?.username ?? undefined,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudo registrar el agua.');
      setHydrationMessage(`Se agregaron ${Math.round(liters * 1000)} ml para ${selectedPatient.displayName}.`);
      await loadData();
    } catch (error) {
      Alert.alert('No se registró', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setHydrationSaving(false);
    }
  };

  const getTypeName = (id: number) =>
    types.find((type) => Number(type.tipohabitoId) === Number(id))?.nombre ?? `Tipo #${id}`;

  const insights = useMemo(() => {
    const total = visibleRecords.length;
    const riskCount = visibleRecords.filter((record) => {
      const normalized = (record.impactosalud ?? '').toLowerCase();
      return normalized.includes('alto') || normalized.includes('severo') || normalized.includes('riesgo');
    }).length;
    const healthyCount = visibleRecords.filter((record) => {
      const normalized = (record.impactosalud ?? '').toLowerCase();
      return normalized.includes('positivo') || normalized.includes('saludable') || normalized.includes('bajo');
    }).length;
    const latest = visibleRecords[0] ?? null;

    const summaryText = total
      ? healthyCount > riskCount
        ? 'Predominan habitos con impacto percibido favorable.'
        : riskCount > 0
          ? 'Hay habitos que conviene vigilar por su posible impacto en salud.'
          : 'Aun hace falta mas detalle para detectar patrones claros.'
      : 'Aun no hay suficientes registros para construir una lectura util.';

    return {
      latest,
      summaryText,
    };
  }, [visibleRecords]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.success} />
        <AppText style={styles.loadingText}>Cargando habitos...</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <NanoSectionIllustration section="alimentacion" size={76} />
        <View style={styles.headerCopy}>
          <AppText style={styles.headerBadgeText}>SEGUIMIENTO CONTINUO</AppText>
          <AppText style={styles.title}>Hábitos</AppText>
          <AppText style={styles.subtitle}>
            Registra agua, descanso, alimentación y actividad sin repetir información.
          </AppText>
        </View>
      </View>

      <View style={styles.personSelectorCard}>
        <View style={styles.personSelectorIcon}>
          <Ionicons name="person-outline" size={22} color="#0B6FEA" />
        </View>
        <View style={styles.personSelectorCopy}>
          <AppText style={styles.personSelectorLabel}>Persona</AppText>
          <View style={styles.personPickerShell}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
            >
              <Picker.Item label="Selecciona una persona" value="" color={pickerItemColor} />
              {patients.map((patient) => (
                <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} color={pickerItemColor} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.hydrationCard}>
        <View style={styles.hydrationHeader}>
          <NanoSectionIllustration section="alimentacion" size={72} />
          <View style={styles.hydrationCopy}>
            <AppText style={styles.hydrationEyebrow}>HIDRATACIÓN DIARIA</AppText>
            <AppText style={styles.hydrationTitle}>Agua registrada hoy</AppText>
            <AppText style={styles.hydrationAmount}>{hydrationToday.toFixed(2)} L</AppText>
            <AppText style={styles.hydrationPatient}>
              {selectedPatient ? selectedPatient.displayName : 'Selecciona quién registrará el agua'}
            </AppText>
          </View>
        </View>
        <View style={styles.hydrationActions}>
          {[0.25, 0.5, 0.75].map((liters) => (
            <TouchableOpacity
              key={liters}
              style={[styles.hydrationButton, hydrationSaving && styles.disabledButton]}
              onPress={() => void registerHydration(liters)}
              disabled={hydrationSaving}
              accessibilityLabel={`Registrar ${Math.round(liters * 1000)} mililitros de agua`}
            >
              <Ionicons name="water-outline" size={18} color="#FFFFFF" />
              <AppText style={styles.hydrationButtonText}>+{Math.round(liters * 1000)} ml</AppText>
            </TouchableOpacity>
          ))}
        </View>
        {hydrationSaving ? <ActivityIndicator color="#0B6FEA" /> : null}
        {hydrationMessage ? (
          <View style={styles.hydrationFeedback}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <AppText style={styles.hydrationFeedbackText}>{hydrationMessage}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Registrar otro hábito</AppText>
          <AppText style={styles.cardSubtitle}>Elige una actividad y completa únicamente sus datos.</AppText>
        </View>

        <AppText style={styles.label}>Hábito o actividad</AppText>
        <View style={styles.pickerShell}>
          <Picker
            selectedValue={form.tipohabitoId}
            onValueChange={(value) => {
              const nextType = types.find((type) => String(type.tipohabitoId) === String(value));
              setForm((current) => ({
                ...current,
                tipohabitoId: String(value),
                categoria: nextType?.categoria ?? '',
              }));
            }}
          >
            <Picker.Item label="Selecciona un hábito" value="" color={pickerItemColor} />
            {types.map((type) => (
              <Picker.Item
                key={type.tipohabitoId}
                label={type.nombre}
                value={String(type.tipohabitoId)}
                color={pickerItemColor}
              />
            ))}
          </Picker>
        </View>
        {types.length === 0 ? <AppText style={styles.warningText}>No hay tipos de hábito configurados.</AppText> : null}

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>¿Cómo fue?</AppText>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Nivel</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. bajo, medio, alto"
                placeholderTextColor={colors.textMuted}
                value={form.nivel}
                onChangeText={(value) => handleChange('nivel', value)}
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Frecuencia</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. diario, semanal"
                placeholderTextColor={colors.textMuted}
                value={form.frecuencia}
                onChangeText={(value) => handleChange('frecuencia', value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Medicion y fecha</AppText>
          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Cantidad</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. 30"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={form.cantidad}
                onChangeText={(value) => handleChange('cantidad', value)}
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Unidad</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. min, veces, litros"
                placeholderTextColor={colors.textMuted}
                value={form.unidad}
                onChangeText={(value) => handleChange('unidad', value)}
              />
            </View>
          </View>

          <AppText style={styles.label}>Fecha de inicio o referencia</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={form.inicio}
            onChangeText={(value) => handleChange('inicio', value)}
          />
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Interpretacion clinica</AppText>
          <AppText style={styles.label}>Impacto en salud</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="Ej. positivo, moderado, alto riesgo"
            placeholderTextColor={colors.textMuted}
            value={form.impactosalud}
            onChangeText={(value) => handleChange('impactosalud', value)}
          />

          <AppText style={styles.label}>Observaciones</AppText>
          <AppTextInput
            style={[styles.input, styles.multiline]}
            placeholder="Agrega contexto, detonantes, cambios o recomendaciones"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={form.observaciones}
            onChangeText={(value) => handleChange('observaciones', value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || types.length === 0}
        >
          <AppText style={styles.primaryBtnText}>
            {submitting ? 'Guardando...' : 'Guardar habito'}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Lectura rapida</AppText>
          <AppText style={styles.cardSubtitle}>Resumen util de la informacion capturada.</AppText>
        </View>

        <View style={styles.insightBox}>
          <AppText style={styles.insightTitle}>Lo que ya podemos hacer con esta informacion</AppText>
          <AppText style={styles.insightText}>{insights.summaryText}</AppText>
          {insights.latest ? (
            <AppText style={styles.insightText}>
              Ultimo registro: {getTypeName(insights.latest.tipohabitoId)} ({formatDate(insights.latest.inicio)}).
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Registros</AppText>
          <AppText style={styles.cardSubtitle}>Historial filtrado por el paciente activo.</AppText>
        </View>
        {visibleRecords.length === 0 ? (
          <AppText style={styles.emptyText}>Todavia no hay habitos registrados.</AppText>
        ) : (
          <FlatList
            data={visibleRecords}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.habitoId)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const accent = getImpactAccent(item.impactosalud);
              return (
<View style={styles.recordCard}>
<RecordActions resource="habitoespecifico" recordId={item.habitoId} onChanged={() => loadData()} />
                  <View style={styles.recordHeader}>
                    <View style={styles.recordHeaderText}>
                      <AppText style={styles.recordTitle}>{getTypeName(item.tipohabitoId)}</AppText>
                      <AppText style={styles.recordText}>
                        {formatDate(item.inicio)} {item.frecuencia ? `- ${item.frecuencia}` : ''}
                      </AppText>
                    </View>
                    {item.impactosalud ? (
                      <View style={[styles.impactBadge, { borderColor: accent }]}>
                        <AppText style={[styles.impactBadgeText, { color: accent }]}>
                          {item.impactosalud}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.recordMetaRow}>
                    {item.categoria ? (
                      <View style={styles.metaChip}>
                        <AppText style={styles.metaChipText}>{item.categoria}</AppText>
                      </View>
                    ) : null}
                    {item.nivel ? (
                      <View style={styles.metaChip}>
                        <AppText style={styles.metaChipText}>Nivel: {item.nivel}</AppText>
                      </View>
                    ) : null}
                    {item.cantidad ? (
                      <View style={styles.metaChip}>
                        <AppText style={styles.metaChipText}>
                          {item.cantidad} {item.unidad ?? ''}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {item.observaciones ? (
                    <AppText style={styles.recordNote}>{item.observaciones}</AppText>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSoft,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    backgroundColor: '#0B6FEA',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#4EA1FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: { flex: 1 },
  headerBadgeText: {
    color: '#DCEEFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#EAF3FF',
    lineHeight: 20,
  },
  personSelectorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.border },
  personSelectorIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  personSelectorCopy: { flex: 1, gap: 5 },
  personSelectorLabel: { color: colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  personPickerShell: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundMuted, justifyContent: 'center' },
  hydrationCard: {
    backgroundColor: '#EAF7FF',
    borderRadius: 22,
    padding: 16,
    gap: 13,
    borderWidth: 1,
    borderColor: '#8DD8FF',
  },
  hydrationHeader: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  hydrationCopy: { flex: 1 },
  hydrationEyebrow: { color: '#087DB5', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  hydrationTitle: { color: '#123B57', fontSize: 17, fontWeight: '900', marginTop: 2 },
  hydrationAmount: { color: '#0B6FEA', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  hydrationPatient: { color: '#52748A', fontSize: 11, lineHeight: 16 },
  hydrationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hydrationButton: { flexGrow: 1, minWidth: 96, minHeight: 44, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#0B8FD3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  hydrationButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  hydrationFeedback: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 12, backgroundColor: '#FFFFFF' },
  hydrationFeedbackText: { flex: 1, color: '#315D46', fontSize: 12, lineHeight: 17 },
  disabledButton: { opacity: 0.45 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    gap: 4,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.backgroundMuted,
  },
  warningText: {
    color: colors.accent,
    backgroundColor: `${colors.accent}18`,
    borderRadius: 10,
    padding: 10,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  formSectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.backgroundMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroupHalf: {
    flex: 1,
    gap: 8,
  },
  multiline: {
    minHeight: 92,
  },
  primaryBtn: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
  insightBox: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.info}18`,
    padding: 14,
    gap: 6,
  },
  insightTitle: {
    color: colors.info,
    fontSize: 14,
    fontWeight: '800',
  },
  insightText: {
    color: colors.info,
    lineHeight: 19,
  },
  emptyText: {
    color: colors.textSoft,
  },
  separator: {
    height: 12,
  },
  recordCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordHeaderText: {
    flex: 1,
    gap: 4,
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  recordText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  impactBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recordMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    backgroundColor: colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  recordNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
