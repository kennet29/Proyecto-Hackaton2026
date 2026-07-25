import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { appColors, colorAlpha } from '../theme/colors';

type FeedbackState = { type: 'success' | 'error'; message: string } | null;
type DateField = 'fechainicio' | 'fechaprobableparto' | 'fechaPrimerUltrasonido';

type EmbarazoRecord = {
  embarazoId: number;
  pacienteId: number;
  fechainicio: string | null;
  fechaprobableparto: string | null;
  metodoCalculoFpp: string | null;
  fechaPrimerUltrasonido: string | null;
  edadGestacionalPrimerUsSemanas: number | null;
  edadGestacionalPrimerUsDias: number | null;
  numeroFetos: number | null;
  embarazoPlanificado: boolean | null;
  embarazosAnteriores: number | null;
  partosAnteriores: number | null;
  abortosAnteriores: number | null;
  cesareasAnteriores: number | null;
  grupoSanguineo: string | null;
  factorRh: string | null;
  antecedentesRelevantes: string | null;
  medicoResponsable: string | null;
  centroMedico: string | null;
  estado: string | null;
};

type FormState = {
  pacienteId: string;
  fechainicio: string;
  fechaprobableparto: string;
  metodoCalculoFpp: string;
  fechaPrimerUltrasonido: string;
  edadGestacionalPrimerUsSemanas: string;
  edadGestacionalPrimerUsDias: string;
  numeroFetos: string;
  embarazoPlanificado: 'si' | 'no';
  embarazosAnteriores: string;
  partosAnteriores: string;
  abortosAnteriores: string;
  cesareasAnteriores: string;
  grupoSanguineo: string;
  factorRh: string;
  antecedentesRelevantes: string;
  medicoResponsable: string;
  centroMedico: string;
  estado: 'activo' | 'finalizado' | 'perdida gestacional' | 'traslado';
};

const FPP_METHODS = [
  'Regla de Naegele (FUM)',
  'Ultrasonido',
  'Reproducción asistida',
  'Otro',
];

const buildHeaders = (token?: string | null, withJson = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (withJson) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const toDateOnlyString = (value?: Date | string | null): string => {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string | null) => {
  const parts = toDateOnlyString(value).split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  }
  return new Date();
};

const formatDate = (value?: string | null, empty = 'Sin fecha') => {
  if (!value) return empty;
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateFpp = (fum: string) => {
  const date = parseDateForPicker(fum);
  date.setDate(date.getDate() + 280);
  return toDateOnlyString(date);
};

const optionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const normalizeRecord = (item: Record<string, unknown>): EmbarazoRecord | null => {
  const embarazoId = Number(item.embarazoId ?? item.embarazoid ?? item.id ?? 0);
  const pacienteId = Number(item.pacienteId ?? item.pacienteid ?? 0);
  if (embarazoId <= 0 || pacienteId <= 0) return null;

  const plannedValue = item.embarazoPlanificado ?? item.embarazoplanificado;
  return {
    embarazoId,
    pacienteId,
    fechainicio: toDateOnlyString(item.fechainicio as string | null) || null,
    fechaprobableparto: toDateOnlyString(item.fechaprobableparto as string | null) || null,
    metodoCalculoFpp: optionalString(item.metodoCalculoFpp ?? item.metodocalculofpp),
    fechaPrimerUltrasonido:
      toDateOnlyString(item.fechaPrimerUltrasonido as string | null) ||
      toDateOnlyString(item.fechaprimerultrasonido as string | null) ||
      null,
    edadGestacionalPrimerUsSemanas: optionalNumber(
      item.edadGestacionalPrimerUsSemanas ?? item.edadgestacionalprimerussemanas,
    ),
    edadGestacionalPrimerUsDias: optionalNumber(
      item.edadGestacionalPrimerUsDias ?? item.edadgestacionalprimerusdias,
    ),
    numeroFetos: optionalNumber(item.numeroFetos ?? item.numerofetos),
    embarazoPlanificado:
      plannedValue === null || plannedValue === undefined
        ? null
        : plannedValue === true || plannedValue === 1 || plannedValue === '1',
    embarazosAnteriores: optionalNumber(item.embarazosAnteriores ?? item.embarazosanteriores),
    partosAnteriores: optionalNumber(item.partosAnteriores ?? item.partosanteriores),
    abortosAnteriores: optionalNumber(item.abortosAnteriores ?? item.abortosanteriores),
    cesareasAnteriores: optionalNumber(item.cesareasAnteriores ?? item.cesareasanteriores),
    grupoSanguineo: optionalString(item.grupoSanguineo ?? item.gruposanguineo),
    factorRh: optionalString(item.factorRh ?? item.factorrh),
    antecedentesRelevantes: optionalString(
      item.antecedentesRelevantes ?? item.antecedentesrelevantes ?? item.notas,
    ),
    medicoResponsable: optionalString(item.medicoResponsable ?? item.medicoresponsable),
    centroMedico: optionalString(item.centroMedico ?? item.centromedico),
    estado: optionalString(item.estado),
  };
};

const formatError = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo completar la acción.';

function numericValue(value: string, fieldName: string, required?: true): number;
function numericValue(value: string, fieldName: string, required: false): number | null;
function numericValue(value: string, fieldName: string, required = true): number | null {
  if (!value.trim() && !required) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} debe ser un número entero igual o mayor que cero.`);
  }
  return parsed;
}

export function EmbarazoScreen() {
  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? appColors.background : appColors.text;
  const patientHeaders = useMemo(() => buildHeaders(token), [token]);
  const jsonHeaders = useMemo(() => buildHeaders(token, true), [token]);
  const defaultPacienteId = user?.pacienteId ? String(user.pacienteId) : '';

  const buildInitialForm = useCallback(
    (): FormState => ({
      pacienteId: defaultPacienteId,
      fechainicio: '',
      fechaprobableparto: '',
      metodoCalculoFpp: FPP_METHODS[0]!,
      fechaPrimerUltrasonido: '',
      edadGestacionalPrimerUsSemanas: '',
      edadGestacionalPrimerUsDias: '',
      numeroFetos: '1',
      embarazoPlanificado: 'si',
      embarazosAnteriores: '0',
      partosAnteriores: '0',
      abortosAnteriores: '0',
      cesareasAnteriores: '0',
      grupoSanguineo: '',
      factorRh: '',
      antecedentesRelevantes: '',
      medicoResponsable: '',
      centroMedico: '',
      estado: 'activo',
    }),
    [defaultPacienteId],
  );

  const [form, setForm] = useState<FormState>(buildInitialForm);
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [records, setRecords] = useState<EmbarazoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [iosDateField, setIosDateField] = useState<DateField | null>(null);

  const change = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const fetchPatients = useCallback(async () => {
    if (!token) return;
    setLoadingPatients(true);
    try {
      const linked = await fetchLinkedPatients(patientHeaders);
      setPatients(linked);
      setForm((previous) => ({
        ...previous,
        pacienteId: previous.pacienteId || String(linked[0]?.pacienteId ?? ''),
      }));
    } catch (error) {
      setFeedback({ type: 'error', message: formatError(error) });
    } finally {
      setLoadingPatients(false);
    }
  }, [patientHeaders, token]);

  const fetchRecords = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/embarazo`, { headers: patientHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo cargar el historial.');
      }
      setRecords(
        Array.isArray(body)
          ? body
              .map((item) => normalizeRecord((item ?? {}) as Record<string, unknown>))
              .filter((item): item is EmbarazoRecord => Boolean(item))
          : [],
      );
    } catch (error) {
      setFeedback({ type: 'error', message: formatError(error) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientHeaders]);

  useEffect(() => {
    void fetchPatients();
    void fetchRecords();
  }, [fetchPatients, fetchRecords]);

  const filteredRecords = useMemo(() => {
    const patientId = Number(form.pacienteId);
    return patientId > 0 ? records.filter((record) => record.pacienteId === patientId) : records;
  }, [form.pacienteId, records]);

  const setDate = (key: DateField, date: Date) => {
    const value = toDateOnlyString(date);
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'fechainicio' &&
      previous.metodoCalculoFpp === FPP_METHODS[0] &&
      !previous.fechaprobableparto
        ? { fechaprobableparto: calculateFpp(value) }
        : {}),
    }));
    setIosDateField(null);
  };

  const openDatePicker = (key: DateField) => {
    if (openWebDateTimePicker('date', form[key], (value) => setDate(key, parseDateForPicker(value)))) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[key]),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'set' && date) setDate(key, date);
        },
      });
      return;
    }
    setIosDateField(key);
  };

  const submit = async () => {
    setFeedback(null);
    try {
      const pacienteId = Number(form.pacienteId);
      if (pacienteId <= 0 || !form.fechainicio || !form.fechaprobableparto) {
        throw new Error('Paciente, FUM y FPP son obligatorios.');
      }
      if (form.fechaprobableparto <= form.fechainicio) {
        throw new Error('La FPP debe ser posterior a la FUM.');
      }
      if (form.fechaPrimerUltrasonido && !form.edadGestacionalPrimerUsSemanas.trim()) {
        throw new Error('Indica las semanas de gestación del primer ultrasonido.');
      }

      const numeroFetos = numericValue(form.numeroFetos, 'El número de fetos');
      if (numeroFetos < 1) throw new Error('El número de fetos debe ser al menos uno.');

      const payload = {
        pacienteId,
        fechainicio: form.fechainicio,
        fechaprobableparto: form.fechaprobableparto,
        metodoCalculoFpp: form.metodoCalculoFpp,
        fechaPrimerUltrasonido: form.fechaPrimerUltrasonido || null,
        edadGestacionalPrimerUsSemanas: numericValue(
          form.edadGestacionalPrimerUsSemanas,
          'Las semanas del primer ultrasonido',
          false,
        ),
        edadGestacionalPrimerUsDias: numericValue(
          form.edadGestacionalPrimerUsDias,
          'Los días del primer ultrasonido',
          false,
        ),
        numeroFetos,
        embarazoPlanificado: form.embarazoPlanificado === 'si',
        embarazosAnteriores: numericValue(form.embarazosAnteriores, 'Embarazos anteriores'),
        partosAnteriores: numericValue(form.partosAnteriores, 'Partos anteriores'),
        abortosAnteriores: numericValue(form.abortosAnteriores, 'Abortos anteriores'),
        cesareasAnteriores: numericValue(form.cesareasAnteriores, 'Cesáreas anteriores'),
        grupoSanguineo: form.grupoSanguineo || null,
        factorRh: form.factorRh || null,
        antecedentesRelevantes: form.antecedentesRelevantes.trim() || null,
        medicoResponsable: form.medicoResponsable.trim() || null,
        centroMedico: form.centroMedico.trim() || null,
        estado: form.estado,
        creadopor: user?.username ?? null,
      };

      setSubmitting(true);
      const response = await fetch(`${API_URL}/embarazo`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo registrar el embarazo.');
      }
      setFeedback({ type: 'success', message: 'Registro obstétrico guardado correctamente.' });
      setForm(buildInitialForm());
      setShowForm(false);
      await fetchRecords();
    } catch (error) {
      setFeedback({ type: 'error', message: formatError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchRecords()} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="heart-circle-outline" size={27} color="#FB7185" />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>Embarazo</AppText>
          <AppText style={styles.subtitle}>Ficha obstétrica, antecedentes y seguimiento del embarazo.</AppText>
        </View>
      </View>

      {feedback ? (
        <View style={[styles.feedback, feedback.type === 'success' ? styles.success : styles.error]}>
          <Ionicons
            name={feedback.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={18}
            color={feedback.type === 'success' ? appColors.success : appColors.accent}
          />
          <AppText style={styles.feedbackText}>{feedback.message}</AppText>
        </View>
      ) : null}

      <View style={styles.patientCard}>
        <AppText style={styles.label}>Paciente</AppText>
        {loadingPatients ? (
          <ActivityIndicator color={appColors.info} />
        ) : (
          <View style={styles.darkPicker}>
            <Picker
              selectedValue={form.pacienteId}
              onValueChange={(value) => change('pacienteId', String(value))}
            >
              {patients.map((patient) => (
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
      </View>

      {loading ? (
        <View style={styles.emptyCard}><ActivityIndicator color={appColors.info} /></View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={29} color={appColors.info} />
          <AppText style={styles.emptyTitle}>Sin registros de embarazo</AppText>
          <AppText style={styles.emptyText}>Agrega la primera ficha obstétrica para este paciente.</AppText>
        </View>
      ) : (
        filteredRecords.map((record) => (
          <View key={record.embarazoId} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View>
                <AppText style={styles.recordEyebrow}>FICHA OBSTÉTRICA</AppText>
                <AppText style={styles.recordTitle}>FPP: {formatDate(record.fechaprobableparto)}</AppText>
              </View>
              <View style={styles.statusChip}>
                <AppText style={styles.statusText}>{record.estado || 'Sin estado'}</AppText>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <RecordItem label="FUM" value={formatDate(record.fechainicio)} />
              <RecordItem label="Método FPP" value={record.metodoCalculoFpp || 'Sin dato'} />
              <RecordItem
                label="Primer ultrasonido"
                value={
                  record.fechaPrimerUltrasonido
                    ? `${formatDate(record.fechaPrimerUltrasonido)} · ${
                        record.edadGestacionalPrimerUsSemanas ?? 0
                      } sem ${record.edadGestacionalPrimerUsDias ?? 0} días`
                    : 'Sin registro'
                }
              />
              <RecordItem
                label="Gestación"
                value={`${record.numeroFetos ?? '—'} feto(s) · ${
                  record.embarazoPlanificado === null
                    ? 'Planificación sin dato'
                    : record.embarazoPlanificado
                      ? 'Planificado'
                      : 'No planificado'
                }`}
              />
              <RecordItem
                label="Antecedentes obstétricos"
                value={`G${record.embarazosAnteriores ?? 0} · P${record.partosAnteriores ?? 0} · A${
                  record.abortosAnteriores ?? 0
                } · C${record.cesareasAnteriores ?? 0}`}
              />
              <RecordItem
                label="Grupo y Rh"
                value={
                  record.grupoSanguineo
                    ? `${record.grupoSanguineo} ${record.factorRh === 'positivo' ? '+' : record.factorRh === 'negativo' ? '−' : ''}`
                    : 'Sin dato'
                }
              />
              <RecordItem label="Médico responsable" value={record.medicoResponsable || 'Sin dato'} />
              <RecordItem label="Centro médico" value={record.centroMedico || 'Sin dato'} />
            </View>
            {record.antecedentesRelevantes ? (
              <View style={styles.notes}>
                <AppText style={styles.notesLabel}>ANTECEDENTES RELEVANTES</AppText>
                <AppText style={styles.notesText}>{record.antecedentesRelevantes}</AppText>
              </View>
            ) : null}
          </View>
        ))
      )}

      {showForm ? (
        <View style={styles.formCard}>
          <AppText style={styles.formTitle}>Nueva ficha obstétrica</AppText>
          <AppText style={styles.formHint}>Los campos marcados con * son obligatorios.</AppText>

          <FormSection title="Datación del embarazo">
            <DateInput label="Fecha de última menstruación (FUM) *" value={form.fechainicio} onPress={() => openDatePicker('fechainicio')} />
            <DateInput label="Fecha probable de parto (FPP) *" value={form.fechaprobableparto} onPress={() => openDatePicker('fechaprobableparto')} />
            <PickerInput
              label="Método utilizado para calcular la FPP *"
              value={form.metodoCalculoFpp}
              options={FPP_METHODS.map((value) => ({ label: value, value }))}
              onChange={(value) => change('metodoCalculoFpp', value)}
            />
          </FormSection>

          <FormSection title="Primer ultrasonido">
            <DateInput label="Fecha del primer ultrasonido" value={form.fechaPrimerUltrasonido} onPress={() => openDatePicker('fechaPrimerUltrasonido')} />
            <View style={styles.row}>
              <NumberInput label="Semanas" value={form.edadGestacionalPrimerUsSemanas} onChange={(value) => change('edadGestacionalPrimerUsSemanas', value)} />
              <NumberInput label="Días (0–6)" value={form.edadGestacionalPrimerUsDias} onChange={(value) => change('edadGestacionalPrimerUsDias', value)} />
            </View>
          </FormSection>

          <FormSection title="Datos del embarazo">
            <NumberInput label="Número de fetos *" value={form.numeroFetos} onChange={(value) => change('numeroFetos', value)} full />
            <PickerInput
              label="Planificación *"
              value={form.embarazoPlanificado}
              options={[
                { label: 'Embarazo planificado', value: 'si' },
                { label: 'Embarazo no planificado', value: 'no' },
              ]}
              onChange={(value) => change('embarazoPlanificado', value as 'si' | 'no')}
            />
          </FormSection>

          <FormSection title="Antecedentes obstétricos">
            <View style={styles.row}>
              <NumberInput label="Embarazos" value={form.embarazosAnteriores} onChange={(value) => change('embarazosAnteriores', value)} />
              <NumberInput label="Partos" value={form.partosAnteriores} onChange={(value) => change('partosAnteriores', value)} />
            </View>
            <View style={styles.row}>
              <NumberInput label="Abortos" value={form.abortosAnteriores} onChange={(value) => change('abortosAnteriores', value)} />
              <NumberInput label="Cesáreas" value={form.cesareasAnteriores} onChange={(value) => change('cesareasAnteriores', value)} />
            </View>
            <TextField
              label="Antecedentes relevantes"
              value={form.antecedentesRelevantes}
              onChange={(value) => change('antecedentesRelevantes', value)}
              multiline
              placeholder="Enfermedades, complicaciones o antecedentes familiares"
            />
          </FormSection>

          <FormSection title="Datos clínicos y responsables">
            <View style={styles.row}>
              <PickerInput
                label="Grupo sanguíneo"
                value={form.grupoSanguineo}
                options={[
                  { label: 'Sin dato', value: '' },
                  ...['A', 'B', 'AB', 'O'].map((value) => ({ label: value, value })),
                ]}
                onChange={(value) => change('grupoSanguineo', value)}
                compact
              />
              <PickerInput
                label="Factor Rh"
                value={form.factorRh}
                options={[
                  { label: 'Sin dato', value: '' },
                  { label: 'Positivo (+)', value: 'positivo' },
                  { label: 'Negativo (−)', value: 'negativo' },
                ]}
                onChange={(value) => change('factorRh', value)}
                compact
              />
            </View>
            <TextField label="Médico responsable" value={form.medicoResponsable} onChange={(value) => change('medicoResponsable', value)} placeholder="Nombre completo" />
            <TextField label="Centro médico" value={form.centroMedico} onChange={(value) => change('centroMedico', value)} placeholder="Hospital, clínica o centro de salud" />
            <PickerInput
              label="Estado *"
              value={form.estado}
              options={[
                { label: 'Activo', value: 'activo' },
                { label: 'Finalizado', value: 'finalizado' },
                { label: 'Pérdida gestacional', value: 'perdida gestacional' },
                { label: 'Traslado', value: 'traslado' },
              ]}
              onChange={(value) => change('estado', value as FormState['estado'])}
            />
          </FormSection>

          {Platform.OS === 'ios' && iosDateField ? (
            <View style={styles.iosPicker}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateForPicker(form[iosDateField])}
                onChange={(_, date) => {
                  if (date) setDate(iosDateField, date);
                }}
              />
              <TouchableOpacity onPress={() => setIosDateField(null)} style={styles.iosDone}>
                <AppText style={styles.iosDoneText}>Listo</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={() => void submit()}
          >
            {submitting ? (
              <ActivityIndicator color={appColors.text} />
            ) : (
              <AppText style={styles.saveButtonText}>Guardar ficha obstétrica</AppText>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => {
          setShowForm((previous) => !previous);
          setFeedback(null);
        }}
      >
        <Ionicons name={showForm ? 'close' : 'add'} size={22} color={appColors.text} />
        <AppText style={styles.toggleText}>{showForm ? 'Cerrar formulario' : 'Nueva ficha de embarazo'}</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

function RecordItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recordItem}>
      <AppText style={styles.recordLabel}>{label}</AppText>
      <AppText style={styles.recordValue}>{value}</AppText>
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <AppText style={styles.formSectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

function DateInput({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.field}>
      <AppText style={styles.formLabel}>{label}</AppText>
      <TouchableOpacity style={styles.inputShell} onPress={onPress}>
        <Ionicons name="calendar-outline" size={18} color={appColors.info} />
        <AppText style={value ? styles.dateValue : styles.placeholder}>
          {value ? formatDate(value) : 'Selecciona una fecha'}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}) {
  return (
    <View style={[styles.field, !full && styles.halfField]}>
      <AppText style={styles.formLabel}>{label}</AppText>
      <AppTextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={appColors.textMuted}
      />
    </View>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText style={styles.formLabel}>{label}</AppText>
      <AppTextInput
        style={[styles.textInput, multiline && styles.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={appColors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

function PickerInput({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.field, compact && styles.halfField]}>
      <AppText style={styles.formLabel}>{label}</AppText>
      <View style={styles.formPicker}>
        <Picker selectedValue={value} onValueChange={(nextValue) => onChange(String(nextValue))}>
          {options.map((option) => (
            <Picker.Item
              key={option.value || 'empty'}
              label={option.label}
              value={option.value}
              color={Platform.OS === 'android' ? appColors.background : appColors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  content: { padding: 16, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colorAlpha('#FB7185', '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCopy: { flex: 1 },
  title: { color: appColors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  success: { backgroundColor: colorAlpha(appColors.success, '12'), borderColor: colorAlpha(appColors.success, '55') },
  error: { backgroundColor: colorAlpha(appColors.accent, '12'), borderColor: colorAlpha(appColors.accent, '55') },
  feedbackText: { color: appColors.textSoft, fontSize: 12, lineHeight: 17, marginLeft: 8, flex: 1 },
  patientCard: {
    backgroundColor: appColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 16,
  },
  label: { color: appColors.textSoft, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  darkPicker: {
    backgroundColor: appColors.backgroundMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: appColors.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: appColors.text, fontSize: 16, fontWeight: '800', marginTop: 9 },
  emptyText: { color: appColors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  recordCard: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: 14,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  recordEyebrow: { color: '#FB7185', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  recordTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  statusChip: { backgroundColor: colorAlpha('#FB7185', '18'), borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#FB7185', fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 15 },
  recordItem: { width: '50%', paddingHorizontal: 5, marginBottom: 13 },
  recordLabel: { color: appColors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  recordValue: { color: appColors.textSoft, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  notes: { borderTopWidth: 1, borderTopColor: appColors.borderStrong, paddingTop: 12 },
  notesLabel: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  notesText: { color: appColors.textSoft, fontSize: 12, lineHeight: 18, marginTop: 4 },
  formCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    marginTop: 2,
    marginBottom: 14,
  },
  formTitle: { color: appColors.text, fontSize: 19, fontWeight: '900' },
  formHint: { color: appColors.textMuted, fontSize: 11, marginTop: 4, marginBottom: 6 },
  formSection: {
    borderTopWidth: 1,
    borderTopColor: appColors.borderStrong,
    paddingTop: 15,
    marginTop: 15,
  },
  formSectionTitle: { color: '#FB7185', fontSize: 12, fontWeight: '900', marginBottom: 12 },
  field: { flex: 1, marginBottom: 12 },
  halfField: { width: '48%' },
  row: { flexDirection: 'row', gap: 10 },
  formLabel: { color: appColors.textSoft, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  inputShell: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  dateValue: { color: appColors.text, fontSize: 14, marginLeft: 8 },
  placeholder: { color: appColors.textMuted, fontSize: 14, marginLeft: 8 },
  textInput: {
    minHeight: 48,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: appColors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  formPicker: {
    minHeight: 48,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  iosPicker: { backgroundColor: appColors.text, borderRadius: 15, overflow: 'hidden', marginBottom: 14 },
  iosDone: { alignItems: 'center', padding: 11, borderTopWidth: 1, borderTopColor: appColors.textMuted },
  iosDoneText: { color: appColors.background, fontWeight: '800' },
  saveButton: { backgroundColor: '#FB7185', borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: appColors.text, fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.65 },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.info,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 7,
  },
  toggleText: { color: appColors.text, fontSize: 14, fontWeight: '900' },
});
