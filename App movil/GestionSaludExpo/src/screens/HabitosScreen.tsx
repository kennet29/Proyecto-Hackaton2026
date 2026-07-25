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
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';

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
  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [types, setTypes] = useState<TipoHabito[]>([]);
  const [records, setRecords] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const selectedType = types.find((type) => String(type.tipohabitoId) === form.tipohabitoId) ?? null;
  const selectedPatient = patients.find((patient) => String(patient.pacienteId) === form.pacienteId) ?? null;

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
        <ActivityIndicator size="large" color="#38E28E" />
        <AppText style={styles.loadingText}>Cargando habitos...</AppText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <AppText style={styles.headerBadgeText}>Seguimiento continuo</AppText>
        </View>
        <AppText style={styles.title}>Habitos</AppText>
        <AppText style={styles.subtitle}>
          Registra actividad fisica, sueno, alimentacion u otros habitos para entender patrones y riesgos.
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Contexto del registro</AppText>
          <AppText style={styles.cardSubtitle}>Selecciona paciente y tipo antes de guardar el habito.</AppText>
        </View>

        <AppText style={styles.label}>Paciente</AppText>
        <View style={styles.pickerShell}>
          <Picker
            selectedValue={form.pacienteId}
            onValueChange={(value) => handleChange('pacienteId', String(value))}
          >
            <Picker.Item label="Selecciona un paciente" value="" color={pickerItemColor} />
            {patients.map((patient) => (
              <Picker.Item
                key={patient.pacienteId}
                label={patient.displayName}
                value={String(patient.pacienteId)}
                color={pickerItemColor}
              />
            ))}
          </Picker>
        </View>

        <AppText style={styles.label}>Tipo de habito</AppText>
        <View style={styles.pickerShell}>
          <Picker
            selectedValue={form.tipohabitoId}
            onValueChange={(value) => handleChange('tipohabitoId', String(value))}
          >
            <Picker.Item label="Selecciona un tipo" value="" color={pickerItemColor} />
            {types.map((type) => (
              <Picker.Item
                key={type.tipohabitoId}
                label={type.categoria ? `${type.nombre} (${type.categoria})` : type.nombre}
                value={String(type.tipohabitoId)}
                color={pickerItemColor}
              />
            ))}
          </Picker>
        </View>

        {selectedPatient || selectedType ? (
          <View style={styles.contextBox}>
            {selectedPatient ? (
              <AppText style={styles.contextText}>Paciente activo: {selectedPatient.displayName}</AppText>
            ) : null}
            {selectedType ? (
              <AppText style={styles.contextText}>
                Tipo elegido: {selectedType.nombre}
                {selectedType.categoria ? ` - ${selectedType.categoria}` : ''}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {types.length === 0 ? (
          <AppText style={styles.warningText}>
            No hay tipos de habito configurados en la base de datos.
          </AppText>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.cardTitle}>Nuevo registro</AppText>
          <AppText style={styles.cardSubtitle}>Completa el nivel, la frecuencia y el impacto observado.</AppText>
        </View>

        <View style={styles.formSection}>
          <AppText style={styles.formSectionTitle}>Detalle principal</AppText>
          <AppText style={styles.label}>Categoria</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="Ej. actividad fisica, alimentacion, sueno"
            placeholderTextColor="#9FB3C8"
            value={form.categoria}
            onChangeText={(value) => handleChange('categoria', value)}
          />

          <View style={styles.row}>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Nivel</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. bajo, medio, alto"
                placeholderTextColor="#9FB3C8"
                value={form.nivel}
                onChangeText={(value) => handleChange('nivel', value)}
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <AppText style={styles.label}>Frecuencia</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Ej. diario, semanal"
                placeholderTextColor="#9FB3C8"
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
                placeholderTextColor="#9FB3C8"
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
                placeholderTextColor="#9FB3C8"
                value={form.unidad}
                onChangeText={(value) => handleChange('unidad', value)}
              />
            </View>
          </View>

          <AppText style={styles.label}>Fecha de inicio o referencia</AppText>
          <AppTextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9FB3C8"
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
            placeholderTextColor="#9FB3C8"
            value={form.impactosalud}
            onChangeText={(value) => handleChange('impactosalud', value)}
          />

          <AppText style={styles.label}>Observaciones</AppText>
          <AppTextInput
            style={[styles.input, styles.multiline]}
            placeholder="Agrega contexto, detonantes, cambios o recomendaciones"
            placeholderTextColor="#9FB3C8"
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

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071120',
  },
  loadingText: {
    marginTop: 10,
    color: '#C9D7E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    backgroundColor: '#38E28E',
    borderRadius: 24,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#38E28E',
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#38E28E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    color: '#38E28E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F4F8FF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#38E28E',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  sectionHeader: {
    gap: 4,
  },
  cardTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 13,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },
  contextBox: {
    backgroundColor: '#071120',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 12,
    gap: 4,
  },
  contextText: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  warningText: {
    color: '#FF4D73',
    backgroundColor: '#FF4D7318',
    borderRadius: 10,
    padding: 10,
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#071120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    padding: 14,
    gap: 10,
  },
  formSectionTitle: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#F4F8FF',
    backgroundColor: '#0D1B2A',
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
    backgroundColor: '#38E28E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '800',
  },
  insightBox: {
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#29B6FF18',
    padding: 14,
    gap: 6,
  },
  insightTitle: {
    color: '#29B6FF',
    fontSize: 14,
    fontWeight: '800',
  },
  insightText: {
    color: '#29B6FF',
    lineHeight: 19,
  },
  emptyText: {
    color: '#C9D7E8',
  },
  separator: {
    height: 12,
  },
  recordCard: {
    backgroundColor: '#071120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27496D',
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
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  recordText: {
    color: '#C9D7E8',
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
    backgroundColor: '#071120',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#132238',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  recordNote: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 19,
  },
});
