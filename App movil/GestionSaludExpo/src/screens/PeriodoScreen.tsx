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

const today = () => new Date().toISOString().slice(0, 10);
const PERIODO_EXTRA_PASSWORD =
  process.env.EXPO_PUBLIC_PERIODO_EXTRA_PASSWORD?.trim() || 'Periodo2026!';

const normalizeSexo = (value?: string | null) => value?.trim().toUpperCase() ?? '';

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

const formatEnum = (value?: string | null) => {
  if (!value) return 'No registrado';
  return value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
};

export function PeriodoScreen() {
  const { token, user } = useAuth();
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
    if (selectedPatientId && isUnlocked) {
      loadData(selectedPatientId);
    }
  }, [isUnlocked, loadData, selectedPatientId]);

  const handleUnlock = () => {
    if (!patients.length) {
      Alert.alert(
        'Acceso no disponible',
        'El modulo de periodo requiere al menos una persona de genero femenino registrada.',
      );
      return;
    }

    if (!modulePassword.trim()) {
      Alert.alert('Clave requerida', 'Ingresa la contraseña adicional del modulo.');
      return;
    }

    if (modulePassword.trim() !== PERIODO_EXTRA_PASSWORD) {
      Alert.alert('Clave incorrecta', 'La contraseña adicional del modulo no coincide.');
      return;
    }

    setIsUnlocked(true);
    setModulePassword('');
  };

  const handleSubmit = async () => {
    if (!patients.length) {
      Alert.alert(
        'Modulo bloqueado',
        'Debes tener al menos una paciente femenina vinculada para usar este modulo.',
      );
      return;
    }

    if (!isUnlocked) {
      Alert.alert('Acceso protegido', 'Desbloquea el modulo con la contraseña adicional.');
      return;
    }

    if (!form.pacienteId || !form.fechaInicio) {
      Alert.alert('Campos requeridos', 'Paciente y fecha de inicio son obligatorios');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/periodo`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
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
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo registrar el periodo');
      }

      Alert.alert('Registro creado', 'El periodo se guardo correctamente');
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
        <Text style={styles.heroTitle}>Modulo de Periodo</Text>
        <Text style={styles.heroText}>
          Registra ciclos, sintomas y revisa la prediccion del siguiente periodo.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Acceso y validacion</Text>
        {!hasFemalePatients ? (
          <Text style={styles.errorText}>
            Este modulo solo se habilita si al menos una persona vinculada tiene genero femenino.
          </Text>
        ) : isUnlocked ? (
          <>
            <Text style={styles.successText}>
              Modulo desbloqueado. Ya puedes registrar y consultar periodos.
            </Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setIsUnlocked(false);
                setHistorial(null);
                setPrediction(null);
              }}
            >
              <Text style={styles.secondaryBtnText}>Bloquear modulo</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.helperText}>
              Se encontro al menos una paciente femenina. Ingresa la contraseña adicional para continuar.
            </Text>
            <TextInput
              style={styles.input}
              value={modulePassword}
              onChangeText={setModulePassword}
              placeholder="Contraseña adicional del modulo"
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUnlock}>
              <Text style={styles.primaryBtnText}>Desbloquear modulo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!isUnlocked ? null : (
        <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Paciente</Text>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#ec4899" />
            <Text style={styles.loadingText}>Cargando pacientes...</Text>
          </View>
        ) : patients.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay pacientes femeninas vinculadas para este modulo.
          </Text>
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
        <Text style={styles.sectionTitle}>Nuevo registro</Text>
        <TextInput
          style={styles.input}
          value={form.fechaInicio}
          onChangeText={(value) => handleChange('fechaInicio', value)}
          placeholder="Fecha inicio (YYYY-MM-DD)"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={form.fechaFin}
          onChangeText={(value) => handleChange('fechaFin', value)}
          placeholder="Fecha fin (opcional)"
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.duracionDias}
            onChangeText={(value) => handleChange('duracionDias', value)}
            placeholder="Duracion"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={form.cicloDias}
            onChangeText={(value) => handleChange('cicloDias', value)}
            placeholder="Ciclo"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.flujo} onValueChange={(value) => handleChange('flujo', String(value))}>
              <Picker.Item label="Flujo leve" value="leve" />
              <Picker.Item label="Flujo moderado" value="moderado" />
              <Picker.Item label="Flujo abundante" value="abundante" />
            </Picker>
          </View>
          <View style={[styles.pickerWrapper, styles.halfInput]}>
            <Picker selectedValue={form.dolor} onValueChange={(value) => handleChange('dolor', String(value))}>
              <Picker.Item label="Dolor leve" value="leve" />
              <Picker.Item label="Dolor moderado" value="moderado" />
              <Picker.Item label="Dolor intenso" value="intenso" />
              <Picker.Item label="Sin dolor" value="sin_dolor" />
            </Picker>
          </View>
        </View>
        <TextInput
          style={styles.input}
          value={form.sintomas}
          onChangeText={(value) => handleChange('sintomas', value)}
          placeholder="Sintomas separados por coma"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.observaciones}
          onChangeText={(value) => handleChange('observaciones', value)}
          placeholder="Observaciones"
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Guardar periodo</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#ec4899" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : !selectedPatientId ? (
          <Text style={styles.emptyText}>Selecciona una paciente para ver informacion.</Text>
        ) : (
          <>
            <Text style={styles.metricText}>Paciente: {selectedPatientLabel ?? `#${selectedPatientId}`}</Text>
            <Text style={styles.metricText}>
              Total de registros: {historial?.totalRegistros ?? 0}
            </Text>
            <Text style={styles.metricText}>
              Promedio de duracion: {historial?.promedioDuracionDias ?? 'Sin dato'}
            </Text>
            <Text style={styles.metricText}>
              Promedio de ciclo: {historial?.promedioCicloDias ?? 'Sin dato'}
            </Text>
            {prediction?.proximoPeriodo ? (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightTitle}>Siguiente prediccion</Text>
                <Text style={styles.highlightText}>
                  Inicio: {formatDate(prediction.proximoPeriodo.fechaInicio)}
                </Text>
                <Text style={styles.highlightText}>
                  Fin: {formatDate(prediction.proximoPeriodo.fechaFin)}
                </Text>
                <Text style={styles.highlightText}>
                  Ovulacion estimada: {formatDate(prediction.ovulacionEstimada)}
                </Text>
                {prediction.ventanaFertil ? (
                  <Text style={styles.highlightText}>
                    Ventana fertil: {formatDate(prediction.ventanaFertil.inicio)} al{' '}
                    {formatDate(prediction.ventanaFertil.fin)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {dataError ? <Text style={styles.errorText}>{dataError}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historial reciente</Text>
        {historial?.registros?.length ? (
          historial.registros.slice(0, 6).map((item) => (
            <View key={item.periodoId} style={styles.listItem}>
              <Text style={styles.itemTitle}>
                {formatDate(item.fechaInicio)} {item.fechaFin ? `- ${formatDate(item.fechaFin)}` : ''}
              </Text>
              <Text style={styles.itemText}>
                Flujo: {formatEnum(item.flujo)} · Dolor: {formatEnum(item.dolor)}
              </Text>
              <Text style={styles.itemText}>
                Duracion: {item.duracionDias ?? 'N/D'} dias · Ciclo: {item.cicloDias ?? 'N/D'} dias
              </Text>
              {item.sintomas?.length ? (
                <Text style={styles.itemText}>Sintomas: {item.sintomas.join(', ')}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Todavia no hay registros para esta paciente.</Text>
        )}
      </View>
        </>
      )}
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
    borderColor: '#ec4899',
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
    backgroundColor: '#ec4899',
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
  successText: {
    color: '#bbf7d0',
    lineHeight: 20,
  },
  helperText: {
    color: '#cbd5e1',
    lineHeight: 20,
  },
  metricText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  highlightBox: {
    backgroundColor: '#831843',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  highlightTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  highlightText: {
    color: '#fce7f3',
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
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
});
