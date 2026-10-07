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
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { NanoSectionIllustration } from '../components/NanoSectionIllustration';
import { Ionicons } from '@expo/vector-icons';
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

const CUSTOM_HEALTHY_HABIT_NAME = 'Hábito saludable personalizado';

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

export function HabitosScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token, user } = useAuth();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [types, setTypes] = useState<TipoHabito[]>([]);
  const [records, setRecords] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hydrationSaving, setHydrationSaving] = useState(false);
  const [hydrationMessage, setHydrationMessage] = useState('');
  const [personPickerVisible, setPersonPickerVisible] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '',
    nombreHabito: '',
    frecuencia: '',
    cantidad: '',
    unidad: '',
    inicio: today(),
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
    const nombreHabito = form.nombreHabito.trim();
    const frecuencia = form.frecuencia.trim();
    if (!pacienteId) {
      Alert.alert('Falta la persona', 'Selecciona quién registrará el hábito.');
      return;
    }
    if (!nombreHabito) {
      Alert.alert('Falta el hábito', 'Escribe el hábito saludable que quieres practicar.');
      return;
    }
    if (!frecuencia) {
      Alert.alert('Falta la frecuencia', 'Indica cada cuánto quieres realizar este hábito.');
      return;
    }

    setSubmitting(true);
    try {
      let customType = types.find(
        (type) => type.nombre.trim().toLocaleLowerCase('es') === CUSTOM_HEALTHY_HABIT_NAME.toLocaleLowerCase('es'),
      );

      if (!customType) {
        const typeResponse = await fetch(`${API_URL}/tipohabito`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            nombre: CUSTOM_HEALTHY_HABIT_NAME,
            categoria: 'bienestar',
            descripcion: 'Hábitos saludables definidos por cada persona.',
            activo: true,
            creadopor: user?.username ?? undefined,
          }),
        });
        const typeBody = await typeResponse.json().catch(() => ({}));
        if (!typeResponse.ok || !typeBody?.tipohabitoId) {
          throw new Error(typeBody?.message ?? 'No se pudo preparar el registro personalizado');
        }
        customType = typeBody as TipoHabito;
        setTypes((current) => [...current, customType as TipoHabito]);
      }

      const response = await fetch(`${API_URL}/habitoespecifico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId,
          tipohabitoId: customType.tipohabitoId,
          categoria: nombreHabito,
          frecuencia,
          cantidad: form.cantidad.trim() ? Number(form.cantidad) : undefined,
          unidad: form.unidad.trim() || undefined,
          inicio: form.inicio.trim() || undefined,
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
        nombreHabito: '',
        frecuencia: '',
        cantidad: '',
        unidad: '',
        inicio: today(),
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

  const getRecordName = (record: Habito) => {
    const typeName = getTypeName(record.tipohabitoId);
    return typeName === CUSTOM_HEALTHY_HABIT_NAME && record.categoria
      ? record.categoria
      : typeName;
  };

  const insights = useMemo(() => {
    const total = visibleRecords.length;
    const latest = visibleRecords[0] ?? null;

    const summaryText = total
      ? `Tienes ${total} ${total === 1 ? 'registro' : 'registros'} para dar seguimiento a tu constancia.`
      : 'Aún no tienes hábitos saludables registrados.';

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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Volver a la pantalla anterior"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        <AppText style={styles.backButtonText}>Volver</AppText>
      </TouchableOpacity>

      <View style={styles.header}>
        <NanoSectionIllustration section="alimentacion" size={76} />
        <View style={styles.headerCopy}>
          <AppText style={styles.headerBadgeText}>SEGUIMIENTO CONTINUO</AppText>
          <AppText style={styles.title}>Hábitos saludables</AppText>
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
          <TouchableOpacity
            style={styles.personPickerShell}
            onPress={() => setPersonPickerVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Persona: ${selectedPatient?.displayName ?? 'Selecciona una persona'}`}
            accessibilityState={{ expanded: personPickerVisible }}
          >
            <AppText style={[styles.personPickerText, !selectedPatient && styles.personPickerPlaceholder]} numberOfLines={2}>
              {selectedPatient?.displayName ?? 'Selecciona una persona'}
            </AppText>
            <Ionicons name="chevron-down" size={20} color={colors.textSoft} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={personPickerVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPersonPickerVisible(false)}
      >
        <View style={styles.personModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPersonPickerVisible(false)}
            accessibilityLabel="Cerrar selector"
          />
          <View style={styles.personModalCard}>
            <View style={styles.personModalHeader}>
              <AppText style={styles.personModalTitle}>Selecciona una persona</AppText>
              <TouchableOpacity
                style={styles.personModalClose}
                onPress={() => setPersonPickerVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.personOptionsList} bounces={false}>
              <TouchableOpacity
                style={[styles.personOption, !form.pacienteId && styles.personOptionSelected]}
                onPress={() => {
                  handleChange('pacienteId', '');
                  setPersonPickerVisible(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: !form.pacienteId }}
              >
                <AppText style={[styles.personOptionText, !form.pacienteId && styles.personOptionTextSelected]}>
                  Selecciona una persona
                </AppText>
                {!form.pacienteId ? <Ionicons name="checkmark-circle" size={22} color="#0B6FEA" /> : null}
              </TouchableOpacity>
              {patients.map((patient) => {
                const patientId = String(patient.pacienteId);
                const selected = patientId === form.pacienteId;
                return (
                  <TouchableOpacity
                    key={patient.pacienteId}
                    style={[styles.personOption, selected && styles.personOptionSelected]}
                    onPress={() => {
                      handleChange('pacienteId', patientId);
                      setPersonPickerVisible(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <AppText style={[styles.personOptionText, selected && styles.personOptionTextSelected]}>
                      {patient.displayName}
                    </AppText>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color="#0B6FEA" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.hydrationCard}>
        <View style={styles.hydrationHeader}>
          <NanoSectionIllustration section="hidratarse" size={72} />
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
          <AppText style={styles.cardTitle}>Registrar un hábito saludable</AppText>
          <AppText style={styles.cardSubtitle}>
            Escribe el hábito que quieres incorporar y con qué frecuencia lo realizarás.
          </AppText>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Tu nuevo hábito</AppText>
          <AppText style={styles.label}>¿Qué hábito saludable quieres practicar?</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="Ej. caminar después del almuerzo"
            placeholderTextColor={colors.textMuted}
            value={form.nombreHabito}
            onChangeText={(value) => handleChange('nombreHabito', value)}
          />

          <AppText style={styles.label}>¿Con qué frecuencia?</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="Ej. todos los días, 3 veces por semana"
            placeholderTextColor={colors.textMuted}
            value={form.frecuencia}
            onChangeText={(value) => handleChange('frecuencia', value)}
          />
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

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <AppText style={styles.primaryBtnText}>
            {submitting ? 'Guardando...' : 'Guardar habito'}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Tu seguimiento</AppText>
          <AppText style={styles.cardSubtitle}>Resumen de los hábitos que has registrado.</AppText>
        </View>

        <View style={styles.insightBox}>
          <AppText style={styles.insightTitle}>Constancia registrada</AppText>
          <AppText style={styles.insightText}>{insights.summaryText}</AppText>
          {insights.latest ? (
            <AppText style={styles.insightText}>
              Último registro: {getRecordName(insights.latest)} ({formatDate(insights.latest.inicio)}).
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
                      <AppText style={styles.recordTitle}>{getRecordName(item)}</AppText>
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
                    {item.categoria && getTypeName(item.tipohabitoId) !== CUSTOM_HEALTHY_HABIT_NAME ? (
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
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
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
  personPickerShell: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundMuted, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  personPickerText: { flex: 1, color: colors.text, fontSize: 15 },
  personPickerPlaceholder: { color: colors.textMuted },
  personModalOverlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: `${colors.overlay}80` },
  personModalCard: { width: '100%', maxWidth: 560, maxHeight: '72%', alignSelf: 'center', borderRadius: 20, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  personModalHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  personModalTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800' },
  personModalClose: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundMuted },
  personOptionsList: { flexGrow: 0 },
  personOption: { minHeight: 52, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  personOptionSelected: { backgroundColor: colors.mode === 'dark' ? '#123B57' : '#EAF3FF', borderColor: '#4EA1FF' },
  personOptionText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  personOptionTextSelected: { color: colors.mode === 'dark' ? '#DCEEFF' : '#075DBF', fontWeight: '800' },
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
