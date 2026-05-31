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
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import type { RootStackParamList } from '../navigation/types';

type TipoOperacion = {
  tipooperacionId: number;
  nombre: string;
};

type OperacionRecord = {
  operacionId: number;
  pacienteId: number;
  tipooperacionId?: number | null;
  fechaoperacion: string;
  tipo: string;
  hospital?: string | null;
  cirujano?: string | null;
  resultado?: string | null;
  complicaciones?: string | null;
  estado?: string | null;
};

type PatientOperationSummary = {
  pacienteId: number;
  patientName: string;
  total: number;
  latestDate: string | null;
  latestType: string | null;
  complicationCount: number;
  operationNames: string[];
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

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const getStatusColors = (status?: string | null) => {
  const normalized = normalizeText(status)?.toLowerCase() ?? '';
  if (
    normalized.includes('complic') ||
    normalized.includes('pendient') ||
    normalized.includes('riesgo')
  ) {
    return { backgroundColor: '#FF4D7318', color: '#FF4D73', borderColor: '#FF4D73' };
  }
  if (
    normalized.includes('alta') ||
    normalized.includes('recuper') ||
    normalized.includes('estable') ||
    normalized.includes('exit')
  ) {
    return { backgroundColor: '#38F28E18', color: '#38F28E', borderColor: '#38F28E' };
  }
  return { backgroundColor: '#182A44', color: '#29B6FF', borderColor: '#29B6FF' };
};

type OperacionFormScreenProps = {
  mode?: 'list' | 'create';
};

export function OperacionFormScreen({ mode = 'list' }: OperacionFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [typeOptions, setTypeOptions] = useState<TipoOperacion[]>([]);
  const [records, setRecords] = useState<OperacionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
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
      setForm((prev) =>
        prev.pacienteId || normalized.length === 0
          ? prev
          : { ...prev, pacienteId: String(normalized[0].pacienteId) },
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

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
          .filter(
            (item: TipoOperacion) =>
              Number.isFinite(item.tipooperacionId) && item.tipooperacionId > 0,
          ),
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Fallo al cargar tipos de operacion',
      );
    } finally {
      setLoadingTypes(false);
    }
  }, [authHeaders]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/operacion`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las operaciones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any, index: number) => ({
            operacionId: Number(item?.operacionId ?? item?.operacionid ?? item?.id ?? index + 1),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            tipooperacionId: Number(item?.tipooperacionId ?? item?.tipooperacionid ?? 0) || null,
            fechaoperacion: toDateOnlyString(item?.fechaoperacion),
            tipo: normalizeText(item?.tipo) ?? '',
            hospital: normalizeText(item?.hospital),
            cirujano: normalizeText(item?.cirujano),
            resultado: normalizeText(item?.resultado),
            complicaciones: normalizeText(item?.complicaciones),
            estado: normalizeText(item?.estado),
          }))
          .filter((item: OperacionRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0)
          .sort(
            (a: OperacionRecord, b: OperacionRecord) =>
              new Date(b.fechaoperacion).getTime() - new Date(a.fechaoperacion).getTime(),
          ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar operaciones');
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
      map[item.tipooperacionId] = item.nombre;
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

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return records.filter((record) => record.pacienteId === activePatientId);
    }
    return records;
  }, [records, selectedPatientId]);

  const patientSummaries = useMemo<PatientOperationSummary[]>(() => {
    const grouped = new Map<number, OperacionRecord[]>();
    records.forEach((record) => {
      const list = grouped.get(record.pacienteId) ?? [];
      list.push(record);
      grouped.set(record.pacienteId, list);
    });

    return Array.from(grouped.entries())
      .map(([pacienteId, items]) => {
        const operationNames = Array.from(
          new Set(
            items
              .map((item) => normalizeText(item.tipo) ?? typeNameById[item.tipooperacionId ?? 0] ?? null)
              .filter((value): value is string => Boolean(value)),
          ),
        );
        return {
          pacienteId,
          patientName: patientNameById[pacienteId] ?? `Paciente #${pacienteId}`,
          total: items.length,
          latestDate: items[0]?.fechaoperacion ?? null,
          latestType:
            normalizeText(items[0]?.tipo) ??
            typeNameById[items[0]?.tipooperacionId ?? 0] ??
            null,
          complicationCount: items.filter((item) => Boolean(normalizeText(item.complicaciones))).length,
          operationNames,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latestDate ?? 0).getTime() - new Date(a.latestDate ?? 0).getTime(),
      );
  }, [patientNameById, records, typeNameById]);

  const visiblePatientSummaries = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return patientSummaries.filter((summary) => summary.pacienteId === activePatientId);
    }
    return patientSummaries;
  }, [patientSummaries, selectedPatientId]);

  const metrics = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return {
      total: filteredRecords.length,
      patients: new Set(filteredRecords.map((record) => record.pacienteId)).size,
      complications: filteredRecords.filter((record) => Boolean(normalizeText(record.complicaciones)))
        .length,
      thisYear: filteredRecords.filter((record) => {
        const parsed = new Date(record.fechaoperacion);
        return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === currentYear;
      }).length,
    };
  }, [filteredRecords]);

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
          if (event.type === 'set' && selected) {
            handleChange('fecha', toDateOnlyString(selected));
          }
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.tipo.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha y tipo de operacion son obligatorios');
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
          'No habia conexion. La operacion quedo guardada localmente y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert('Operacion guardada', 'La operacion fue registrada correctamente');
        fetchRecords();
      }

      resetForm();
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Seguimiento quirurgico</Text>
            <Text style={styles.title}>Operaciones</Text>
            <Text style={styles.subtitle}>
            {isCreateMode
              ? 'Registra una nueva intervencion quirurgica en una vista dedicada para dejar el historial mas ordenado.'
              : 'Revisa antecedentes quirurgicos por persona y registra nuevas intervenciones con un historial mas claro.'}
          </Text>
        </View>

        {!isCreateMode ? (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.total}</Text>
                <Text style={styles.metricLabel}>Operaciones</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.patients}</Text>
                <Text style={styles.metricLabel}>Pacientes</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.complications}</Text>
                <Text style={styles.metricLabel}>Con complicaciones</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{metrics.thisYear}</Text>
                <Text style={styles.metricLabel}>Este ano</Text>
              </View>
            </View>

            <View style={styles.filterCard}>
              <Text style={styles.label}>Filtrar por paciente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedPatientId}
                  onValueChange={(value) => setSelectedPatientId(String(value))}
                  enabled={!loadingPatients}
                  dropdownIconColor="#F4F8FF"
                  style={styles.picker}
                >
                  <Picker.Item
                    label={loadingPatients ? 'Cargando pacientes...' : 'Todos los pacientes'}
                    value=""
                    color={pickerItemColor}
                  />
                  {patientOptions.map((patient) => (
                    <Picker.Item
                      key={patient.pacienteId}
                      label={patient.displayName}
                      value={String(patient.pacienteId)}
                      color={pickerItemColor}
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.filterHint}>
                {selectedPatientId
                  ? `Mostrando historial de ${patientNameById[Number(selectedPatientId)] ?? 'paciente'}`
                  : 'Mostrando el historial completo de tu grupo familiar'}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personas y operaciones</Text>
              <Text style={styles.sectionSubtitle}>{`${visiblePatientSummaries.length} perfiles`}</Text>
            </View>

            {loadingRecords ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#29B6FF" />
                <Text style={styles.loadingText}>Cargando resumen de operaciones...</Text>
              </View>
            ) : visiblePatientSummaries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Todavia no hay operaciones registradas</Text>
                <Text style={styles.emptyText}>
                  Usa el boton flotante para registrar la primera operacion de un paciente.
                </Text>
              </View>
            ) : (
              visiblePatientSummaries.map((summary) => (
                <TouchableOpacity
                  key={summary.pacienteId}
                  style={[
                    styles.summaryCard,
                    Number(selectedPatientId) === summary.pacienteId ? styles.summaryCardActive : null,
                  ]}
                  onPress={() =>
                    setSelectedPatientId((current) =>
                      Number(current) === summary.pacienteId ? '' : String(summary.pacienteId),
                    )
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryHeaderBody}>
                      <Text style={styles.summaryName}>{summary.patientName}</Text>
                      <Text style={styles.summaryMeta}>
                        {summary.latestDate
                          ? `Ultima: ${formatRecordDate(summary.latestDate)}`
                          : 'Sin fecha reciente'}
                      </Text>
                    </View>
                    <View style={styles.summaryCountBadge}>
                      <Text style={styles.summaryCountValue}>{summary.total}</Text>
                      <Text style={styles.summaryCountLabel}>ops</Text>
                    </View>
                  </View>

                  <Text style={styles.summaryPrimary}>
                    {summary.latestType ?? 'Operacion registrada'}
                  </Text>
                  <Text style={styles.summarySecondary}>
                    {summary.complicationCount > 0
                      ? `${summary.complicationCount} con complicaciones registradas`
                      : 'Sin complicaciones reportadas'}
                  </Text>

                  {summary.operationNames.length > 0 ? (
                    <View style={styles.chipRow}>
                      {summary.operationNames.slice(0, 4).map((name) => (
                        <View key={`${summary.pacienteId}-${name}`} style={styles.chip}>
                          <Text style={styles.chipText}>{name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.summaryAction}>
                    {Number(selectedPatientId) === summary.pacienteId
                      ? 'Toca para volver a ver todos'
                      : 'Toca para filtrar este historial'}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial de operaciones</Text>
              <Text style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</Text>
            </View>

            {loadingRecords ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#29B6FF" />
                <Text style={styles.loadingText}>Cargando historial...</Text>
              </View>
            ) : filteredRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No hay operaciones para este filtro</Text>
                <Text style={styles.emptyText}>
                  Cambia el paciente seleccionado o registra una nueva operacion.
                </Text>
              </View>
            ) : (
              filteredRecords.map((record) => {
                const statusColors = getStatusColors(record.estado);
                const typeLabel =
                  normalizeText(record.tipo) ?? typeNameById[record.tipooperacionId ?? 0] ?? 'Operacion';
                return (
                  <View
                    key={record.operacionId}
                    style={[
                      styles.recordCard,
                      normalizeText(record.complicaciones) ? styles.recordCardAlert : null,
                    ]}
                  >
                    <View style={styles.recordTopRow}>
                      <View style={styles.datePill}>
                        <Text style={styles.datePillText}>{formatRecordDate(record.fechaoperacion)}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: statusColors.backgroundColor,
                            borderColor: statusColors.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.statusPillText, { color: statusColors.color }]}>
                          {normalizeText(record.estado) ?? 'Registrada'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.recordTitle}>{typeLabel}</Text>
                    {!selectedPatientId ? (
                      <Text style={styles.recordPatient}>
                        {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                      </Text>
                    ) : null}

                    <Text style={styles.recordText}>
                      Hospital: {normalizeText(record.hospital) ?? 'Sin dato'}
                    </Text>
                    <Text style={styles.recordText}>
                      Cirujano: {normalizeText(record.cirujano) ?? 'Sin dato'}
                    </Text>
                    <Text style={styles.recordText}>
                      Resultado: {normalizeText(record.resultado) ?? 'Sin dato'}
                    </Text>
                    {normalizeText(record.complicaciones) ? (
                      <Text style={styles.recordAlertText}>
                        Complicaciones: {normalizeText(record.complicaciones)}
                      </Text>
                    ) : (
                      <Text style={styles.recordText}>Complicaciones: Sin dato</Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        ) : null}

        {isCreateMode ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva operacion</Text>
            <Text style={styles.formSubtitle}>
              Completa los datos del procedimiento para dejarlo visible en el historial del
              paciente.
            </Text>

            <Text style={styles.label}>Paciente</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.pacienteId}
                onValueChange={(value) => handleChange('pacienteId', String(value))}
                enabled={!loadingPatients}
                dropdownIconColor="#F4F8FF"
                style={styles.picker}
              >
                <Picker.Item
                  label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'}
                  value=""
                  color={pickerItemColor}
                />
                {patientOptions.map((patient) => (
                  <Picker.Item
                    key={patient.pacienteId}
                    label={patient.displayName}
                    value={String(patient.pacienteId)}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Tipo de operacion</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.tipooperacionId}
                onValueChange={(value) => handleTypeChange(String(value))}
                enabled={!loadingTypes}
                dropdownIconColor="#F4F8FF"
                style={styles.picker}
              >
                <Picker.Item
                  label={loadingTypes ? 'Cargando tipos...' : 'Selecciona un tipo'}
                  value=""
                  color={pickerItemColor}
                />
                {typeOptions.map((item) => (
                  <Picker.Item
                    key={item.tipooperacionId}
                    label={item.nombre}
                    value={String(item.tipooperacionId)}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Fecha</Text>
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
                  onChange={(_, selected) => {
                    if (selected) handleChange('fecha', toDateOnlyString(selected));
                  }}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowIOSDatePicker(false)}
                >
                  <Text style={styles.secondaryButtonText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Nombre del procedimiento"
              placeholderTextColor="#9FB3C8"
              value={form.tipo}
              onChangeText={(value) => handleChange('tipo', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Hospital"
              placeholderTextColor="#9FB3C8"
              value={form.hospital}
              onChangeText={(value) => handleChange('hospital', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Cirujano"
              placeholderTextColor="#9FB3C8"
              value={form.cirujano}
              onChangeText={(value) => handleChange('cirujano', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Estado"
              placeholderTextColor="#9FB3C8"
              value={form.estado}
              onChangeText={(value) => handleChange('estado', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Resultado"
              placeholderTextColor="#9FB3C8"
              value={form.resultado}
              onChangeText={(value) => handleChange('resultado', value)}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Complicaciones"
              placeholderTextColor="#9FB3C8"
              value={form.complicaciones}
              multiline
              onChangeText={(value) => handleChange('complicaciones', value)}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  if (navigation.canGoBack()) navigation.goBack();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setShowIOSDatePicker(false);
            navigation.navigate('OperacionCreate');
          }}
        >
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
    paddingBottom: 120,
    backgroundColor: '#071120',
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  eyebrow: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 10,
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
    marginHorizontal: -5,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  metricLabel: {
    marginTop: 6,
    color: '#C9D7E8',
    fontSize: 13,
  },
  filterCard: {
    backgroundColor: '#071120',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
  },
  picker: {
    color: '#F4F8FF',
  },
  filterHint: {
    marginTop: 10,
    color: '#9FB3C8',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  loadingCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#C9D7E8',
  },
  emptyCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: '#9FB3C8',
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 12,
  },
  summaryCardActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF18',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryHeaderBody: {
    flex: 1,
    paddingRight: 12,
  },
  summaryName: {
    color: '#F4F8FF',
    fontSize: 17,
    fontWeight: '900',
  },
  summaryMeta: {
    marginTop: 4,
    color: '#9FB3C8',
  },
  summaryCountBadge: {
    minWidth: 60,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#38F28E18',
    borderWidth: 1,
    borderColor: '#38F28E',
    alignItems: 'center',
  },
  summaryCountValue: {
    color: '#38F28E',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryCountLabel: {
    color: '#38F28E',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryPrimary: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  summarySecondary: {
    marginTop: 6,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#27496D',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#C9D7E8',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryAction: {
    marginTop: 8,
    color: '#29B6FF',
    fontWeight: '700',
    fontSize: 13,
  },
  recordCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  recordCardAlert: {
    borderColor: '#FF4D73',
    backgroundColor: '#071120',
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#29B6FF18',
  },
  datePillText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  statusPillText: {
    fontWeight: '800',
    fontSize: 12,
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  recordPatient: {
    color: '#29B6FF',
    fontWeight: '700',
    marginBottom: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
  },
  recordAlertText: {
    color: '#FF4D73',
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  formSubtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: '#9FB3C8',
    lineHeight: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#071120',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  secondaryButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#071120',
    marginRight: 6,
  },
  cancelButtonText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#29B6FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginLeft: 6,
  },
  primaryButtonText: {
    color: '#F4F8FF',
    fontWeight: '900',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
  },
});
