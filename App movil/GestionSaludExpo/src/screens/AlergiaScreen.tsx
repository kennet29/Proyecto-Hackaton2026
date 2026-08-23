/**
 * @file App movil/GestionSaludExpo/src/screens/AlergiaScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { getJsonWithOfflineFallback } from '../utils/offlineReadCache';

type AlergiaRecord = {
  alergiaId: number;
  pacienteId: number;
  tipo: string;
  desencadenante?: string | null;
  severidad?: string | null;
  reaccion?: string | null;
  tratamiento?: string | null;
  fechadiagnostico?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  creadoen?: string | null;
};

type PatientAlergiaSummary = {
  pacienteId: number;
  patientName: string;
  total: number;
  activeCount: number;
  latestDate: string | null;
  tipos: string[];
};

type AlergiaScreenProps = {
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

const parseDateForPicker = (value?: string) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
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
  const parsed = parseDateForPicker(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusColors = (status?: string | null) => {
  const normalized = normalizeText(status)?.toLowerCase() ?? '';
  if (normalized.includes('inact')) {
    return { backgroundColor: '#FF4D7318', color: '#FF4D73', borderColor: '#FF4D73' };
  }
  return { backgroundColor: '#38E28E18', color: '#38E28E', borderColor: '#38E28E' };
};

const getSeverityColors = (severity?: string | null) => {
  const normalized = normalizeText(severity)?.toLowerCase() ?? '';
  if (normalized.includes('grave') || normalized.includes('alta') || normalized.includes('severa')) {
    return { backgroundColor: '#FF4D7318', color: '#FF4D73', borderColor: '#FF4D73' };
  }
  if (normalized.includes('moder')) {
    return { backgroundColor: '#FF4D7318', color: '#FF4D73', borderColor: '#FF4D73' };
  }
  return { backgroundColor: '#071120', color: '#29B6FF', borderColor: '#29B6FF' };
};

export function AlergiaScreen({ mode = 'list' }: AlergiaScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const { token, user } = useAuth();
  const defaultPacienteId = useMemo(
    () => (user?.pacienteId ? String(user.pacienteId) : ''),
    [user?.pacienteId],
  );
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<AlergiaRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    pacienteId: defaultPacienteId,
    tipo: '',
    desencadenante: '',
    severidad: '',
    reaccion: '',
    tratamiento: '',
    fechadiagnostico: '',
    estado: 'Activa',
    observaciones: '',
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
    setForm({
      pacienteId: defaultPacienteId,
      tipo: '',
      desencadenante: '',
      severidad: '',
      reaccion: '',
      tratamiento: '',
      fechadiagnostico: '',
      estado: 'Activa',
      observaciones: '',
    });
  }, [defaultPacienteId]);

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
      setForm((prev) => {
        if (prev.pacienteId || normalized.length === 0) return prev;
        return { ...prev, pacienteId: String(normalized[0].pacienteId) };
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const { data: body } = await getJsonWithOfflineFallback<unknown>(
        '/alergia',
        authHeaders,
      );
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any, index: number) => ({
            alergiaId: Number(item?.alergiaId ?? item?.alergiaid ?? item?.id ?? index + 1),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            tipo: normalizeText(item?.tipo) ?? '',
            desencadenante: normalizeText(item?.desencadenante),
            severidad: normalizeText(item?.severidad),
            reaccion: normalizeText(item?.reaccion),
            tratamiento: normalizeText(item?.tratamiento),
            fechadiagnostico: toDateOnlyString(item?.fechadiagnostico) || null,
            estado: normalizeText(item?.estado),
            observaciones: normalizeText(item?.observaciones),
            creadoen: normalizeText(item?.creadoen),
          }))
          .filter((item: AlergiaRecord) => Number.isFinite(item.pacienteId) && item.pacienteId > 0)
          .sort((a: AlergiaRecord, b: AlergiaRecord) => {
            const aDate = new Date(a.fechadiagnostico ?? a.creadoen ?? 0).getTime();
            const bDate = new Date(b.fechadiagnostico ?? b.creadoen ?? 0).getTime();
            return bDate - aDate;
          }),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar alergias');
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
      fetchRecords();
    }, [fetchPatients, fetchRecords]),
  );

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

  const patientSummaries = useMemo<PatientAlergiaSummary[]>(() => {
    const grouped = new Map<number, AlergiaRecord[]>();
    records.forEach((record) => {
      const list = grouped.get(record.pacienteId) ?? [];
      list.push(record);
      grouped.set(record.pacienteId, list);
    });

    return Array.from(grouped.entries())
      .map(([pacienteId, items]) => ({
        pacienteId,
        patientName: patientNameById[pacienteId] ?? `Paciente #${pacienteId}`,
        total: items.length,
        activeCount: items.filter((item) => (normalizeText(item.estado) ?? 'activa').toLowerCase() !== 'inactiva').length,
        latestDate: items[0]?.fechadiagnostico ?? items[0]?.creadoen ?? null,
        tipos: Array.from(
          new Set(items.map((item) => normalizeText(item.tipo)).filter((value): value is string => Boolean(value))),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.latestDate ?? 0).getTime() - new Date(a.latestDate ?? 0).getTime(),
      );
  }, [patientNameById, records]);

  const visibleSummaries = useMemo(() => {
    const activePatientId = Number(selectedPatientId);
    if (Number.isFinite(activePatientId) && activePatientId > 0) {
      return patientSummaries.filter((summary) => summary.pacienteId === activePatientId);
    }
    return patientSummaries;
  }, [patientSummaries, selectedPatientId]);

  const openDatePicker = () => {
    if (openWebDateTimePicker('date', form.fechadiagnostico, (value) => handleChange('fechadiagnostico', value))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form.fechadiagnostico),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            handleChange('fechadiagnostico', toDateOnlyString(selected));
          }
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.tipo.trim()) {
      Alert.alert('Faltan datos', 'Paciente y tipo de alergia son obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/alergia',
        method: 'POST',
        description: 'registrar alergia',
        body: {
          pacienteId: Number(form.pacienteId),
          tipo: form.tipo.trim(),
          desencadenante: form.desencadenante.trim() || undefined,
          severidad: form.severidad.trim() || undefined,
          reaccion: form.reaccion.trim() || undefined,
          tratamiento: form.tratamiento.trim() || undefined,
          fechadiagnostico: form.fechadiagnostico || undefined,
          estado: form.estado.trim() || 'Activa',
          observaciones: form.observaciones.trim() || undefined,
          creadopor: user?.username ?? undefined,
        },
      });

      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Alergia en cola',
          'No habia conexion. La alergia quedo guardada localmente y se sincronizara al volver la red.',
        );
      } else {
        Alert.alert('Alergia guardada', 'La alergia fue registrada correctamente');
      }

      resetForm();
      if (isCreateMode) {
        navigation.goBack();
      } else {
        fetchRecords();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <AppText style={styles.formTitle}>Nueva alergia</AppText>
      <AppText style={styles.formSubtitle}>
        Registra el tipo, la reaccion y el manejo recomendado para que quede visible en el historial.
      </AppText>

      <AppText style={styles.label}>Paciente</AppText>
      {loadingPatients ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#29B6FF" />
          <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
        </View>
      ) : patientOptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppText style={styles.emptyTitle}>No hay pacientes vinculados</AppText>
          <AppText style={styles.emptyText}>
            Primero agrega una persona desde Gestionar Expediente.
          </AppText>
        </View>
      ) : (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.pacienteId}
            onValueChange={(value) => handleChange('pacienteId', String(value))}
            dropdownIconColor="#F4F8FF"
            style={styles.picker}
          >
            <Picker.Item label="Selecciona un paciente" value="" color={pickerItemColor} />
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
      )}

      <AppTextInput
        style={styles.input}
        placeholder="Tipo de alergia"
        placeholderTextColor="#9FB3C8"
        value={form.tipo}
        onChangeText={(value) => handleChange('tipo', value)}
      />
      <AppTextInput
        style={styles.input}
        placeholder="Desencadenante"
        placeholderTextColor="#9FB3C8"
        value={form.desencadenante}
        onChangeText={(value) => handleChange('desencadenante', value)}
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
        placeholder="Reaccion tipica"
        placeholderTextColor="#9FB3C8"
        value={form.reaccion}
        onChangeText={(value) => handleChange('reaccion', value)}
      />
      <AppTextInput
        style={styles.input}
        placeholder="Tratamiento recomendado"
        placeholderTextColor="#9FB3C8"
        value={form.tratamiento}
        onChangeText={(value) => handleChange('tratamiento', value)}
      />

      <AppText style={styles.label}>Fecha diagnostico</AppText>
      <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
        <AppText style={styles.dateButtonText}>{formatDisplayDate(form.fechadiagnostico)}</AppText>
      </TouchableOpacity>

      {Platform.OS === 'ios' && showIOSDatePicker ? (
        <View style={styles.iosPickerCard}>
          <DateTimePicker
            mode="date"
            display="spinner"
            value={parseDateForPicker(form.fechadiagnostico)}
            onChange={(_, selected) => {
              if (selected) handleChange('fechadiagnostico', toDateOnlyString(selected));
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
        placeholder="Estado"
        placeholderTextColor="#9FB3C8"
        value={form.estado}
        onChangeText={(value) => handleChange('estado', value)}
      />
      <AppTextInput
        style={[styles.input, styles.multiline]}
        placeholder="Observaciones"
        placeholderTextColor="#9FB3C8"
        value={form.observaciones}
        multiline
        onChangeText={(value) => handleChange('observaciones', value)}
      />

      <View style={styles.formActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            resetForm();
            if (isCreateMode) {
              navigation.goBack();
            }
          }}
        >
          <AppText style={styles.cancelButtonText}>Cancelar</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting ? styles.primaryButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <AppText style={styles.primaryButtonText}>Guardar</AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isCreateMode) {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        <View style={styles.heroCard}>
          <AppText style={styles.eyebrow}>Riesgos y reacciones</AppText>
          <AppText style={styles.title}>Nueva alergia</AppText>
          <AppText style={styles.subtitle}>
            Registra el tipo, la reaccion y el manejo recomendado para que quede visible en el historial clinico.
          </AppText>
        </View>
        {renderForm()}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <AppText style={styles.eyebrow}>Riesgos y reacciones</AppText>
          <AppText style={styles.title}>Alergias</AppText>
          <AppText style={styles.subtitle}>
            Consulta el resumen por persona, detecta alergias activas y filtra el historial cuando lo necesites.
          </AppText>
        </View>

        <View style={styles.filterCard}>
          <AppText style={styles.label}>Filtrar por paciente</AppText>
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
          <AppText style={styles.filterHint}>
            {selectedPatientId
              ? `Mostrando alergias de ${patientNameById[Number(selectedPatientId)] ?? 'paciente'}`
              : 'Mostrando el historial alergico completo'}
          </AppText>
        </View>

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Personas y alergias</AppText>
          <AppText style={styles.sectionSubtitle}>{`${visibleSummaries.length} perfiles`}</AppText>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.loadingText}>Cargando resumen...</AppText>
          </View>
        ) : visibleSummaries.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Todavia no hay alergias registradas</AppText>
            <AppText style={styles.emptyText}>
              Usa el boton flotante para registrar la primera alergia de un paciente.
            </AppText>
          </View>
        ) : (
          visibleSummaries.map((summary) => (
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
                  <AppText style={styles.summaryName}>{summary.patientName}</AppText>
                  <AppText style={styles.summaryMeta}>
                    {summary.latestDate ? `Ultima: ${formatRecordDate(summary.latestDate)}` : 'Sin fecha reciente'}
                  </AppText>
                </View>
                <View style={styles.summaryCountBadge}>
                  <AppText style={styles.summaryCountValue}>{summary.total}</AppText>
                  <AppText style={styles.summaryCountLabel}>alergias</AppText>
                </View>
              </View>
              <AppText style={styles.summaryPrimary}>{`${summary.activeCount} activas`}</AppText>
              <AppText style={styles.summarySecondary}>
                {summary.tipos.length > 0
                  ? summary.tipos.slice(0, 3).join(' • ')
                  : 'Sin tipos registrados'}
              </AppText>
              {summary.tipos.length > 0 ? (
                <View style={styles.chipRow}>
                  {summary.tipos.slice(0, 4).map((tipo) => (
                    <View key={`${summary.pacienteId}-${tipo}`} style={styles.chip}>
                      <AppText style={styles.chipText}>{tipo}</AppText>
                    </View>
                  ))}
                </View>
              ) : null}
              <AppText style={styles.summaryAction}>
                {Number(selectedPatientId) === summary.pacienteId
                  ? 'Toca para volver a ver todos'
                  : 'Toca para filtrar este historial'}
              </AppText>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Historial de alergias</AppText>
          <AppText style={styles.sectionSubtitle}>{`${filteredRecords.length} registros`}</AppText>
        </View>

        {loadingRecords ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.loadingText}>Cargando historial...</AppText>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>No hay alergias para este filtro</AppText>
            <AppText style={styles.emptyText}>
              Cambia el paciente seleccionado o registra una nueva alergia.
            </AppText>
          </View>
        ) : (
          filteredRecords.map((record) => {
            const statusColors = getStatusColors(record.estado);
            const severityColors = getSeverityColors(record.severidad);
            return (
              <View key={record.alergiaId} style={styles.recordCard}>
                <View style={styles.recordTopRow}>
                  <View style={styles.datePill}>
                    <AppText style={styles.datePillText}>{formatRecordDate(record.fechadiagnostico)}</AppText>
                  </View>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: severityColors.backgroundColor,
                          borderColor: severityColors.borderColor,
                        },
                      ]}
                    >
                      <AppText style={[styles.statusPillText, { color: severityColors.color }]}>
                        {normalizeText(record.severidad) ?? 'Sin severidad'}
                      </AppText>
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
                      <AppText style={[styles.statusPillText, { color: statusColors.color }]}>
                        {normalizeText(record.estado) ?? 'Activa'}
                      </AppText>
                    </View>
                  </View>
                </View>

                <AppText style={styles.recordTitle}>{normalizeText(record.tipo) ?? 'Alergia'}</AppText>
                {!selectedPatientId ? (
                  <AppText style={styles.recordPatient}>
                    {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}
                  </AppText>
                ) : null}
                <AppText style={styles.recordText}>
                  Desencadenante: {normalizeText(record.desencadenante) ?? 'Sin dato'}
                </AppText>
                <AppText style={styles.recordText}>
                  Reaccion: {normalizeText(record.reaccion) ?? 'Sin dato'}
                </AppText>
                <AppText style={styles.recordText}>
                  Tratamiento: {normalizeText(record.tratamiento) ?? 'Sin dato'}
                </AppText>
                {normalizeText(record.observaciones) ? (
                  <AppText style={styles.recordText}>Notas: {normalizeText(record.observaciones)}</AppText>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AlergiaCreate')}>
        <AppText style={styles.fabText}>+</AppText>
      </TouchableOpacity>
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
    minWidth: 74,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#29B6FF',
    alignItems: 'center',
  },
  summaryCountValue: {
    color: '#29B6FF',
    fontSize: 20,
    fontWeight: '900',
  },
  summaryCountLabel: {
    color: '#C9D7E8',
    fontSize: 10,
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
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  statusRow: {
    alignItems: 'flex-end',
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
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
  primaryButtonDisabled: {
    opacity: 0.7,
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
