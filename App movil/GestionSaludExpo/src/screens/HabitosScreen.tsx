import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';

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

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI');
};

export function HabitosScreen(_: Props) {
  const { token, user } = useAuth();
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
  const visibleRecords = records.filter((record) => {
    if (!selectedPatientId) return true;
    return Number(record.pacienteId) === selectedPatientId;
  });

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
      setForm((prev) => ({
        ...prev,
        pacienteId: prev.pacienteId || String(linkedPatients[0]?.pacienteId ?? ''),
        tipohabitoId: prev.tipohabitoId || String(normalizedTypes[0]?.tipohabitoId ?? ''),
      }));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar los datos');
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

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando habitos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Habitos</Text>
        <Text style={styles.subtitle}>Registra actividad fisica, sueno, alimentacion u otros habitos.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nuevo registro</Text>

        <Text style={styles.label}>Paciente</Text>
        <View style={styles.pickerShell}>
          <Picker selectedValue={form.pacienteId} onValueChange={(value) => handleChange('pacienteId', String(value))}>
            <Picker.Item label="Selecciona un paciente" value="" />
            {patients.map((patient) => (
              <Picker.Item
                key={patient.pacienteId}
                label={patient.displayName}
                value={String(patient.pacienteId)}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Tipo de habito</Text>
        <View style={styles.pickerShell}>
          <Picker
            selectedValue={form.tipohabitoId}
            onValueChange={(value) => handleChange('tipohabitoId', String(value))}
          >
            <Picker.Item label="Selecciona un tipo" value="" />
            {types.map((type) => (
              <Picker.Item
                key={type.tipohabitoId}
                label={type.categoria ? `${type.nombre} (${type.categoria})` : type.nombre}
                value={String(type.tipohabitoId)}
              />
            ))}
          </Picker>
        </View>

        {types.length === 0 ? (
          <Text style={styles.warningText}>
            No hay tipos de habito configurados en la base de datos.
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Categoria"
          value={form.categoria}
          onChangeText={(value) => handleChange('categoria', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Nivel"
          value={form.nivel}
          onChangeText={(value) => handleChange('nivel', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Frecuencia"
          value={form.frecuencia}
          onChangeText={(value) => handleChange('frecuencia', value)}
        />
        <View style={styles.inlineFields}>
          <TextInput
            style={[styles.input, styles.inlineInput]}
            placeholder="Cantidad"
            keyboardType="decimal-pad"
            value={form.cantidad}
            onChangeText={(value) => handleChange('cantidad', value)}
          />
          <TextInput
            style={[styles.input, styles.inlineInput]}
            placeholder="Unidad"
            value={form.unidad}
            onChangeText={(value) => handleChange('unidad', value)}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Inicio YYYY-MM-DD"
          value={form.inicio}
          onChangeText={(value) => handleChange('inicio', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Impacto en salud"
          value={form.impactosalud}
          onChangeText={(value) => handleChange('impactosalud', value)}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Observaciones"
          multiline
          textAlignVertical="top"
          value={form.observaciones}
          onChangeText={(value) => handleChange('observaciones', value)}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || types.length === 0}
        >
          <Text style={styles.primaryBtnText}>{submitting ? 'Guardando...' : 'Guardar habito'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registros</Text>
        {visibleRecords.length === 0 ? (
          <Text style={styles.emptyText}>Todavia no hay habitos registrados.</Text>
        ) : (
          <FlatList
            data={visibleRecords}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.habitoId)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <View style={styles.recordRow}>
                <Text style={styles.recordTitle}>{getTypeName(item.tipohabitoId)}</Text>
                <Text style={styles.recordText}>
                  {formatDate(item.inicio)} {item.frecuencia ? `- ${item.frecuencia}` : ''}
                </Text>
                <Text style={styles.recordText}>
                  {[item.nivel, item.cantidad ? `${item.cantidad} ${item.unidad ?? ''}`.trim() : null]
                    .filter(Boolean)
                    .join(' - ') || 'Sin detalle'}
                </Text>
                {item.impactosalud ? <Text style={styles.recordText}>Impacto: {item.impactosalud}</Text> : null}
                {item.observaciones ? <Text style={styles.recordNote}>{item.observaciones}</Text> : null}
              </View>
            )}
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
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 10,
    color: '#cbd5e1',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    backgroundColor: '#0f766e',
    borderRadius: 24,
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#ccfbf1',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#f8fafc',
    backgroundColor: '#0b1220',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineInput: {
    flex: 1,
  },
  multiline: {
    minHeight: 86,
  },
  primaryBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  warningText: {
    color: '#fde68a',
    backgroundColor: '#422006',
    borderRadius: 10,
    padding: 10,
    fontWeight: '600',
  },
  emptyText: {
    color: '#cbd5e1',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  recordRow: {
    gap: 4,
  },
  recordTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  recordText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  recordNote: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
