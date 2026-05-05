import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type LinkedPatient = { pacienteId: number; displayName: string };
type LesionRecord = {
  lesionId: number;
  pacienteId: number;
  fechalesion: string;
  tipo: string;
  partecuerpo?: string | null;
  severidad?: string | null;
  tratamiento?: string | null;
  recuperado?: boolean | null;
  notas?: string | null;
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return [input.getFullYear(), String(input.getMonth() + 1).padStart(2, '0'), String(input.getDate()).padStart(2, '0')].join('-');
  }
  const match = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  const parts = value?.split('-').map(Number) ?? [];
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function LesionFormScreen() {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<LesionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: '',
    tipo: '',
    parteCuerpo: '',
    severidad: '',
    tratamiento: '',
    recuperado: false,
    notas: '',
  });

  const headers = useMemo<Record<string, string>>(
    () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token],
  );
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = useCallback(() => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      fecha: '',
      tipo: '',
      parteCuerpo: '',
      severidad: '',
      tratamiento: '',
      recuperado: false,
      notas: '',
    }));
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
    setLoadingPatients(true);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los pacientes');
      const items: (LinkedPatient | null)[] = Array.isArray(body)
        ? await Promise.all(
            body.map(async (relation: any) => {
              const pacienteId = Number(relation?.pacienteId ?? relation?.pacienteid ?? relation?.id ?? relation?.paciente?.pacienteId);
              if (!Number.isFinite(pacienteId)) return null;
              let displayName = relation?.displayName ?? relation?.nombrePaciente ?? relation?.paciente?.displayName ?? `Paciente #${pacienteId}`;
              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, { headers: authHeaders });
                const patientBody = await patientResponse.json().catch(() => null);
                if (patientResponse.ok && patientBody) {
                  const fullName = `${patientBody?.nombres ?? ''} ${patientBody?.apellidos ?? ''}`.trim();
                  if (fullName) displayName = fullName;
                }
              } catch {}
              return { pacienteId, displayName };
            }),
          )
        : [];
      let normalized = items.filter((item): item is LinkedPatient => Boolean(item));
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [{ pacienteId: Number(user.pacienteId), displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}` }];
      }
      setPatientOptions(normalized);
      if (!form.pacienteId && normalized.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(normalized[0].pacienteId) }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchRecords = useCallback(async () => {
    if (!token) {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/lesion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las lesiones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            lesionId: item?.lesionId ?? item?.lesionid ?? item?.id ?? Math.random(),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            fechalesion: item?.fechalesion ?? '',
            tipo: item?.tipo ?? '',
            partecuerpo: item?.partecuerpo ?? null,
            severidad: item?.severidad ?? null,
            tratamiento: item?.tratamiento ?? null,
            recuperado: Boolean(item?.recuperado),
            notas: item?.notas ?? null,
          }))
          .filter((item: LesionRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0)
          .sort((a: LesionRecord, b: LesionRecord) => new Date(b.fechalesion).getTime() - new Date(a.fechalesion).getTime()),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar lesiones');
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
    fetchRecords();
  }, [fetchPatients, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    return Number.isFinite(activePatientId) && activePatientId
      ? records.filter((record) => record.pacienteId === activePatientId)
      : records;
  }, [form.pacienteId, records]);

  const selectedPatientName = useMemo(
    () => patientOptions.find((patient) => String(patient.pacienteId) === form.pacienteId)?.displayName ?? '',
    [patientOptions, form.pacienteId],
  );

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form.fecha),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) handleChange('fecha', toDateOnlyString(selected));
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.tipo.trim()) {
      Alert.alert('Faltan Datos', 'Paciente, fecha y tipo de lesión son obligatorios');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/lesion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          fechalesion: form.fecha,
          tipo: form.tipo.trim(),
          partecuerpo: form.parteCuerpo.trim() || undefined,
          severidad: form.severidad.trim() || undefined,
          tratamiento: form.tratamiento.trim() || undefined,
          recuperado: form.recuperado,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo guardar la lesión');
      }
      Alert.alert('Lesión Guardada', 'La lesión fue registrada correctamente');
      resetForm();
      setShowForm(false);
      fetchRecords();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Lesiones</Text>
        <Text style={styles.subtitle}>Primero selecciona el paciente para filtrar su historial.</Text>

        <View style={styles.filterCard}>
          <Text style={styles.label}>Paciente</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
              enabled={!loadingPatients}
            >
              <Picker.Item label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'} value="" />
              {patientOptions.map((patient) => (
                <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} />
              ))}
            </Picker>
          </View>
          {selectedPatientName ? <Text style={styles.patientHint}>Mostrando: {selectedPatientName}</Text> : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de lesiones</Text>
          <Text style={styles.sectionSubtitle}>{loadingRecords ? 'Cargando...' : `${filteredRecords.length} registros`}</Text>
        </View>

        {filteredRecords.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay lesiones registradas para este paciente.</Text>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.lesionId} style={styles.card}>
              <Text style={styles.cardTitle}>{record.tipo || 'Lesión'}</Text>
              <Text style={styles.cardText}>Fecha: {formatRecordDate(record.fechalesion)}</Text>
              <Text style={styles.cardText}>Parte del cuerpo: {record.partecuerpo || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Severidad: {record.severidad || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Tratamiento: {record.tratamiento || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Recuperado: {record.recuperado ? 'Sí' : 'No'}</Text>
              {record.notas ? <Text style={styles.cardText}>Notas: {record.notas}</Text> : null}
            </View>
          ))
        )}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva lesión</Text>
            <Text style={styles.label}>Fecha de la lesión</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSDatePicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  value={parseDateForPicker(form.fecha)}
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  onChange={(_, selected) => selected && handleChange('fecha', toDateOnlyString(selected))}
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSDatePicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput style={styles.input} placeholder="Tipo de lesión" value={form.tipo} onChangeText={(value) => handleChange('tipo', value)} />
            <TextInput style={styles.input} placeholder="Parte del cuerpo" value={form.parteCuerpo} onChangeText={(value) => handleChange('parteCuerpo', value)} />
            <TextInput style={styles.input} placeholder="Severidad" value={form.severidad} onChangeText={(value) => handleChange('severidad', value)} />
            <TextInput style={styles.input} placeholder="Tratamiento" value={form.tratamiento} onChangeText={(value) => handleChange('tratamiento', value)} />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>¿Recuperado?</Text>
              <Switch value={form.recuperado} onValueChange={(value) => handleChange('recuperado', value)} />
            </View>
            <TextInput style={[styles.input, styles.multiline]} placeholder="Notas" value={form.notas} multiline onChangeText={(value) => handleChange('notas', value)} />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowForm(false); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <Text style={styles.fabText}>{showForm ? '×' : '+'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f172a' },
  container: { padding: 24, paddingBottom: 110, backgroundColor: '#0f172a' },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#cbd5e1' },
  filterCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 18 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#334155', marginTop: 8 },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#f8fafc', marginBottom: 8 },
  pickerWrapper: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: '#0b1220' },
  patientHint: { color: '#cbd5e1' },
  dateButton: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#0b1220' },
  dateButtonText: { color: '#f8fafc', textAlign: 'center', fontSize: 15 },
  iosPickerCard: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, overflow: 'hidden', backgroundColor: '#0b1220', marginBottom: 12 },
  secondaryBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
  secondaryBtnText: { color: '#7dd3fc', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, backgroundColor: '#0b1220', color: '#f8fafc' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, backgroundColor: '#0b1220' },
  switchLabel: { color: '#f8fafc', fontWeight: '700' },
  formActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#475569', backgroundColor: '#0b1220' },
  cancelBtnText: { color: '#cbd5e1', fontWeight: '700' },
  primaryBtn: { flex: 1, backgroundColor: '#0f766e', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  sectionSubtitle: { color: '#cbd5e1', marginTop: 2 },
  emptyText: { color: '#cbd5e1', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  cardText: { color: '#cbd5e1', marginBottom: 4 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '700' },
});
