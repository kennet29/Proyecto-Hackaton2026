/**
 * @file App movil/GestionSaludExpo/src/screens/SeguimientoFisicoFormScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type Props = NativeStackScreenProps<RootStackParamList, 'SeguimientoFisicoForm'>;

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

type AchievementStatus = {
  code: string;
  title: string;
};

type CreateSeguimientoResponse = SeguimientoRecord & {
  message?: string;
  logrosDesbloqueados?: AchievementStatus[];
};

type FormState = {
  pacienteId: string;
  fecha: string;
  peso: string;
  minutosEjercicio: string;
  tipoEjercicio: string;
  intensidad: string;
  pasos: string;
  caloriasQuemadas: string;
  distanciaKm: string;
  notas: string;
};

const intensidadOptions = [
  { label: 'Sin definir', value: '' },
  { label: 'Leve', value: 'leve' },
  { label: 'Moderada', value: 'moderada' },
  { label: 'Intensa', value: 'intensa' },
];

const today = () => toLocalDateOnlyString();

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

const formatNumber = (value?: number | null, suffix = '') => {
  if (value === null || value === undefined) return 'N/D';
  return `${value}${suffix}`;
};

const emptyForm = (patientId = ''): FormState => ({
  pacienteId: patientId,
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

export function SeguimientoFisicoFormScreen({ navigation, route }: Props) {
  const { token, user } = useAuth();
  const requestedPatientId = route.params?.patientId ? String(route.params.patientId) : '';
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(requestedPatientId);
  const [historial, setHistorial] = useState<SeguimientoHistorial | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [templateRecordId, setTemplateRecordId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(requestedPatientId));

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

  const templateRecords = useMemo(() => {
    return (historial?.registros ?? []).slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  }, [historial?.registros]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'pacienteId') {
      setSelectedPatientId(value);
      setTemplateRecordId(null);
    }
  };

  const applyTemplate = (record: SeguimientoRecord) => {
    setTemplateRecordId(record.seguimientoFisicoId);
    setForm((prev) => ({
      ...prev,
      pacienteId: String(record.pacienteId),
      fecha: today(),
      peso: record.peso?.toString() ?? '',
      minutosEjercicio: record.minutosEjercicio?.toString() ?? '',
      tipoEjercicio: record.tipoEjercicio ?? '',
      intensidad: record.intensidad ?? '',
      pasos: record.pasos?.toString() ?? '',
      caloriasQuemadas: record.caloriasQuemadas?.toString() ?? '',
      distanciaKm: record.distanciaKm?.toString() ?? '',
      notas: record.notas ?? '',
    }));
  };

  const loadPatients = useCallback(async () => {
    if (!token) {
      setPatients([]);
      return;
    }

    setLoadingPatients(true);
    setPatientError(null);

    try {
      const items = await fetchLinkedPatients(authHeaders);
      setPatients(items);
      const requestedExists = requestedPatientId
        ? items.some((item) => String(item.pacienteId) === requestedPatientId)
        : false;
      const fallbackPatientId = requestedExists
        ? requestedPatientId
        : items[0]?.pacienteId
          ? String(items[0].pacienteId)
          : '';

      setSelectedPatientId((prev) => prev || fallbackPatientId);
      setForm((prev) => ({
        ...prev,
        pacienteId: prev.pacienteId || fallbackPatientId,
      }));
    } catch (error) {
      setPatientError(
        error instanceof Error ? error.message : 'No se pudieron cargar los pacientes',
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, requestedPatientId, token]);

  const loadHistory = useCallback(
    async (patientId: string) => {
      if (!patientId || !token) {
        setHistorial(null);
        return;
      }

      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const response = await fetch(`${API_URL}/seguimientofisico/paciente/${patientId}/historial`, {
          headers: authHeaders,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.message ?? 'No se pudo cargar el historial del paciente');
        }
        setHistorial(body);
      } catch (error) {
        setHistoryError(
          error instanceof Error ? error.message : 'No se pudo cargar el historial del paciente',
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [authHeaders, token],
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      setForm((prev) => (prev.pacienteId === selectedPatientId ? prev : { ...prev, pacienteId: selectedPatientId }));
      loadHistory(selectedPatientId);
    } else {
      setHistorial(null);
    }
  }, [loadHistory, selectedPatientId]);

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
          minutosEjercicio: form.minutosEjercicio ? Number(form.minutosEjercicio) : undefined,
          tipoEjercicio: form.tipoEjercicio.trim() || undefined,
          intensidad: form.intensidad || undefined,
          pasos: form.pasos ? Number(form.pasos) : undefined,
          caloriasQuemadas: form.caloriasQuemadas ? Number(form.caloriasQuemadas) : undefined,
          distanciaKm: form.distanciaKm ? Number(form.distanciaKm) : undefined,
          notas: form.notas.trim() || undefined,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const body = (await response.json().catch(() => null)) as CreateSeguimientoResponse | null;
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar el seguimiento');
      }

      const unlockedAchievements = Array.isArray(body?.logrosDesbloqueados)
        ? body.logrosDesbloqueados
        : [];
      const unlockedMessage = unlockedAchievements.length
        ? `\n\nLogros desbloqueados:\n${unlockedAchievements.map((achievement) => `- ${achievement.title}`).join('\n')}`
        : '';

      Alert.alert(
        'Registro creado',
        `El seguimiento fisico se guardo correctamente${unlockedMessage}`,
      );
      navigation.goBack();
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <AppText style={styles.heroTitle}>Nuevo Seguimiento</AppText>
        <AppText style={styles.heroText}>
          Crea el registro en una vista separada y, si quieres, usa un registro anterior como base.
        </AppText>
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Paciente</AppText>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : patients.length === 0 ? (
          <AppText style={styles.emptyText}>No hay pacientes vinculados en esta cuenta.</AppText>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
              style={styles.picker}
              dropdownIconColor="#F4F8FF"
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
                  color="#F4F8FF"
                />
              ))}
            </Picker>
          </View>
        )}
        {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Usar registro anterior</AppText>
        <AppText style={styles.sectionText}>
          Elige uno de tus registros ya guardados para copiar peso, ejercicio, pasos, calorias, distancia y notas.
          La fecha nueva se deja en hoy para evitar duplicados.
        </AppText>
        {loadingHistory ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.loadingText}>Cargando registros recientes...</AppText>
          </View>
        ) : templateRecords.length ? (
          templateRecords.map((record) => {
            const active = templateRecordId === record.seguimientoFisicoId;
            return (
              <TouchableOpacity
                key={record.seguimientoFisicoId}
                style={[styles.templateCard, active && styles.templateCardActive]}
                onPress={() => applyTemplate(record)}
              >
                <AppText style={styles.templateTitle}>{formatDate(record.fecha)}</AppText>
                <AppText style={styles.templateText}>
                  Peso: {formatNumber(record.peso, ' kg')} · Minutos: {formatNumber(record.minutosEjercicio, ' min')}
                </AppText>
                <AppText style={styles.templateText}>
                  Pasos: {formatNumber(record.pasos)} · Calorias: {formatNumber(record.caloriasQuemadas)}
                </AppText>
                <AppText style={styles.templateText}>
                  Distancia: {formatNumber(record.distanciaKm, ' km')} · Intensidad: {record.intensidad ?? 'N/D'}
                </AppText>
                {record.tipoEjercicio ? (
                  <AppText style={styles.templateText}>Actividad: {record.tipoEjercicio}</AppText>
                ) : null}
                <AppText style={styles.templateAction}>{active ? 'Plantilla aplicada' : 'Usar como plantilla'}</AppText>
              </TouchableOpacity>
            );
          })
        ) : (
          <AppText style={styles.emptyText}>Todavia no hay registros previos para este paciente.</AppText>
        )}
        {historyError ? <AppText style={styles.errorText}>{historyError}</AppText> : null}
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>Datos del registro</AppText>

        <AppText style={styles.fieldLabel}>Fecha</AppText>
        <AppTextInput
          style={styles.input}
          value={form.fecha}
          onChangeText={(value) => handleChange('fecha', value)}
          placeholder="Fecha (YYYY-MM-DD)"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="none"
        />

        <View style={styles.row}>
          <View style={styles.fieldGroupHalf}>
            <AppText style={styles.fieldLabel}>Peso</AppText>
            <AppTextInput
              style={styles.input}
              value={form.peso}
              onChangeText={(value) => handleChange('peso', value)}
              placeholder="Peso (kg)"
              placeholderTextColor="#9FB3C8"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.fieldGroupHalf}>
            <AppText style={styles.fieldLabel}>Minutos de ejercicio</AppText>
            <AppTextInput
              style={styles.input}
              value={form.minutosEjercicio}
              onChangeText={(value) => handleChange('minutosEjercicio', value)}
              placeholder="Ejercicio min"
              placeholderTextColor="#9FB3C8"
              keyboardType="numeric"
            />
          </View>
        </View>

        <AppText style={styles.fieldLabel}>Tipo de ejercicio</AppText>
        <AppTextInput
          style={styles.input}
          value={form.tipoEjercicio}
          onChangeText={(value) => handleChange('tipoEjercicio', value)}
          placeholder="Tipo de ejercicio"
          placeholderTextColor="#9FB3C8"
        />

        <AppText style={styles.fieldLabel}>Intensidad</AppText>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.intensidad}
            onValueChange={(value) => handleChange('intensidad', String(value))}
            style={styles.picker}
            dropdownIconColor="#F4F8FF"
          >
            {intensidadOptions.map((item) => (
              <Picker.Item
                key={`intensidad-${item.value || 'none'}`}
                label={item.label}
                value={item.value}
                color="#F4F8FF"
              />
            ))}
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldGroupHalf}>
            <AppText style={styles.fieldLabel}>Pasos</AppText>
            <AppTextInput
              style={styles.input}
              value={form.pasos}
              onChangeText={(value) => handleChange('pasos', value)}
              placeholder="Pasos"
              placeholderTextColor="#9FB3C8"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldGroupHalf}>
            <AppText style={styles.fieldLabel}>Calorias quemadas</AppText>
            <AppTextInput
              style={styles.input}
              value={form.caloriasQuemadas}
              onChangeText={(value) => handleChange('caloriasQuemadas', value)}
              placeholder="Calorias"
              placeholderTextColor="#9FB3C8"
              keyboardType="numeric"
            />
          </View>
        </View>

        <AppText style={styles.fieldLabel}>Distancia</AppText>
        <AppTextInput
          style={styles.input}
          value={form.distanciaKm}
          onChangeText={(value) => handleChange('distanciaKm', value)}
          placeholder="Distancia (km)"
          placeholderTextColor="#9FB3C8"
          keyboardType="decimal-pad"
        />

        <AppText style={styles.fieldLabel}>Notas</AppText>
        <AppTextInput
          style={[styles.input, styles.textArea]}
          value={form.notas}
          onChangeText={(value) => handleChange('notas', value)}
          placeholder="Notas"
          placeholderTextColor="#9FB3C8"
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting || !form.pacienteId}
        >
          {submitting ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <AppText style={styles.primaryBtnText}>Guardar seguimiento</AppText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#071120',
    gap: 16,
  },
  hero: {
    backgroundColor: '#29B6FF18',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#29B6FF',
  },
  heroTitle: {
    color: '#F4F8FF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroText: {
    color: '#C9D7E8',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionText: {
    color: '#C9D7E8',
    fontSize: 13,
    lineHeight: 18,
  },
  pickerWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#315579',
    backgroundColor: '#0C1C31',
  },
  picker: {
    height: 50,
    color: '#F4F8FF',
    backgroundColor: '#0C1C31',
  },
  input: {
    backgroundColor: '#0C1C31',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#315579',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F4F8FF',
  },
  textArea: {
    minHeight: 92,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fieldGroupHalf: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F4F8FF',
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
    color: '#C9D7E8',
    marginTop: 8,
  },
  emptyText: {
    color: '#C9D7E8',
    lineHeight: 20,
  },
  errorText: {
    color: '#FF4D73',
    lineHeight: 20,
  },
  templateCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: '#071120',
  },
  templateCardActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF18',
  },
  templateTitle: {
    color: '#F4F8FF',
    fontWeight: '700',
  },
  templateText: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  templateAction: {
    color: '#29B6FF',
    fontWeight: '700',
    marginTop: 6,
  },
});
