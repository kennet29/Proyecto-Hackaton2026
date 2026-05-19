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
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';

type LinkedPatient = { pacienteId: number; displayName: string };
type TipoOperacion = { tipooperacionId: number; nombre: string };
type OperacionRecord = {
  operacionId: number;
  pacienteId: number;
  fechaoperacion: string;
  tipo: string;
  hospital?: string | null;
  cirujano?: string | null;
  resultado?: string | null;
  complicaciones?: string | null;
  estado?: string | null;
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

export function OperacionFormScreen() {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [typeOptions, setTypeOptions] = useState<TipoOperacion[]>([]);
  const [records, setRecords] = useState<OperacionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '',
    tipooperacionId: '',
    fecha: '',
    tipo: '',
    hospital: '',
    cirujano: '',
    resultado: '',
    complicaciones: '',
    estado: 'Registrada',
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
      tipooperacionId: '',
      fecha: '',
      tipo: '',
      hospital: '',
      cirujano: '',
      resultado: '',
      complicaciones: '',
      estado: 'Registrada',
    }));
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) return;
    setLoadingPatients(true);
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
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch(`${API_URL}/tipooperacion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los tipos');
      setTypeOptions(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            tipooperacionId: Number(item?.tipooperacionId ?? item?.tipooperacionid ?? item?.id ?? 0),
            nombre: item?.nombre ?? 'Sin nombre',
          }))
          .filter((item: TipoOperacion) => Number.isFinite(item.tipooperacionId) && item.tipooperacionId > 0),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar tipos de operación');
    } finally {
      setLoadingTypes(false);
    }
  }, [authHeaders]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/operacion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las operaciones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            operacionId: item?.operacionId ?? item?.operacionid ?? item?.id ?? Math.random(),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            fechaoperacion: item?.fechaoperacion ?? '',
            tipo: item?.tipo ?? '',
            hospital: item?.hospital ?? null,
            cirujano: item?.cirujano ?? null,
            resultado: item?.resultado ?? null,
            complicaciones: item?.complicaciones ?? null,
            estado: item?.estado ?? null,
          }))
          .filter((item: OperacionRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0)
          .sort((a: OperacionRecord, b: OperacionRecord) => new Date(b.fechaoperacion).getTime() - new Date(a.fechaoperacion).getTime()),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló al cargar operaciones');
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

  const handleTypeChange = (value: string) => {
    const selected = typeOptions.find((item) => String(item.tipooperacionId) === value);
    setForm((prev) => ({ ...prev, tipooperacionId: value, tipo: selected?.nombre ?? prev.tipo }));
  };

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
      Alert.alert('Faltan Datos', 'Paciente, fecha y tipo de operación son obligatorios');
      return;
    }
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/operacion',
        method: 'POST',
        description: 'registrar operacion',
        body: {
          pacienteId: Number(form.pacienteId),
          tipooperacionId: form.tipooperacionId ? Number(form.tipooperacionId) : undefined,
          fechaoperacion: form.fecha,
          tipo: form.tipo.trim(),
          hospital: form.hospital.trim() || undefined,
          cirujano: form.cirujano.trim() || undefined,
          resultado: form.resultado.trim() || undefined,
          complicaciones: form.complicaciones.trim() || undefined,
          estado: form.estado.trim() || 'Registrada',
          creadopor: user?.username ?? undefined,
        },
      });
      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Operacion en cola',
          'No habia conexion. La operacion quedo guardada localmente y se sincronizara automaticamente cuando vuelva la red.',
        );
      } else {
        Alert.alert('Operacion Guardada', 'La operacion fue registrada correctamente');
        fetchRecords();
      }
      resetForm();
      setShowForm(false);
      return;

      const response = await fetch(`${API_URL}/operacion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          tipooperacionId: form.tipooperacionId ? Number(form.tipooperacionId) : undefined,
          fechaoperacion: form.fecha,
          tipo: form.tipo.trim(),
          hospital: form.hospital.trim() || undefined,
          cirujano: form.cirujano.trim() || undefined,
          resultado: form.resultado.trim() || undefined,
          complicaciones: form.complicaciones.trim() || undefined,
          estado: form.estado.trim() || 'Registrada',
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo guardar la operación');
      }
      Alert.alert('Operación Guardada', 'La operación fue registrada correctamente');
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
        <Text style={styles.title}>Operaciones</Text>
        <Text style={styles.subtitle}>Selecciona el paciente primero para filtrar su historial.</Text>

        <View style={styles.filterCard}>
          <Text style={styles.label}>Paciente</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={form.pacienteId} onValueChange={(value) => handleChange('pacienteId', String(value))} enabled={!loadingPatients}>
              <Picker.Item label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'} value="" />
              {patientOptions.map((patient) => <Picker.Item key={patient.pacienteId} label={patient.displayName} value={String(patient.pacienteId)} />)}
            </Picker>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de operaciones</Text>
          <Text style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</Text>
        </View>
        {filteredRecords.length === 0 ? (
          <Text style={styles.emptyText}>No hay operaciones registradas para este paciente.</Text>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.operacionId} style={styles.card}>
              <Text style={styles.cardTitle}>{record.tipo || 'Operación'}</Text>
              <Text style={styles.cardText}>Fecha: {formatRecordDate(record.fechaoperacion)}</Text>
              <Text style={styles.cardText}>Hospital: {record.hospital || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Cirujano: {record.cirujano || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Estado: {record.estado || 'Sin dato'}</Text>
              <Text style={styles.cardText}>Resultado: {record.resultado || 'Sin dato'}</Text>
              {record.complicaciones ? <Text style={styles.cardText}>Complicaciones: {record.complicaciones}</Text> : null}
            </View>
          ))
        )}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva operación</Text>
            <Text style={styles.label}>Tipo de operación</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={form.tipooperacionId} onValueChange={(value) => handleTypeChange(String(value))} enabled={!loadingTypes}>
                <Picker.Item label={loadingTypes ? 'Cargando tipos...' : 'Selecciona un tipo'} value="" />
                {typeOptions.map((item) => <Picker.Item key={item.tipooperacionId} label={item.nombre} value={String(item.tipooperacionId)} />)}
              </Picker>
            </View>
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSDatePicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker value={parseDateForPicker(form.fecha)} mode="date" display="spinner" locale="es-NI" onChange={(_, selected) => selected && handleChange('fecha', toDateOnlyString(selected))} />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSDatePicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput style={styles.input} placeholder="Tipo / nombre de operación" value={form.tipo} onChangeText={(value) => handleChange('tipo', value)} />
            <TextInput style={styles.input} placeholder="Hospital" value={form.hospital} onChangeText={(value) => handleChange('hospital', value)} />
            <TextInput style={styles.input} placeholder="Cirujano" value={form.cirujano} onChangeText={(value) => handleChange('cirujano', value)} />
            <TextInput style={styles.input} placeholder="Estado" value={form.estado} onChangeText={(value) => handleChange('estado', value)} />
            <TextInput style={styles.input} placeholder="Resultado" value={form.resultado} onChangeText={(value) => handleChange('resultado', value)} />
            <TextInput style={[styles.input, styles.multiline]} placeholder="Complicaciones" value={form.complicaciones} multiline onChangeText={(value) => handleChange('complicaciones', value)} />
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
  primaryBtn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  sectionSubtitle: { color: '#cbd5e1', marginTop: 2 },
  emptyText: { color: '#cbd5e1', marginBottom: 12 },
  card: { backgroundColor: '#1e293b', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  cardText: { color: '#cbd5e1', marginBottom: 4 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, fontWeight: '700' },
});
