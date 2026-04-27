import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type LinkedPatient = {
  relationId: number;
  pacienteId: number;
  nombreCompleto: string;
  sexo?: string | null;
  contacto?: string | null;
  parentesco?: string | null;
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return '';
    }
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateOnlyString(parsed);
  }
  return '';
};

const parseDateForPicker = (value?: string) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const segments = value.split('-').map((segment) => Number(segment));
    if (segments.length === 3 && segments.every((segment) => !Number.isNaN(segment))) {
      return new Date(segments[0], segments[1] - 1, segments[2]);
    }
  }
  return new Date();
};

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return 'Seleccionar fecha de nacimiento';
  }
  const parsed = parseDateForPicker(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function PacienteFormScreen() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    sexo: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
  });
  const { token, user } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBirthDateChange = (selectedDate: Date) => {
    handleChange('fechaNacimiento', toDateOnlyString(selectedDate));
  };

  const showBirthDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form.fechaNacimiento),
        mode: 'date',
        is24Hour: true,
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleBirthDateChange(selectedDate);
          }
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const fetchLinkedPatients = useCallback(async () => {
    if (!token) {
      setLinkedPatients([]);
      setLoadingPatients(false);
      setPatientLoadError(null);
      return;
    }
    setLoadingPatients(true);
    setPatientLoadError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relationsBody = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relationsBody?.message ?? 'No se pudieron consultar tus personas registradas.');
      }
      const relations: any[] = Array.isArray(relationsBody) ? relationsBody : [];
      const enriched = await Promise.all(
        relations.map(async (relation) => {
          const pacienteId = Number(
            relation?.pacienteId ??
              relation?.pacienteid ??
              relation?.id ??
              relation?.paciente?.pacienteId,
          );
          if (!Number.isFinite(pacienteId)) {
            return null;
          }
          let nombreCompleto =
            relation?.displayName ??
            relation?.nombrePaciente ??
            relation?.paciente?.displayName ??
            `Paciente #${pacienteId}`;
          let sexo = relation?.sexo ?? relation?.paciente?.sexo ?? null;
          let contacto = relation?.telefono ?? relation?.email ?? null;
          try {
            const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
              headers: authHeaders,
            });
            const patientBody = await patientResponse.json().catch(() => null);
            if (patientBody && patientResponse.ok) {
              const nombre = patientBody?.nombres ?? '';
              const apellido = patientBody?.apellidos ?? '';
              nombreCompleto = `${nombre} ${apellido}`.trim() || nombreCompleto;
              sexo = patientBody?.sexo ?? sexo;
              contacto = patientBody?.telefono ?? patientBody?.email ?? contacto;
            }
          } catch {
            // ignorar errores individuales
          }
          return {
            relationId:
              relation?.id ??
              relation?.usuariopacienteid ??
              relation?.usuarioPacienteId ??
              pacienteId,
            pacienteId,
            nombreCompleto,
            sexo,
            contacto,
            parentesco: relation?.parentesco ?? null,
          } as LinkedPatient;
        }),
      );
      setLinkedPatients(enriched.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setPatientLoadError(
        error instanceof Error ? error.message : 'No se pudieron cargar las personas del usuario.',
      );
      setLinkedPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchLinkedPatients();
  }, [fetchLinkedPatients]);

  const handleSubmit = async () => {
    if (!form.nombres || !form.apellidos || !form.sexo) {
      Alert.alert('Faltan Datos', 'Nombres, apellidos y genero son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/paciente`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nombres: form.nombres,
          apellidos: form.apellidos,
          sexo: form.sexo,
          telefono: form.telefono || undefined,
          email: form.email || undefined,
          fechanacimiento: form.fechaNacimiento || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? 'Error al crear paciente');
      }
      const pacienteId =
        body?.pacienteId ??
        body?.pacienteid ??
        body?.id ??
        body?.paciente?.pacienteId;
      if (!pacienteId) {
        throw new Error('El backend no devolvió el identificador del paciente');
      }
      const relationResponse = await fetch(`${API_URL}/usuario-paciente`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId,
        }),
      });
      const relationBody = await relationResponse.json().catch(() => ({}));
      if (!relationResponse.ok) {
        throw new Error(relationBody?.message ?? 'No se pudo vincular el paciente al usuario');
      }
      Alert.alert('Paciente Registrado', 'El paciente se guardó y vinculó correctamente');
      setForm({
        nombres: '',
        apellidos: '',
        sexo: '',
        telefono: '',
        email: '',
        fechaNacimiento: '',
      });
      fetchLinkedPatients();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo Paciente</Text>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pacientes de este usuario</Text>
          <TouchableOpacity onPress={fetchLinkedPatients} disabled={loadingPatients}>
            <Text style={styles.linkText}>{loadingPatients ? 'Cargando...' : 'Actualizar'}</Text>
          </TouchableOpacity>
        </View>
        {patientLoadError ? <Text style={styles.errorText}>{patientLoadError}</Text> : null}
        {!loadingPatients && linkedPatients.length === 0 ? (
          <Text style={styles.emptyText}>No hay personas vinculadas a este usuario todavía.</Text>
        ) : null}
        {linkedPatients.map((patient) => (
          <View key={patient.relationId} style={styles.patientCard}>
            <Text style={styles.patientName}>{patient.nombreCompleto}</Text>
            {patient.sexo ? <Text style={styles.patientMeta}>Genero: {patient.sexo}</Text> : null}
            {patient.parentesco ? <Text style={styles.patientMeta}>Parentesco: {patient.parentesco}</Text> : null}
            {patient.contacto ? <Text style={styles.patientMeta}>Contacto: {patient.contacto}</Text> : null}
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Registrar nuevo paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={form.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={form.apellidos}
        onChangeText={(value) => handleChange('apellidos', value)}
      />
      <Text style={styles.label}>Genero</Text>
      <View style={styles.pickerShell}>
        <Picker
          selectedValue={form.sexo}
          onValueChange={(value) => handleChange('sexo', String(value))}
        >
          <Picker.Item label="Selecciona un genero" value="" />
          <Picker.Item label="Femenino" value="F" />
          <Picker.Item label="Masculino" value="M" />
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Telefono"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(value) => handleChange('email', value)}
      />
      <Text style={styles.label}>Fecha de nacimiento</Text>
      <TouchableOpacity style={styles.dateField} onPress={showBirthDatePicker}>
        <Text style={form.fechaNacimiento ? styles.dateValue : styles.datePlaceholder}>
          {formatDisplayDate(form.fechaNacimiento)}
        </Text>
      </TouchableOpacity>
      {showIOSDatePicker ? (
        <DateTimePicker
          value={parseDateForPicker(form.fechaNacimiento)}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              handleBirthDateChange(selectedDate);
            }
          }}
        />
      ) : null}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Paciente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  patientCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  patientMeta: {
    color: '#334155',
    marginBottom: 2,
  },
  emptyText: {
    color: '#64748b',
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateValue: {
    fontSize: 16,
    color: '#0f172a',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
