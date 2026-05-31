import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { submitJsonWithOfflineFallback } from '../utils/offlineWriteQueue';

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type RelatedEventOption = {
  id: number;
  title: string;
  date: string;
};

type FollowUpEntry = {
  seguimientoPosteventoId: number;
  tipoEvento: string;
  tituloEvento: string;
  fechaEvento: string;
  fechaSeguimiento: string;
  estado: string;
  nivelDolor: number | null;
  compartirConMedico: boolean;
  requiereAtencion: boolean;
  notas: string | null;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildEntryMeta = (entry: FollowUpEntry) => {
  const markers: string[] = [];
  if (entry.compartirConMedico) {
    markers.push('Compartido');
  }
  if (entry.requiereAtencion) {
    markers.push('Requiere atencion');
  }
  if (entry.nivelDolor !== null) {
    markers.push(`Dolor ${entry.nivelDolor}/10`);
  }
  return markers.join(' Ã‚Â· ');
};

export function SeguimientoPosteventoScreen() {
  const { token, user } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [form, setForm] = useState({
    pacienteId: '',
    tipoEvento: 'operacion',
    operacionId: '',
    lesionId: '',
    tituloEvento: '',
    fechaEvento: todayString(),
    fechaSeguimiento: todayString(),
    estado: 'activo',
    nivelDolor: '',
    evolucion: '',
    sintomas: '',
    medicacionActual: '',
    cuidadosHogar: '',
    notas: '',
    proximoControl: '',
  });
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [operationOptions, setOperationOptions] = useState<RelatedEventOption[]>([]);
  const [lesionOptions, setLesionOptions] = useState<RelatedEventOption[]>([]);
  const [recentEntries, setRecentEntries] = useState<FollowUpEntry[]>([]);
  const [compartirConMedico, setCompartirConMedico] = useState(true);
  const [requiereAtencion, setRequiereAtencion] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const selectedPatientId = Number(form.pacienteId);
  const hasValidPatient = Number.isFinite(selectedPatientId) && selectedPatientId > 0;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }

    setLoadingPatients(true);
    setScreenError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar las personas');
      }

      const items: (LinkedPatient | null)[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const rawId =
                relation?.pacienteId ??
                relation?.pacienteid ??
                relation?.id ??
                relation?.paciente?.pacienteId;
              const pacienteId = Number(rawId);
              if (!Number.isFinite(pacienteId)) {
                return null;
              }

              let displayName =
                relation?.displayName ??
                relation?.nombrePaciente ??
                relation?.paciente?.displayName ??
                `Paciente #${pacienteId}`;

              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: authHeaders,
                });
                const patient = await patientResponse.json().catch(() => null);
                if (patientResponse.ok && patient) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const combined = `${nombres} ${apellidos}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // Ignorar errores individuales.
              }

              return { pacienteId, displayName };
            }),
          )
        : [];

      setPatientOptions(items.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const fetchRelatedEvents = useCallback(async () => {
    if (!hasValidPatient) {
      setOperationOptions([]);
      setLesionOptions([]);
      return;
    }

    setLoadingEvents(true);
    try {
      const [operationsResponse, lesionsResponse] = await Promise.all([
        fetch(`${API_URL}/operacion`, { headers: authHeaders }),
        fetch(`${API_URL}/lesion`, { headers: authHeaders }),
      ]);

      const operationsPayload = await operationsResponse.json().catch(() => []);
      const lesionsPayload = await lesionsResponse.json().catch(() => []);

      if (!operationsResponse.ok) {
        throw new Error(operationsPayload?.message ?? 'No se pudieron cargar las operaciones');
      }
      if (!lesionsResponse.ok) {
        throw new Error(lesionsPayload?.message ?? 'No se pudieron cargar las lesiones');
      }

      const nextOperations = Array.isArray(operationsPayload)
        ? operationsPayload
            .map((item: any) => ({
              id: Number(item?.operacionId ?? item?.operacionid),
              patientId: Number(item?.pacienteId ?? item?.pacienteid),
              title: String(item?.tipo ?? 'Operacion'),
              date: String(item?.fechaoperacion ?? ''),
            }))
            .filter((item) => Number.isFinite(item.id) && item.patientId === selectedPatientId)
            .map((item) => ({ id: item.id, title: item.title, date: item.date }))
        : [];

      const nextLesions = Array.isArray(lesionsPayload)
        ? lesionsPayload
            .map((item: any) => ({
              id: Number(item?.lesionId ?? item?.lesionid),
              patientId: Number(item?.pacienteId ?? item?.pacienteid),
              title: String(item?.tipo ?? 'Lesion'),
              date: String(item?.fechalesion ?? ''),
            }))
            .filter((item) => Number.isFinite(item.id) && item.patientId === selectedPatientId)
            .map((item) => ({ id: item.id, title: item.title, date: item.date }))
        : [];

      setOperationOptions(nextOperations);
      setLesionOptions(nextLesions);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los eventos');
      setOperationOptions([]);
      setLesionOptions([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  const fetchEntries = useCallback(async () => {
    if (!hasValidPatient) {
      setRecentEntries([]);
      return;
    }

    setLoadingEntries(true);
    try {
      const response = await fetch(`${API_URL}/seguimientopostevento?pacienteId=${selectedPatientId}`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudieron cargar los seguimientos');
      }

      const mapped = Array.isArray(payload)
        ? payload.map((item: any) => ({
            seguimientoPosteventoId: Number(
              item?.seguimientoPosteventoId ?? item?.seguimientoposteventoid,
            ),
            tipoEvento: String(item?.tipoEvento ?? item?.tipoevento ?? ''),
            tituloEvento: String(item?.tituloEvento ?? item?.tituloevento ?? 'Seguimiento'),
            fechaEvento: String(item?.fechaEvento ?? item?.fechaevento ?? ''),
            fechaSeguimiento: String(item?.fechaSeguimiento ?? item?.fechaseguimiento ?? ''),
            estado: String(item?.estado ?? ''),
            nivelDolor:
              typeof item?.nivelDolor === 'number'
                ? item.nivelDolor
                : typeof item?.niveldolor === 'number'
                  ? item.niveldolor
                  : null,
            compartirConMedico: Boolean(
              item?.compartirConMedico ?? item?.compartirconmedico,
            ),
            requiereAtencion: Boolean(item?.requiereAtencion ?? item?.requiereatencion),
            notas: item?.notas ?? null,
          }))
        : [];

      setRecentEntries(mapped.slice(0, 10));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los seguimientos');
      setRecentEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchRelatedEvents();
    fetchEntries();
  }, [fetchRelatedEvents, fetchEntries]);

  const currentEventOptions =
    form.tipoEvento === 'operacion' ? operationOptions : lesionOptions;

  const applyRelatedEvent = (value: string) => {
    if (form.tipoEvento === 'operacion') {
      handleChange('operacionId', value);
      handleChange('lesionId', '');
      const selected = operationOptions.find((item) => String(item.id) === value);
      if (selected) {
        setForm((prev) => ({
          ...prev,
          tituloEvento: prev.tituloEvento.trim() ? prev.tituloEvento : `Postoperatorio: ${selected.title}`,
          fechaEvento: selected.date || prev.fechaEvento,
        }));
      }
      return;
    }

    handleChange('lesionId', value);
    handleChange('operacionId', '');
    const selected = lesionOptions.find((item) => String(item.id) === value);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        tituloEvento: prev.tituloEvento.trim() ? prev.tituloEvento : `Seguimiento lesion: ${selected.title}`,
        fechaEvento: selected.date || prev.fechaEvento,
      }));
    }
  };

  const handleTipoEventoChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      tipoEvento: value,
      operacionId: '',
      lesionId: '',
      tituloEvento: value === 'emergencia' ? prev.tituloEvento : '',
    }));
  };

  const resetForm = () => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      tipoEvento: 'operacion',
      operacionId: '',
      lesionId: '',
      tituloEvento: '',
      fechaEvento: todayString(),
      fechaSeguimiento: todayString(),
      estado: 'activo',
      nivelDolor: '',
      evolucion: '',
      sintomas: '',
      medicacionActual: '',
      cuidadosHogar: '',
      notas: '',
      proximoControl: '',
    }));
    setCompartirConMedico(true);
    setRequiereAtencion(false);
  };

  const handleSubmit = async () => {
    if (!hasValidPatient || !form.tituloEvento.trim() || !form.fechaEvento.trim()) {
      Alert.alert('Faltan datos', 'Paciente, titulo del evento y fecha del evento son obligatorios.');
      return;
    }

    if (form.tipoEvento === 'operacion' && !form.operacionId) {
      Alert.alert('Falta relacion', 'Selecciona la operacion a la que pertenece este seguimiento.');
      return;
    }
    if (form.tipoEvento === 'lesion' && !form.lesionId) {
      Alert.alert('Falta relacion', 'Selecciona la lesion a la que pertenece este seguimiento.');
      return;
    }

    setSubmitting(true);
    try {
      const offlineResult = await submitJsonWithOfflineFallback({
        token,
        path: '/seguimientopostevento',
        method: 'POST',
        description: 'registrar seguimiento de caso',
        body: {
          pacienteId: selectedPatientId,
          tipoEvento: form.tipoEvento,
          operacionId: form.operacionId ? Number(form.operacionId) : undefined,
          lesionId: form.lesionId ? Number(form.lesionId) : undefined,
          tituloEvento: form.tituloEvento.trim(),
          fechaEvento: form.fechaEvento.trim(),
          fechaSeguimiento: form.fechaSeguimiento.trim(),
          estado: form.estado,
          nivelDolor: form.nivelDolor ? Number(form.nivelDolor) : undefined,
          evolucion: form.evolucion.trim() || undefined,
          sintomas: form.sintomas.trim() || undefined,
          medicacionActual: form.medicacionActual.trim() || undefined,
          cuidadosHogar: form.cuidadosHogar.trim() || undefined,
          notas: form.notas.trim() || undefined,
          compartirConMedico,
          requiereAtencion,
          proximoControl: form.proximoControl.trim() || undefined,
          creadoPor: user?.username ?? undefined,
        },
      });
      if (offlineResult.status === 'queued') {
        Alert.alert(
          'Seguimiento en cola',
          'No habia conexion. El seguimiento quedo guardado en el dispositivo y se sincronizara cuando vuelva la red.',
        );
      } else {
        Alert.alert(
          'Seguimiento guardado',
          compartirConMedico
            ? 'La nota quedo registrada y marcada para compartir con el medico.'
            : 'La nota quedo registrada en el historial del caso.',
        );
        fetchEntries();
      }
      resetForm();
      return;

      const response = await fetch(`${API_URL}/seguimientopostevento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          pacienteId: selectedPatientId,
          tipoEvento: form.tipoEvento,
          operacionId: form.operacionId ? Number(form.operacionId) : undefined,
          lesionId: form.lesionId ? Number(form.lesionId) : undefined,
          tituloEvento: form.tituloEvento.trim(),
          fechaEvento: form.fechaEvento.trim(),
          fechaSeguimiento: form.fechaSeguimiento.trim(),
          estado: form.estado,
          nivelDolor: form.nivelDolor ? Number(form.nivelDolor) : undefined,
          evolucion: form.evolucion.trim() || undefined,
          sintomas: form.sintomas.trim() || undefined,
          medicacionActual: form.medicacionActual.trim() || undefined,
          cuidadosHogar: form.cuidadosHogar.trim() || undefined,
          notas: form.notas.trim() || undefined,
          compartirConMedico,
          requiereAtencion,
          proximoControl: form.proximoControl.trim() || undefined,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo guardar el seguimiento');
      }

      Alert.alert(
        'Seguimiento guardado',
        compartirConMedico
          ? 'La nota quedo registrada y marcada para compartir con el medico.'
          : 'La nota quedo registrada en el historial del caso.',
      );
      resetForm();
      fetchEntries();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el seguimiento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Seguimiento De Caso</Text>
      <Text style={styles.subtitle}>
        Registra la evolucion despues de una operacion, lesion o emergencia y define si el medico debe verla.
      </Text>

      <Text style={styles.label}>Paciente</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.pacienteId}
          onValueChange={(value) => {
            handleChange('pacienteId', String(value));
            handleChange('operacionId', '');
            handleChange('lesionId', '');
          }}
          enabled={!loadingPatients}
        >
          <Picker.Item
            label={loadingPatients ? 'Cargando personas...' : 'Selecciona una persona'}
            value=""
          />
          {patientOptions.map((patient) => (
            <Picker.Item
              key={patient.pacienteId}
              label={patient.displayName}
              value={String(patient.pacienteId)}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Tipo de evento</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={form.tipoEvento} onValueChange={(value) => handleTipoEventoChange(String(value))}>
          <Picker.Item label="Operacion" value="operacion" />
          <Picker.Item label="Lesion" value="lesion" />
          <Picker.Item label="Emergencia" value="emergencia" />
        </Picker>
      </View>

      {form.tipoEvento !== 'emergencia' ? (
        <>
          <Text style={styles.label}>
            {form.tipoEvento === 'operacion' ? 'Operacion relacionada' : 'Lesion relacionada'}
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.tipoEvento === 'operacion' ? form.operacionId : form.lesionId}
              onValueChange={(value) => applyRelatedEvent(String(value))}
              enabled={hasValidPatient && !loadingEvents}
            >
              <Picker.Item
                label={
                  !hasValidPatient
                    ? 'Selecciona primero una persona'
                    : loadingEvents
                      ? 'Cargando eventos...'
                      : 'Selecciona el evento'
                }
                value=""
              />
              {currentEventOptions.map((event) => (
                <Picker.Item
                  key={event.id}
                  label={`#${event.id} Ã‚Â· ${formatDate(event.date)} Ã‚Â· ${event.title}`}
                  value={String(event.id)}
                />
              ))}
            </Picker>
          </View>
        </>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Titulo del seguimiento"
        placeholderTextColor="#9FB3C8"
        value={form.tituloEvento}
        onChangeText={(value) => handleChange('tituloEvento', value)}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Fecha evento YYYY-MM-DD"
          placeholderTextColor="#9FB3C8"
          value={form.fechaEvento}
          onChangeText={(value) => handleChange('fechaEvento', value)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Fecha seguimiento YYYY-MM-DD"
          placeholderTextColor="#9FB3C8"
          value={form.fechaSeguimiento}
          onChangeText={(value) => handleChange('fechaSeguimiento', value)}
        />
      </View>

      <Text style={styles.label}>Estado actual</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={form.estado} onValueChange={(value) => handleChange('estado', String(value))}>
          <Picker.Item label="Activo" value="activo" />
          <Picker.Item label="En observacion" value="en observacion" />
          <Picker.Item label="Cerrado" value="cerrado" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nivel de dolor 0-10"
        placeholderTextColor="#9FB3C8"
        keyboardType="numeric"
        value={form.nivelDolor}
        onChangeText={(value) => handleChange('nivelDolor', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Evolucion general"
        placeholderTextColor="#9FB3C8"
        value={form.evolucion}
        multiline
        onChangeText={(value) => handleChange('evolucion', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Sintomas o cambios observados"
        placeholderTextColor="#9FB3C8"
        value={form.sintomas}
        multiline
        onChangeText={(value) => handleChange('sintomas', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Medicacion actual"
        placeholderTextColor="#9FB3C8"
        value={form.medicacionActual}
        multiline
        onChangeText={(value) => handleChange('medicacionActual', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Cuidados en casa"
        placeholderTextColor="#9FB3C8"
        value={form.cuidadosHogar}
        multiline
        onChangeText={(value) => handleChange('cuidadosHogar', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas adicionales"
        placeholderTextColor="#9FB3C8"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Proximo control YYYY-MM-DD"
        placeholderTextColor="#9FB3C8"
        value={form.proximoControl}
        onChangeText={(value) => handleChange('proximoControl', value)}
      />

      <Text style={styles.label}>Visibilidad y prioridad</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleChip, compartirConMedico && styles.toggleChipActive]}
          onPress={() => setCompartirConMedico((current) => !current)}
        >
          <Text style={[styles.toggleChipText, compartirConMedico && styles.toggleChipTextActive]}>
            {compartirConMedico ? 'Compartido con medico' : 'Privado'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleChip, requiereAtencion && styles.toggleChipWarn]}
          onPress={() => setRequiereAtencion((current) => !current)}
        >
          <Text style={[styles.toggleChipText, requiereAtencion && styles.toggleChipTextWarn]}>
            {requiereAtencion ? 'Requiere atencion' : 'Sin urgencia'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, submitting && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.saveBtnText}>{submitting ? 'Guardando...' : 'Guardar seguimiento'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historial reciente</Text>
      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
      {loadingEntries ? (
        <ActivityIndicator color="#29B6FF" style={styles.loader} />
      ) : recentEntries.length ? (
        recentEntries.map((entry) => (
          <View key={entry.seguimientoPosteventoId} style={styles.entryCard}>
            <Text style={styles.entryTitle}>{entry.tituloEvento}</Text>
            <Text style={styles.entryMeta}>
              {entry.tipoEvento} Ã‚Â· evento {formatDate(entry.fechaEvento)} Ã‚Â· seguimiento {formatDate(entry.fechaSeguimiento)}
            </Text>
            <Text style={styles.entryMeta}>{entry.estado}</Text>
            {buildEntryMeta(entry) ? <Text style={styles.entryHighlights}>{buildEntryMeta(entry)}</Text> : null}
            {entry.notas ? <Text style={styles.entryNotes}>{entry.notas}</Text> : null}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {hasValidPatient
              ? 'No hay seguimientos registrados para esta persona.'
              : 'Selecciona una persona para ver el historial del caso.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#071120',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
    marginTop: 8,
    marginBottom: 10,
  },
  label: {
    color: '#F4F8FF',
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#071120',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  toggleChipActive: {
    borderColor: '#29B6FF',
    backgroundColor: '#29B6FF18',
  },
  toggleChipWarn: {
    borderColor: '#FF4D73',
    backgroundColor: '#FF4D7318',
  },
  toggleChipText: {
    color: '#C9D7E8',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleChipTextActive: {
    color: '#29B6FF',
  },
  toggleChipTextWarn: {
    color: '#FF4D73',
  },
  saveBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
  entryCard: {
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 12,
  },
  entryTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  entryMeta: {
    color: '#C9D7E8',
    lineHeight: 19,
    marginBottom: 4,
  },
  entryHighlights: {
    color: '#29B6FF',
    marginBottom: 6,
    fontWeight: '700',
  },
  entryNotes: {
    color: '#F4F8FF',
    lineHeight: 19,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#132238',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#0D1B2A',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#9FB3C8',
    lineHeight: 19,
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
});
