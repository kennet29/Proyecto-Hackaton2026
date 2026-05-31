import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type TipoCondicion = {
  tipocondicionId: number;
  nombre: string;
};

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
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
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

type CondicionCronicaFormScreenProps = {
  mode?: 'list' | 'create';
};

export function CondicionCronicaFormScreen({ mode = 'list' }: CondicionCronicaFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [typeOptions, setTypeOptions] = useState<TipoCondicion[]>([]);
  const [records, setRecords] = useState<CondicionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [showIOSDiagnosticoPicker, setShowIOSDiagnosticoPicker] = useState(false);
  const [showIOSSeguimientoPicker, setShowIOSSeguimientoPicker] = useState(false);
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

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    setLoadingPatients(true);
    try {
      let normalized = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }
      setPatientOptions(normalized);
      if (!form.pacienteId && normalized.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(normalized[0].pacienteId) }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
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
          .filter(
            (item: TipoCondicion) =>
              Number.isFinite(item.tipocondicionId) && item.tipocondicionId > 0,
          ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar tipos de condicion');
    }
  }, [authHeaders]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/condicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las condiciones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            condicioncronicaId:
              item?.condicioncronicaId ?? item?.condicioncronicaid ?? item?.id ?? Math.random(),
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
          .filter(
            (item: CondicionRecord) =>
              Number.isFinite(item.pacienteId) &&
              item.pacienteId > 0 &&
              Number.isFinite(item.tipocondicionId) &&
              item.tipocondicionId > 0,
          ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar condiciones cronicas');
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
    fetchTypes();
    fetchRecords();
  }, [fetchPatients, fetchTypes, fetchRecords]);

  const typeNameById = useMemo(() => {
    const map: Record<number, string> = {};
    typeOptions.forEach((item) => {
      map[item.tipocondicionId] = item.nombre;
    });
    return map;
  }, [typeOptions]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const groupedPatientConditions = useMemo(() => {
    return patientOptions.map((patient) => ({
      patient,
      conditions: records.filter((record) => record.pacienteId === patient.pacienteId),
    }));
  }, [patientOptions, records]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    return Number.isFinite(activePatientId) && activePatientId > 0
      ? records.filter((record) => record.pacienteId === activePatientId)
      : records;
  }, [form.pacienteId, records]);

  const selectedPatientName = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    if (!Number.isFinite(activePatientId) || activePatientId <= 0) {
      return 'todos los pacientes';
    }
    return patientNameById[activePatientId] ?? `Paciente #${activePatientId}`;
  }, [form.pacienteId, patientNameById]);

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

  const handleSubmit = useCallback(async () => {
    if (!form.pacienteId || !form.tipocondicionId) {
      Alert.alert('Faltan Datos', 'Paciente y tipo de condicion son obligatorios');
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
        throw new Error(body?.message ?? 'No se pudo guardar la condicion cronica');
      }
      Alert.alert('Condicion guardada', 'La condicion cronica fue registrada correctamente');
      resetForm();
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      }
      fetchRecords();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  }, [fetchRecords, form, headers, isCreateMode, navigation, resetForm, user?.username]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>ENFERMEDADES CRONICAS</Text>
          <Text style={styles.title}>
            {isCreateMode ? 'Nueva enfermedad cronica' : 'Personas y condiciones'}
          </Text>
          <Text style={styles.subtitle}>
            {isCreateMode
              ? 'Registra una nueva enfermedad cronica y deja programado su seguimiento.'
              : 'Revisa rapido que personas tienen condiciones cronicas y luego filtra el detalle si necesitas profundizar.'}
          </Text>
        </View>

        {!isCreateMode ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumen por persona</Text>
              <Text style={styles.sectionSubtitle}>
                {`${groupedPatientConditions.length} personas vinculadas`}
              </Text>
            </View>

            {loadingPatients || loadingRecords ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color="#38F28E" />
                <Text style={styles.stateText}>Cargando personas y condiciones...</Text>
              </View>
            ) : groupedPatientConditions.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>Sin personas vinculadas</Text>
                <Text style={styles.stateText}>
                  Todavia no hay personas disponibles para mostrar condiciones cronicas.
                </Text>
              </View>
            ) : (
              groupedPatientConditions.map(({ patient, conditions }) => (
                <View key={patient.pacienteId} style={styles.personCard}>
                  <View style={styles.personHeader}>
                    <View>
                      <Text style={styles.personName}>{patient.displayName}</Text>
                      <Text style={styles.personMeta}>
                        {conditions.length === 1 ? '1 condicion registrada' : `${conditions.length} condiciones registradas`}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{conditions.length}</Text>
                    </View>
                  </View>

                  {conditions.length === 0 ? (
                    <Text style={styles.emptyInlineText}>Sin condiciones cronicas registradas.</Text>
                  ) : (
                    conditions.map((record) => (
                      <View key={record.condicioncronicaId} style={styles.conditionRow}>
                        <View style={styles.conditionHeader}>
                          <Text style={styles.conditionName}>
                            {typeNameById[record.tipocondicionId] ?? `Condicion #${record.tipocondicionId}`}
                          </Text>
                          <Text style={styles.conditionState}>{record.estado || 'Sin estado'}</Text>
                        </View>
                        <Text style={styles.conditionText}>
                          Diagnostico: {formatRecordDate(record.fechadiagnostico)}
                        </Text>
                        <Text style={styles.conditionText}>
                          Severidad: {record.severidad || 'Sin dato'}
                        </Text>
                        <Text style={styles.conditionText}>
                          Tratamiento: {record.tratamientoprincipal || 'Sin dato'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ))
            )}

            <View style={styles.filterCard}>
              <Text style={styles.label}>Filtrar historial por paciente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.pacienteId}
                  onValueChange={(value) => handleChange('pacienteId', String(value))}
                  dropdownIconColor="#F4F8FF"
                >
                  <Picker.Item label="Selecciona un paciente" value="" />
                  {patientOptions.map((patient) => (
                    <Picker.Item
                      key={patient.pacienteId}
                      label={patient.displayName}
                      value={String(patient.pacienteId)}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial de condiciones</Text>
              <Text style={styles.sectionSubtitle}>
                {`${filteredRecords.length} registros para ${selectedPatientName}`}
              </Text>
            </View>

            {filteredRecords.length === 0 ? (
              <Text style={styles.emptyText}>No hay condiciones registradas para este paciente.</Text>
            ) : (
              filteredRecords.map((record) => (
                <View key={record.condicioncronicaId} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {typeNameById[record.tipocondicionId] ?? `Condicion #${record.tipocondicionId}`}
                  </Text>
                  <Text style={styles.cardText}>Paciente: {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}</Text>
                  <Text style={styles.cardText}>Diagnostico: {formatRecordDate(record.fechadiagnostico)}</Text>
                  <Text style={styles.cardText}>Estado: {record.estado || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Severidad: {record.severidad || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Tratamiento: {record.tratamientoprincipal || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Proveedor: {record.proveedorlider || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Seguimiento: {formatRecordDate(record.proximoseguimiento)}</Text>
                  {record.notas ? <Text style={styles.cardText}>Notas: {record.notas}</Text> : null}
                </View>
              ))
            )}
          </>
        ) : null}

        {isCreateMode ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva condicion cronica</Text>

            <Text style={styles.label}>Tipo de condicion</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.tipocondicionId}
                onValueChange={(value) => handleChange('tipocondicionId', String(value))}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item label="Selecciona una condicion" value="" />
                {typeOptions.map((item) => (
                  <Picker.Item
                    key={item.tipocondicionId}
                    label={item.nombre}
                    value={String(item.tipocondicionId)}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Fecha de diagnostico</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('fechadiagnostico')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechadiagnostico)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSDiagnosticoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  value={parseDateForPicker(form.fechadiagnostico)}
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  onChange={(_, selected) =>
                    selected && handleChange('fechadiagnostico', toDateOnlyString(selected))
                  }
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSDiagnosticoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Estado"
              placeholderTextColor="#9FB3C8"
              value={form.estado}
              onChangeText={(value) => handleChange('estado', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Severidad"
              placeholderTextColor="#9FB3C8"
              value={form.severidad}
              onChangeText={(value) => handleChange('severidad', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Tratamiento principal"
              placeholderTextColor="#9FB3C8"
              value={form.tratamientoprincipal}
              onChangeText={(value) => handleChange('tratamientoprincipal', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Proveedor lider"
              placeholderTextColor="#9FB3C8"
              value={form.proveedorlider}
              onChangeText={(value) => handleChange('proveedorlider', value)}
            />

            <Text style={styles.label}>Proximo seguimiento</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('proximoseguimiento')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.proximoseguimiento)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSSeguimientoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  value={parseDateForPicker(form.proximoseguimiento)}
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  onChange={(_, selected) =>
                    selected && handleChange('proximoseguimiento', toDateOnlyString(selected))
                  }
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSSeguimientoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Notas"
              placeholderTextColor="#9FB3C8"
              value={form.notas}
              multiline
              onChangeText={(value) => handleChange('notas', value)}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CondicionCronicaCreate')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 110,
    backgroundColor: '#071120',
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  kicker: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 8,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  filterCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  picker: {
    color: '#F4F8FF',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
    marginBottom: 12,
  },
  secondaryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#0D1B2A',
  },
  cancelBtnText: {
    color: '#C9D7E8',
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#38F28E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  sectionHeader: {
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  sectionSubtitle: {
    color: '#C9D7E8',
    marginTop: 2,
  },
  emptyText: {
    color: '#C9D7E8',
    marginBottom: 12,
  },
  stateBox: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  stateTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  stateText: {
    color: '#C9D7E8',
    textAlign: 'center',
  },
  personCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    gap: 12,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  personName: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 17,
  },
  personMeta: {
    color: '#29B6FF',
    marginTop: 2,
  },
  countBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#071120',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyInlineText: {
    color: '#C9D7E8',
  },
  conditionRow: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#0D1B2A',
    gap: 4,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  conditionName: {
    color: '#F4F8FF',
    fontWeight: '700',
    flex: 1,
  },
  conditionState: {
    color: '#38F28E',
    fontWeight: '700',
  },
  conditionText: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  cardText: {
    color: '#C9D7E8',
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#38F28E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
