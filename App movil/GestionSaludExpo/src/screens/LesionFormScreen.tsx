import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { parseCalendarDate } from '../utils/localDate';
import { getJsonWithOfflineFallback } from '../utils/offlineReadCache';

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

type LesionFormScreenProps = {
  mode?: 'list' | 'create';
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

const parseDateForPicker = (value?: string | null) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseCalendarDate(value);
  if (!parsed) return String(value);
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

export function LesionFormScreen({ mode = 'list' }: LesionFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<LesionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [filterPatientId, setFilterPatientId] = useState('');
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
    setShowIOSDatePicker(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
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

  const fetchRecords = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setLoadingRecords(false);
      setRefreshing(false);
      return;
    }
    setLoadingRecords(true);
    try {
      const { data: body } = await getJsonWithOfflineFallback<unknown>(
        '/lesion',
        authHeaders,
      );
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any, index: number) => ({
            lesionId: Number(item?.lesionId ?? item?.lesionid ?? item?.id ?? index + 1),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            fechalesion: toDateOnlyString(item?.fechalesion),
            tipo: normalizeText(item?.tipo) ?? '',
            partecuerpo: normalizeText(item?.partecuerpo),
            severidad: normalizeText(item?.severidad),
            tratamiento: normalizeText(item?.tratamiento),
            recuperado:
              item?.recuperado === null || item?.recuperado === undefined
                ? null
                : Boolean(item?.recuperado),
            notas: normalizeText(item?.notas),
          }))
          .filter((item: LesionRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0)
          .sort(
            (a: LesionRecord, b: LesionRecord) =>
              new Date(b.fechalesion).getTime() - new Date(a.fechalesion).getTime(),
          ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar lesiones');
    } finally {
      setLoadingRecords(false);
      setRefreshing(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    void fetchPatients();
    void fetchRecords();
  }, [fetchPatients, fetchRecords]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(filterPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return records.filter((record) => record.pacienteId === activePatientId);
    }
    return records;
  }, [filterPatientId, records]);

  const selectedPatientName = useMemo(() => {
    const activePatientId = Number(filterPatientId);
    if (!Number.isFinite(activePatientId) || activePatientId <= 0) {
      return 'todos los pacientes';
    }
    return patientNameById[activePatientId] ?? `Paciente #${activePatientId}`;
  }, [filterPatientId, patientNameById]);

  const showDatePicker = () => {
    if (openWebDateTimePicker('date', form.fecha, (value) => handleChange('fecha', value))) {
      return;
    }
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

  const handleToggleRecoveryStatus = async (record: LesionRecord) => {
    const nextRecovered = !Boolean(record.recuperado);
    setUpdatingStatusId(record.lesionId);
    try {
      const result = await submitJsonWithOfflineFallback({
        token,
        path: `/lesion/${record.lesionId}`,
        method: 'PATCH',
        description: nextRecovered
          ? 'marcar lesion como recuperada'
          : 'reabrir seguimiento de lesion',
        body: {
          recuperado: nextRecovered,
          modificadopor: user?.username ?? undefined,
          modificadoen: new Date().toISOString(),
        },
      });

      setRecords((current) =>
        current.map((item) =>
          item.lesionId === record.lesionId
            ? { ...item, recuperado: nextRecovered }
            : item,
        ),
      );

      Alert.alert(
        result.status === 'queued' ? 'Cambio guardado sin conexión' : 'Estado actualizado',
        result.status === 'queued'
          ? 'El nuevo estado se sincronizará cuando vuelva la conexión.'
          : nextRecovered
            ? 'La lesión fue marcada como recuperada.'
            : 'La lesión volvió a estar en seguimiento.',
      );
    } catch (error) {
      Alert.alert(
        'No se pudo cambiar el estado',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.tipo.trim()) {
      Alert.alert('Faltan datos', 'Paciente, fecha y tipo de lesion son obligatorios');
      return;
    }
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/lesion',
        method: 'POST',
        description: 'registrar lesion',
        body: {
          pacienteId: Number(form.pacienteId),
          fechalesion: form.fecha,
          tipo: form.tipo.trim(),
          partecuerpo: form.parteCuerpo.trim() || undefined,
          severidad: form.severidad.trim() || undefined,
          tratamiento: form.tratamiento.trim() || undefined,
          recuperado: form.recuperado,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Lesion en cola',
          'No habia conexion. La lesion quedo guardada localmente y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert('Lesion guardada', 'La lesion fue registrada correctamente');
      }

      resetForm();
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        void fetchRecords();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          !isCreateMode ? (
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              void fetchRecords();
            }} />
          ) : undefined
        }
      >
        <View style={styles.heroCard}>
          <AppText style={styles.eyebrow}>SEGUIMIENTO FISICO</AppText>
          <AppText style={styles.title}>{isCreateMode ? 'Nueva lesion' : 'Lesiones'}</AppText>
          <AppText style={styles.subtitle}>
            {isCreateMode
              ? 'Registra el evento, la severidad y el tratamiento para dejarlo listo en el historial clinico.'
              : 'Revisa el historial de lesiones por persona y filtra rapido los eventos que requieren seguimiento.'}
          </AppText>
        </View>

        {isCreateMode ? (
          <View style={styles.formCard}>
            <AppText style={styles.formTitle}>Registrar lesion</AppText>

            <AppText style={styles.label}>Paciente</AppText>
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.pacienteId}
                onValueChange={(value) => handleChange('pacienteId', String(value))}
                enabled={!loadingPatients}
                dropdownIconColor="#F4F8FF"
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

            <AppText style={styles.label}>Fecha de la lesion</AppText>
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <AppText style={styles.dateButtonText}>{formatDisplayDate(form.fecha)}</AppText>
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
                  <AppText style={styles.secondaryButtonText}>Listo</AppText>
                </TouchableOpacity>
              </View>
            ) : null}

            <AppTextInput
              style={styles.input}
              placeholder="Tipo de lesion"
              placeholderTextColor="#9FB3C8"
              value={form.tipo}
              onChangeText={(value) => handleChange('tipo', value)}
            />
            <AppTextInput
              style={styles.input}
              placeholder="Parte del cuerpo"
              placeholderTextColor="#9FB3C8"
              value={form.parteCuerpo}
              onChangeText={(value) => handleChange('parteCuerpo', value)}
            />
            <AppTextInput
              style={styles.input}
              placeholder="Severidad"
              placeholderTextColor="#9FB3C8"
              value={form.severidad}
              onChangeText={(value) => handleChange('severidad', value)}
            />
            <AppTextInput
              style={styles.input}
              placeholder="Tratamiento"
              placeholderTextColor="#9FB3C8"
              value={form.tratamiento}
              onChangeText={(value) => handleChange('tratamiento', value)}
            />

            <View style={styles.switchRow}>
              <AppText style={styles.switchLabel}>Lesion recuperada</AppText>
              <Switch
                value={form.recuperado}
                onValueChange={(value) => handleChange('recuperado', value)}
              />
            </View>

            <AppTextInput
              style={[styles.input, styles.multiline]}
              placeholder="Notas"
              placeholderTextColor="#9FB3C8"
              value={form.notas}
              multiline
              onChangeText={(value) => handleChange('notas', value)}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  if (navigation.canGoBack()) navigation.goBack();
                }}
              >
                <AppText style={styles.cancelButtonText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                <AppText style={styles.primaryButtonText}>Guardar</AppText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.filterCard}>
              <AppText style={styles.label}>Filtrar por paciente</AppText>
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={filterPatientId}
                  onValueChange={(value) => setFilterPatientId(String(value))}
                  enabled={!loadingPatients}
                  dropdownIconColor="#F4F8FF"
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
              <AppText style={styles.filterHint}>
                {`Mostrando historial de ${selectedPatientName}`}
              </AppText>
            </View>

            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Historial de lesiones</AppText>
              <AppText style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</AppText>
            </View>

            {loadingRecords ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#38E28E" />
                <AppText style={styles.loadingText}>Cargando historial...</AppText>
              </View>
            ) : filteredRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyTitle}>No hay lesiones para este filtro</AppText>
                <AppText style={styles.emptyText}>
                  Cambia el paciente seleccionado o registra una nueva lesion.
                </AppText>
              </View>
            ) : (
              filteredRecords.map((record) => (
                <View key={record.lesionId} style={styles.recordCard}>
                  <View style={styles.recordTopRow}>
                    <View style={styles.datePill}>
                      <AppText style={styles.datePillText}>{formatRecordDate(record.fechalesion)}</AppText>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        record.recuperado ? styles.statusPillSuccess : styles.statusPillPending,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.statusPillText,
                          record.recuperado ? styles.statusTextSuccess : styles.statusTextPending,
                        ]}
                      >
                        {record.recuperado ? 'Recuperada' : 'En seguimiento'}
                      </AppText>
                    </View>
                  </View>

                  <AppText style={styles.recordTitle}>{normalizeText(record.tipo) ?? 'Lesion registrada'}</AppText>
                  <AppText style={styles.recordPatient}>
                    {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                  </AppText>
                  <AppText style={styles.recordText}>
                    Parte del cuerpo: {normalizeText(record.partecuerpo) ?? 'Sin dato'}
                  </AppText>
                  <AppText style={styles.recordText}>
                    Severidad: {normalizeText(record.severidad) ?? 'Sin dato'}
                  </AppText>
                  <AppText style={styles.recordText}>
                    Tratamiento: {normalizeText(record.tratamiento) ?? 'Sin dato'}
                  </AppText>
                  {normalizeText(record.notas) ? (
                    <AppText style={styles.recordText}>Notas: {normalizeText(record.notas)}</AppText>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.statusActionButton,
                      record.recuperado
                        ? styles.statusActionButtonPending
                        : styles.statusActionButtonSuccess,
                      updatingStatusId === record.lesionId && styles.statusActionButtonDisabled,
                    ]}
                    onPress={() => void handleToggleRecoveryStatus(record)}
                    disabled={updatingStatusId === record.lesionId}
                  >
                    {updatingStatusId === record.lesionId ? (
                      <ActivityIndicator
                        size="small"
                        color={record.recuperado ? '#29B6FF' : '#38E28E'}
                      />
                    ) : (
                      <Ionicons
                        name={record.recuperado ? 'refresh-outline' : 'checkmark-circle-outline'}
                        size={19}
                        color={record.recuperado ? '#29B6FF' : '#38E28E'}
                      />
                    )}
                    <AppText
                      style={[
                        styles.statusActionButtonText,
                        record.recuperado
                          ? styles.statusActionButtonTextPending
                          : styles.statusActionButtonTextSuccess,
                      ]}
                    >
                      {record.recuperado ? 'Reabrir seguimiento' : 'Marcar como recuperada'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('LesionCreate')}
        >
          <AppText style={styles.fabText}>+</AppText>
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
    color: '#38E28E',
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
  recordCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
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
    backgroundColor: '#38E28E18',
  },
  datePillText: {
    color: '#38E28E',
    fontWeight: '800',
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  statusPillSuccess: {
    backgroundColor: '#38E28E18',
    borderColor: '#38E28E',
  },
  statusPillPending: {
    backgroundColor: '#071120',
    borderColor: '#29B6FF',
  },
  statusPillText: {
    fontWeight: '800',
    fontSize: 12,
  },
  statusTextSuccess: {
    color: '#38E28E',
  },
  statusTextPending: {
    color: '#29B6FF',
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  recordPatient: {
    color: '#38E28E',
    fontWeight: '700',
    marginBottom: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
  },
  statusActionButton: {
    minHeight: 48,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusActionButtonSuccess: {
    borderColor: '#38E28E55',
    backgroundColor: '#38E28E12',
  },
  statusActionButtonPending: {
    borderColor: '#29B6FF55',
    backgroundColor: '#29B6FF12',
  },
  statusActionButtonDisabled: {
    opacity: 0.65,
  },
  statusActionButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  statusActionButtonTextSuccess: {
    color: '#38E28E',
  },
  statusActionButtonTextPending: {
    color: '#29B6FF',
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
    marginBottom: 12,
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
    color: '#38E28E',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#071120',
  },
  switchLabel: {
    color: '#F4F8FF',
    fontWeight: '700',
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
    backgroundColor: '#38E28E',
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
    backgroundColor: '#38E28E',
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
