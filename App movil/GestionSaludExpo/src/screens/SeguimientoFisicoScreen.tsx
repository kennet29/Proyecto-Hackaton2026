import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';

type SeguimientoRecord = {
  seguimientoFisicoId: number;
  pacienteId: number;
  fecha: string;
  peso: number | null;
  minutosEjercicio: number | null;
  tipoEjercicio: string | null;
  intensidad: string | null;
  pasos: number | null;
  caloriasQuemadas: number | null;
  distanciaKm: number | null;
  notas: string | null;
};

type SeguimientoHistorial = {
  pacienteId: number;
  totalRegistros: number;
  registros: SeguimientoRecord[];
};

type SeguimientoResumen = {
  totalRegistros: number;
  ultimoRegistro: SeguimientoRecord | null;
  peso?: {
    inicial: number | null;
    actual: number | null;
    cambio: number | null;
  };
  ejercicio?: {
    minutosTotales: number | null;
    minutosPromedio: number | null;
    caloriasTotales: number | null;
    pasosPromedio: number | null;
  };
};

type PesoProgress = {
  pacienteId: number;
  puntos: Array<{
    fecha: string;
    peso: number;
  }>;
};

const intensidadOptions = [
  { label: 'Sin definir', value: '' },
  { label: 'Leve', value: 'leve' },
  { label: 'Moderada', value: 'moderada' },
  { label: 'Intensa', value: 'intensa' },
];

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatNumber = (value?: number | null, suffix = '') => {
  if (value === null || value === undefined) return 'N/D';
  return `${value}${suffix}`;
};

export function SeguimientoFisicoScreen() {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historial, setHistorial] = useState<SeguimientoHistorial | null>(null);
  const [resumen, setResumen] = useState<SeguimientoResumen | null>(null);
  const [pesoProgress, setPesoProgress] = useState<PesoProgress | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: today(),
    peso: '',
    minutosEjercicio: '',
    tipoEjercicio: '',
    intensidad: '',
    pasos: '',
    caloriasQuemadas: '',
    distanciaKm: '',
    notas: '',
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
      const defaultPatient = items[0]?.pacienteId ? String(items[0].pacienteId) : '';
      setSelectedPatientId((prev) => prev || defaultPatient);
      setForm((prev) => ({
        ...prev,
        pacienteId: prev.pacienteId || defaultPatient,
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
        setResumen(null);
        setPesoProgress(null);
        return;
      }

      if (useRefresh) {
        setRefreshing(true);
      } else {
        setLoadingData(true);
      }
      setDataError(null);

      try {
        const [historialResponse, resumenResponse, pesoResponse] = await Promise.all([
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/historial`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/resumen`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/progreso-peso`, {
            headers: authHeaders,
          }),
        ]);

        const historialBody = await historialResponse.json().catch(() => null);
        const resumenBody = await resumenResponse.json().catch(() => null);
        const pesoBody = await pesoResponse.json().catch(() => null);

        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }

        setHistorial(historialBody);
        setResumen(resumenResponse.ok ? resumenBody : null);
        setPesoProgress(pesoResponse.ok ? pesoBody : null);
      } catch (error) {
        setDataError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos del modulo',
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
    if (!form.pacienteId || !form.fecha) {
      Alert.alert('Campos requeridos', 'Paciente y fecha son obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/seguimientofisico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          fecha: form.fecha,
          peso: form.peso ? Number(form.peso) : undefined,
          minutosEjercicio: form.minutosEjercicio
            ? Number(form.minutosEjercicio)
            : undefined,
          tipoEjercicio: form.tipoEjercicio.trim() || undefined,
          intensidad: form.intensidad || undefined,
          pasos: form.pasos ? Number(form.pasos) : undefined,
          caloriasQuemadas: form.caloriasQuemadas
            ? Number(form.caloriasQuemadas)
            : undefined,
          distanciaKm: form.distanciaKm ? Number(form.distanciaKm) : undefined,
          notas: form.notas.trim() || undefined,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar el seguimiento');
      }

      Alert.alert('Registro creado', 'El seguimiento fisico se guardo correctamente');
      setForm((prev) => ({
        ...prev,
        fecha: today(),
        peso: '',
        minutosEjercicio: '',
        tipoEjercicio: '',
        intensidad: '',
        pasos: '',
        caloriasQuemadas: '',
        distanciaKm: '',
        notas: '',
      }));
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo guardar el seguimiento',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(selectedPatientId, true)}
          tintColor="#fff"
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Seguimiento Fisico</Text>
        <Text style={styles.heroText}>
          Registra ejercicio, peso, pasos, calorias y distancia para el control diario.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Paciente</Text>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={styles.loadingText}>Cargando pacientes...</Text>
          </View>
        ) : patients.length === 0 ? (
          <Text style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</Text>
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
                      ? `${patient.displayName} - ${patient.parentesco}`
                      : patient.displayName
                  }
                  value={String(patient.pacienteId)}
                />
              ))}
            </Picker>
          </View>
        )}
        {patientError ? <Text style={styles.errorText}>{patientError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nuevo registro diario</Text>
        <TextInput
          style={styles.input}
          value={form.fecha}
          onChangeText={(value) => handleChange('fecha', value)}
          placeholder="Fecha (YYYY-MM-DD)"
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.peso}
            onChangeText={(value) => handleChange('peso', value)}
            placeholder="Peso (kg)"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.minutosEjercicio}
            onChangeText={(value) => handleChange('minutosEjercicio', value)}
            placeholder="Ejercicio min"
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          value={form.tipoEjercicio}
          onChangeText={(value) => handleChange('tipoEjercicio', value)}
          placeholder="Tipo de ejercicio"
        />
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.intensidad}
            onValueChange={(value) => handleChange('intensidad', String(value))}
          >
            {intensidadOptions.map((item) => (
              <Picker.Item
                key={`intensidad-${item.value || 'none'}`}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.pasos}
            onChangeText={(value) => handleChange('pasos', value)}
            placeholder="Pasos"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.caloriasQuemadas}
            onChangeText={(value) => handleChange('caloriasQuemadas', value)}
            placeholder="Calorias"
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          value={form.distanciaKm}
          onChangeText={(value) => handleChange('distanciaKm', value)}
          placeholder="Distancia (km)"
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.notas}
          onChangeText={(value) => handleChange('notas', value)}
          placeholder="Notas"
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Guardar seguimiento</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={styles.loadingText}>Cargando resumen...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.metricText}>
              Total de registros: {resumen?.totalRegistros ?? 0}
            </Text>
            <Text style={styles.metricText}>
              Peso inicial: {formatNumber(resumen?.peso?.inicial, ' kg')}
            </Text>
            <Text style={styles.metricText}>
              Peso actual: {formatNumber(resumen?.peso?.actual, ' kg')}
            </Text>
            <Text style={styles.metricText}>
              Cambio de peso: {formatNumber(resumen?.peso?.cambio, ' kg')}
            </Text>
            <Text style={styles.metricText}>
              Minutos totales de ejercicio:{' '}
              {formatNumber(resumen?.ejercicio?.minutosTotales, ' min')}
            </Text>
            <Text style={styles.metricText}>
              Promedio de pasos: {formatNumber(resumen?.ejercicio?.pasosPromedio)}
            </Text>
            <Text style={styles.metricText}>
              Calorias totales: {formatNumber(resumen?.ejercicio?.caloriasTotales)}
            </Text>
            {dataError ? <Text style={styles.errorText}>{dataError}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Progreso de peso</Text>
        {pesoProgress?.puntos?.length ? (
          pesoProgress.puntos.slice(-6).map((point) => (
            <View key={`${point.fecha}-${point.peso}`} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatDate(point.fecha)}</Text>
              <Text style={styles.itemText}>{point.peso} kg</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Todavia no hay suficientes datos de peso.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial reciente</Text>
        {historial?.registros?.length ? (
          historial.registros
            .slice()
            .reverse()
            .slice(0, 6)
            .map((item) => (
              <View key={item.seguimientoFisicoId} style={styles.listItem}>
                <Text style={styles.itemTitle}>{formatDate(item.fecha)}</Text>
                <Text style={styles.itemText}>
                  Peso: {formatNumber(item.peso, ' kg')} - Ejercicio:{' '}
                  {formatNumber(item.minutosEjercicio, ' min')}
                </Text>
                <Text style={styles.itemText}>
                  Pasos: {formatNumber(item.pasos)} - Calorias:{' '}
                  {formatNumber(item.caloriasQuemadas)}
                </Text>
                <Text style={styles.itemText}>
                  Distancia: {formatNumber(item.distanciaKm, ' km')} - Intensidad:{' '}
                  {item.intensidad ?? 'N/D'}
                </Text>
                {item.tipoEjercicio ? (
                  <Text style={styles.itemText}>Actividad: {item.tipoEjercicio}</Text>
                ) : null}
                {item.notas ? <Text style={styles.itemText}>Nota: {item.notas}</Text> : null}
              </View>
            ))
        ) : (
          <Text style={styles.emptyText}>Todavia no hay registros para este paciente.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0f172a',
    gap: 16,
  },
  hero: {
    backgroundColor: '#082f49',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroText: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
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
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#cbd5e1',
    marginTop: 8,
  },
  emptyText: {
    color: '#cbd5e1',
    lineHeight: 20,
  },
  errorText: {
    color: '#fca5a5',
    lineHeight: 20,
  },
  metricText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  listItem: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  itemTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  itemText: {
    color: '#cbd5e1',
  },
});
