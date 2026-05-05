import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
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
type TipoCondicion = { tipocondicionId: number; nombre: string };
type CondicionRecord = {
  condicioncronicaId: number;
  pacienteId: number;
  tipocondicionId: number;
  fechadiagnostico?: string | null;
  estado?: string | null;
  severidad?: string | null;
  tratamientoprincipal?: string | null;
  proveedorlider?: string | null;
  proximoseguimiento?: string | null;
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
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date();
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' });
};

export function CondicionCronicaFormScreen() {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [typeOptions, setTypeOptions] = useState<TipoCondicion[]>([]);
  const [records, setRecords] = useState<CondicionRecord[]>([]);
  const [showIOSDiagnosticoPicker, setShowIOSDiagnosticoPicker] = useState(false);
  const [showIOSSeguimientoPicker, setShowIOSSeguimientoPicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '',
    tipocondicionId: '',
    fechadiagnostico: '',
    estado: 'Activa',
    severidad: '',
    tratamientoprincipal: '',
    proveedorlider: '',
    proximoseguimiento: '',
    notas: '',
  });

  const headers = useMemo<Record<string, string>>(() => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback(() => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      tipocondicionId: '',
      fechadiagnostico: '',
      estado: 'Activa',
      severidad: '',
      tratamientoprincipal: '',
      proveedorlider: '',
      proximoseguimiento: '',
      notas: '',
    }));
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los pacientes');
      const items: (LinkedPatient | null)[] = Array.isArray(body)
        ? await Promise.all(body.map(async (relation: any) => {
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
          }))
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
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tipocondicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los tipos');
      setTypeOptions(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            tipocondicionId: Number(item?.tipocondicionId ?? item?.tipocondicionid ?? item?.id ?? 0),
            nombre: item?.nombre ?? 'Sin nombre',
          }))
          .filter((item: TipoCondicion) => Number.isFinite(item.tipocondicionId) && item.tipocondicionId > 0),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar tipos de condición');
    }
  }, [authHeaders]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/condicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las condiciones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            condicioncronicaId: item?.condicioncronicaId ?? item?.condicioncronicaid ?? item?.id ?? Math.random(),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            tipocondicionId: Number(item?.tipocondicionId ?? item?.tipocondicionid ?? 0),
            fechadiagnostico: item?.fechadiagnostico ?? null,
            estado: item?.estado ?? null,
            severidad: item?.severidad ?? null,
            tratamientoprincipal: item?.tratamientoprincipal ?? null,
            proveedorlider: item?.proveedorlider ?? null,
            proximoseguimiento: item?.proximoseguimiento ?? null,
            notas: item?.notas ?? null,
          }))
          .filter((item: CondicionRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar condiciones crónicas');
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
    fetchTypes();
    fetchRecords();
  }, [fetchPatients, fetchTypes, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    return Number.isFinite(activePatientId) && activePatientId
      ? records.filter((record) => record.pacienteId === activePatientId)
      : records;
  }, [form.pacienteId, records]);

  const typeNameById = useMemo(() => {
    const map: Record<number, string> = {};
    typeOptions.forEach((item) => { map[item.tipocondicionId] = item.nombre; });
    return map;
  }, [typeOptions]);

  const showDatePicker = (field: 'fechadiagnostico' | 'proximoseguimiento') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[field]),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) handleChange(field, toDateOnlyString(selected));
        },
      });
      return;
    }
    if (field === 'fechadiagnostico') setShowIOSDiagnosticoPicker(true);
    else setShowIOSSeguimientoPicker(true);
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.tipocondicionId) {
      Alert.alert('Faltan Datos', 'Paciente y tipo de condición son obligatorios');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/condicioncronica`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          tipocondicionId: Number(form.tipocondicionId),
          fechadiagnostico: form.fechadiagnostico || undefined,
          estado: form.estado.trim() || 'Activa',
          severidad: form.severidad.trim() || undefined,
          tratamientoprincipal: form.tratamientoprincipal.trim() || undefined,
          proveedorlider: form.proveedorlider.trim() || undefined,
          proximoseguimiento: form.proximoseguimiento || undefined,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo guardar la condición crónica');
      }
      Alert.alert('Condición Guardada', 'La condición crónica fue registrada correctamente');
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
        <Text style={styles.title}>Condiciones Crónicas</Text>
        <Text style={styles.subtitle}>Selecciona el paciente primero para filtrar su historial.</Text>

        <View style={styles.filterCard}>
          <Text style={styles.label}>Paciente</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={form.pacienteId} onValueChange={(value) => handleChange('pacienteId', String(value))}>
              <Picker.Item label="Selecciona un paciente" value="" />
              {patientOptions.map((patient) => <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} />)}
            </Picker>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de condiciones</Text>
          <Text style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</Text>
        </View>
        {filteredRecords.length === 0 ? (
          <Text style={styles.emptyText}>No hay condiciones registradas para este paciente.</Text>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.condicioncronicaId} style={styles.card}>
              <Text style={styles.cardTitle}>{typeNameById[record.tipocondicionId] ?? `Condición #${record.tipocondicionId}`}</Text>
              <Text style={styles.cardText}>Diagnóstico: {formatRecordDate(record.fechadiagnostico)}</Text>
              <Text style={styles.cardText}>Estado: {record.estado || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Severidad: {record.severidad || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Tratamiento: {record.tratamientoprincipal || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Proveedor: {record.proveedorlider || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Seguimiento: {formatRecordDate(record.proximoseguimiento)}</Text>
              {record.notas ? <Text style={styles.cardText}>Notas: {record.notas}</Text> : null}
            </View>
          ))
        )}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva condición crónica</Text>
            <Text style={styles.label}>Tipo de condición</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={form.tipocondicionId} onValueChange={(value) => handleChange('tipocondicionId', String(value))}>
                <Picker.Item label="Selecciona una condición" value="" />
                {typeOptions.map((item) => <Picker.Item key={item.tipocondicionId} label={item.nombre} value={String(item.tipocondicionId)} />)}
              </Picker>
            </View>
            <Text style={styles.label}>Fecha de diagnóstico</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('fechadiagnostico')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechadiagnostico)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSDiagnosticoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker value={parseDateForPicker(form.fechadiagnostico)} mode="date" display="spinner" locale="es-NI" onChange={(_, selected) => selected && handleChange('fechadiagnostico', toDateOnlyString(selected))} />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSDiagnosticoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput style={styles.input} placeholder="Estado" value={form.estado} onChangeText={(value) => handleChange('estado', value)} />
            <TextInput style={styles.input} placeholder="Severidad" value={form.severidad} onChangeText={(value) => handleChange('severidad', value)} />
            <TextInput style={styles.input} placeholder="Tratamiento principal" value={form.tratamientoprincipal} onChangeText={(value) => handleChange('tratamientoprincipal', value)} />
            <TextInput style={styles.input} placeholder="Proveedor líder" value={form.proveedorlider} onChangeText={(value) => handleChange('proveedorlider', value)} />
            <Text style={styles.label}>Próximo seguimiento</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('proximoseguimiento')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.proximoseguimiento)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSSeguimientoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker value={parseDateForPicker(form.proximoseguimiento)} mode="date" display="spinner" locale="es-NI" onChange={(_, selected) => selected && handleChange('proximoseguimiento', toDateOnlyString(selected))} />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSSeguimientoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
  pickerWrapper: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#0b1220' },
  dateButton: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#0b1220' },
  dateButtonText: { color: '#f8fafc', textAlign: 'center', fontSize: 15 },
  iosPickerCard: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, overflow: 'hidden', backgroundColor: '#0b1220', marginBottom: 12 },
  secondaryBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
  secondaryBtnText: { color: '#7dd3fc', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, backgroundColor: '#0b1220', color: '#f8fafc' },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#475569', backgroundColor: '#0b1220' },
  cancelBtnText: { color: '#cbd5e1', fontWeight: '700' },
  primaryBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  sectionSubtitle: { color: '#cbd5e1', marginTop: 2 },
  emptyText: { color: '#cbd5e1', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  cardText: { color: '#cbd5e1', marginBottom: 4 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '700' },
});
