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

type SaludMentalRecord = {
  saludmentalId: number;
  pacienteId: number;
  fecha: string;
  estadoAnimo: number;
  estres: number;
  ansiedad: number;
  horasSueno: number | null;
  notaPersonal: string | null;
  ejercicioMinutos: number | null;
  hidratacionLitros: number | null;
  descansoHoras: number | null;
  tiempoSocialMinutos: number | null;
  pausasDigitales: number | null;
};

type SaludMentalHistorial = {
  pacienteId: number;
  totalRegistros: number;
  historialPorFecha: SaludMentalRecord[];
};

type SaludMentalStats = {
  promedioSemanal?: Array<Record<string, any>>;
  tendenciaMensual?: Array<Record<string, any>>;
  relacionSuenoAnimo?: Array<Record<string, any>>;
};

type SaludMentalAlerts = {
  totalAlertas: number;
  alertas: string[];
};

const today = () => new Date().toISOString().slice(0, 10);

const scoreOptions = [
  { label: '1 - Muy bajo', value: '1' },
  { label: '2 - Bajo', value: '2' },
  { label: '3 - Medio', value: '3' },
  { label: '4 - Alto', value: '4' },
  { label: '5 - Muy alto', value: '5' },
];

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

export function SaludMentalScreen() {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historial, setHistorial] = useState<SaludMentalHistorial | null>(null);
  const [stats, setStats] = useState<SaludMentalStats | null>(null);
  const [alerts, setAlerts] = useState<SaludMentalAlerts | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: today(),
    estadoAnimo: '3',
    estres: '3',
    ansiedad: '3',
    horasSueno: '',
    ejercicioMinutos: '',
    hidratacionLitros: '',
    descansoHoras: '',
    tiempoSocialMinutos: '',
    pausasDigitales: '',
    notaPersonal: '',
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
        setStats(null);
        setAlerts(null);
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
          `${API_URL}/salud-mental/paciente/${patientId}/historial`,
          { headers: authHeaders },
        );
        const historialBody = await historialResponse.json().catch(() => null);
        if (!historialResponse.ok) {
          throw new Error(historialBody?.message ?? 'No se pudo cargar el historial');
        }
        setHistorial(historialBody);

        const statsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/estadisticas`,
          { headers: authHeaders },
        );
        const statsBody = await statsResponse.json().catch(() => null);
        if (statsResponse.ok) {
          setStats(statsBody);
        } else {
          setStats(null);
        }

        const alertsResponse = await fetch(
          `${API_URL}/salud-mental/paciente/${patientId}/alertas`,
          { headers: authHeaders },
        );
        const alertsBody = await alertsResponse.json().catch(() => null);
        if (alertsResponse.ok) {
          setAlerts(alertsBody);
        } else {
          setAlerts(null);
        }
      } catch (error) {
        setDataError(
          error instanceof Error ? error.message : 'No se pudieron cargar los datos del modulo',
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
      const response = await fetch(`${API_URL}/salud-mental`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          fecha: form.fecha,
          estadoAnimo: Number(form.estadoAnimo),
          estres: Number(form.estres),
          ansiedad: Number(form.ansiedad),
          horasSueno: form.horasSueno ? Number(form.horasSueno) : undefined,
          ejercicioMinutos: form.ejercicioMinutos ? Number(form.ejercicioMinutos) : undefined,
          hidratacionLitros: form.hidratacionLitros
            ? Number(form.hidratacionLitros)
            : undefined,
          descansoHoras: form.descansoHoras ? Number(form.descansoHoras) : undefined,
          tiempoSocialMinutos: form.tiempoSocialMinutos
            ? Number(form.tiempoSocialMinutos)
            : undefined,
          pausasDigitales: form.pausasDigitales ? Number(form.pausasDigitales) : undefined,
          notaPersonal: form.notaPersonal || undefined,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar el registro');
      }

      Alert.alert('Registro creado', 'La entrada de salud mental se guardo correctamente');
      setForm((prev) => ({
        ...prev,
        fecha: today(),
        estadoAnimo: '3',
        estres: '3',
        ansiedad: '3',
        horasSueno: '',
        ejercicioMinutos: '',
        hidratacionLitros: '',
        descansoHoras: '',
        tiempoSocialMinutos: '',
        pausasDigitales: '',
        notaPersonal: '',
      }));
      await loadData(form.pacienteId, true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const statsSummary = useMemo(() => {
    const weekly = Array.isArray(stats?.promedioSemanal) ? stats?.promedioSemanal[0] : null;
    const monthly = Array.isArray(stats?.tendenciaMensual)
      ? stats?.tendenciaMensual[stats.tendenciaMensual.length - 1]
      : null;
    return { weekly, monthly };
  }, [stats]);

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
        <Text style={styles.heroTitle}>Modulo de Salud Mental</Text>
        <Text style={styles.heroText}>
          Registra animo, estres, ansiedad, sueno y habitos diarios desde un solo lugar.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Paciente</Text>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#22c55e" />
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
                      ? `${patient.displayName} · ${patient.parentesco}`
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
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker
              selectedValue={form.estadoAnimo}
              onValueChange={(value) => handleChange('estadoAnimo', String(value))}
            >
              {scoreOptions.map((item) => (
                <Picker.Item key={`animo-${item.value}`} label={`Animo ${item.label}`} value={item.value} />
              ))}
            </Picker>
          </View>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker
              selectedValue={form.estres}
              onValueChange={(value) => handleChange('estres', String(value))}
            >
              {scoreOptions.map((item) => (
                <Picker.Item key={`estres-${item.value}`} label={`Estres ${item.label}`} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>
        <View style={[styles.pickerWrapper]}>
          <Picker
            selectedValue={form.ansiedad}
            onValueChange={(value) => handleChange('ansiedad', String(value))}
          >
            {scoreOptions.map((item) => (
              <Picker.Item key={`ansiedad-${item.value}`} label={`Ansiedad ${item.label}`} value={item.value} />
            ))}
          </Picker>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.horasSueno}
            onChangeText={(value) => handleChange('horasSueno', value)}
            placeholder="Horas de sueno"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.descansoHoras}
            onChangeText={(value) => handleChange('descansoHoras', value)}
            placeholder="Horas de descanso"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.ejercicioMinutos}
            onChangeText={(value) => handleChange('ejercicioMinutos', value)}
            placeholder="Ejercicio min"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.tiempoSocialMinutos}
            onChangeText={(value) => handleChange('tiempoSocialMinutos', value)}
            placeholder="Tiempo social min"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.hidratacionLitros}
            onChangeText={(value) => handleChange('hidratacionLitros', value)}
            placeholder="Hidratacion litros"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.pausasDigitales}
            onChangeText={(value) => handleChange('pausasDigitales', value)}
            placeholder="Pausas digitales"
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.notaPersonal}
          onChangeText={(value) => handleChange('notaPersonal', value)}
          placeholder="Nota personal"
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
            <Text style={styles.primaryBtnText}>Guardar registro</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#22c55e" />
            <Text style={styles.loadingText}>Cargando estadisticas...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.metricText}>
              Total de registros: {historial?.totalRegistros ?? 0}
            </Text>
            <Text style={styles.metricText}>
              Alertas activas: {alerts?.totalAlertas ?? 0}
            </Text>
            {statsSummary.weekly ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Promedio semanal</Text>
                <Text style={styles.highlightText}>
                  Animo: {statsSummary.weekly.promedioEstadoAnimo ?? 'N/D'}
                </Text>
                <Text style={styles.highlightText}>
                  Estres: {statsSummary.weekly.promedioEstres ?? 'N/D'}
                </Text>
                <Text style={styles.highlightText}>
                  Ansiedad: {statsSummary.weekly.promedioAnsiedad ?? 'N/D'}
                </Text>
              </View>
            ) : null}
            {statsSummary.monthly ? (
              <Text style={styles.metricText}>
                Ultima tendencia mensual: {JSON.stringify(statsSummary.monthly)}
              </Text>
            ) : null}
            {dataError ? <Text style={styles.errorText}>{dataError}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alertas</Text>
        {alerts?.alertas?.length ? (
          alerts.alertas.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.alertItem}>
              <Text style={styles.alertText}>{item}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay alertas registradas por ahora.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial reciente</Text>
        {historial?.historialPorFecha?.length ? (
          historial.historialPorFecha.slice(0, 6).map((item) => (
            <View key={item.saludmentalId} style={styles.listItem}>
              <Text style={styles.itemTitle}>{formatDate(item.fecha)}</Text>
              <Text style={styles.itemText}>
                Animo: {item.estadoAnimo} · Estres: {item.estres} · Ansiedad: {item.ansiedad}
              </Text>
              <Text style={styles.itemText}>
                Sueno: {item.horasSueno ?? 'N/D'} h · Descanso: {item.descansoHoras ?? 'N/D'} h
              </Text>
              <Text style={styles.itemText}>
                Ejercicio: {item.ejercicioMinutos ?? 'N/D'} min · Hidratacion:{' '}
                {item.hidratacionLitros ?? 'N/D'} L
              </Text>
              {item.notaPersonal ? (
                <Text style={styles.itemText}>Nota: {item.notaPersonal}</Text>
              ) : null}
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
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroText: {
    color: '#cbd5e1',
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
    backgroundColor: '#22c55e',
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
  highlightBox: {
    backgroundColor: '#14532d',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  highlightTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  highlightText: {
    color: '#dcfce7',
  },
  alertItem: {
    borderWidth: 1,
    borderColor: '#365314',
    backgroundColor: '#1a2e05',
    borderRadius: 12,
    padding: 12,
  },
  alertText: {
    color: '#ecfccb',
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
