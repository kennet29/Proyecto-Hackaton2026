import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { invalidateLinkedPatientsCache } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { parseCalendarDate } from '../utils/localDate';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteEditor'>;

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
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  return parseCalendarDate(value) ?? new Date();
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Seleccionar fecha de nacimiento';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <AppText style={styles.label}>
      {children}
      {required ? (
        <AppText style={styles.requiredMark}> *</AppText>
      ) : (
        <AppText style={styles.optionalText}> (opcional)</AppText>
      )}
    </AppText>
  );
}

export function PacienteEditorScreen({ navigation, route }: Props) {
  const pacienteId = route.params?.pacienteId ?? null;
  const isEditing = pacienteId !== null;
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(Boolean(isEditing));
  const [submitting, setSubmitting] = useState(false);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [relationId, setRelationId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    sexo: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    parentesco: '',
    esPrincipal: false,
  });

  const headers = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) base.Authorization = `Bearer ${token}`;
    return base;
  }, [token]);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadPatient = useCallback(async () => {
    if (!token || !pacienteId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/paciente/${pacienteId}`, { headers });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo cargar el paciente');
      }
      setForm({
        nombres: body?.nombres ?? '',
        apellidos: body?.apellidos ?? '',
        sexo: body?.sexo ?? '',
        telefono: body?.telefono ?? '',
        email: body?.email ?? '',
        fechaNacimiento: toDateOnlyString(body?.fechanacimiento),
        parentesco: '',
        esPrincipal: false,
      });
      const relationResponse = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers });
      const relations = await relationResponse.json().catch(() => []);
      if (relationResponse.ok && Array.isArray(relations)) {
        const relation = relations.find((item) => Number(item?.pacienteId) === pacienteId);
        const resolvedRelationId =
          relation?.id ?? relation?.usuariopacienteid ?? relation?.usuarioPacienteId ?? null;
        setRelationId(resolvedRelationId ? Number(resolvedRelationId) : null);
        setForm((prev) => ({
          ...prev,
          parentesco: relation?.parentesco ?? '',
          esPrincipal: Boolean(relation?.esPrincipal),
        }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar el paciente');
    } finally {
      setLoading(false);
    }
  }, [headers, pacienteId, token]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const showBirthDatePicker = () => {
    if (openWebDateTimePicker('date', form.fechaNacimiento, (value) => handleChange('fechaNacimiento', value))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form.fechaNacimiento),
        mode: 'date',
        is24Hour: true,
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            handleChange('fechaNacimiento', toDateOnlyString(selectedDate));
          }
        },
      });
      return;
    }
    setShowIOSDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!form.nombres.trim() || !form.apellidos.trim() || !form.sexo) {
      Alert.alert('Faltan Datos', 'Nombres, apellidos y genero son obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        isEditing ? `${API_URL}/paciente/${pacienteId}` : `${API_URL}/paciente`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers,
          body: JSON.stringify({
            nombres: form.nombres.trim(),
            apellidos: form.apellidos.trim(),
            sexo: form.sexo,
            telefono: form.telefono.trim() || undefined,
            email: form.email.trim() || undefined,
            fechanacimiento: form.fechaNacimiento || undefined,
            creadopor: user?.username ?? undefined,
            modificadopor: isEditing ? user?.username ?? undefined : undefined,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? `Error al ${isEditing ? 'actualizar' : 'crear'} paciente`);
      }

      if (!isEditing) {
        const newPacienteId = body?.pacienteId ?? body?.pacienteid ?? body?.id ?? body?.paciente?.pacienteId;
        if (!newPacienteId) {
          throw new Error('El backend no devolvio el identificador del paciente');
        }
        const relationResponse = await fetch(`${API_URL}/usuario-paciente`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            pacienteId: newPacienteId,
            parentesco: form.parentesco.trim() || undefined,
            esPrincipal: form.esPrincipal,
          }),
        });
        const relationBody = await relationResponse.json().catch(() => ({}));
        if (!relationResponse.ok) {
          throw new Error(relationBody?.message ?? 'No se pudo vincular el paciente al usuario');
        }
      } else if (relationId) {
        const relationResponse = await fetch(`${API_URL}/usuario-paciente/${relationId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            parentesco: form.parentesco.trim() || undefined,
            esPrincipal: form.esPrincipal,
          }),
        });
        const relationBody = await relationResponse.json().catch(() => ({}));
        if (!relationResponse.ok) {
          throw new Error(relationBody?.message ?? 'No se pudo actualizar el parentesco');
        }
      }

      invalidateLinkedPatientsCache(headers);

      Alert.alert(
        isEditing ? 'Paciente actualizado' : 'Paciente registrado',
        isEditing
          ? 'Los datos del paciente se actualizaron correctamente'
          : 'El paciente se guardo y vinculo correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#29B6FF" />
        <AppText style={styles.loadingText}>Cargando paciente...</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.title}>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</AppText>
      <AppText style={styles.subtitle}>
        {isEditing ? `Paciente #${pacienteId}` : 'Completa los datos para vincularlo a tu cuenta.'}
      </AppText>

      <AppText style={styles.requiredHint}>Los campos con * son obligatorios.</AppText>

      <FieldLabel required>Nombres</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. María José"
        placeholderTextColor="#8298AF"
        value={form.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
        autoCapitalize="words"
        accessibilityLabel="Nombres del paciente"
      />

      <FieldLabel required>Apellidos</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. López García"
        placeholderTextColor="#8298AF"
        value={form.apellidos}
        onChangeText={(value) => handleChange('apellidos', value)}
        autoCapitalize="words"
        accessibilityLabel="Apellidos del paciente"
      />

      <FieldLabel required>Género</FieldLabel>
      <View style={styles.pickerShell}>
        <Picker
          selectedValue={form.sexo}
          onValueChange={(value) => handleChange('sexo', String(value))}
          accessibilityLabel="Género del paciente"
        >
          <Picker.Item label="Selecciona un género" value="" />
          <Picker.Item label="Femenino" value="F" />
          <Picker.Item label="Masculino" value="M" />
        </Picker>
      </View>

      <FieldLabel>Teléfono</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. 8888 8888"
        placeholderTextColor="#8298AF"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
        accessibilityLabel="Teléfono del paciente"
      />

      <FieldLabel>Correo electrónico</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. nombre@correo.com"
        placeholderTextColor="#8298AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={form.email}
        onChangeText={(value) => handleChange('email', value)}
        accessibilityLabel="Correo electrónico del paciente"
      />

      <FieldLabel>Fecha de nacimiento</FieldLabel>
      <TouchableOpacity
        style={styles.dateField}
        onPress={showBirthDatePicker}
        accessibilityRole="button"
        accessibilityLabel="Seleccionar fecha de nacimiento"
      >
        <AppText style={form.fechaNacimiento ? styles.dateValue : styles.datePlaceholder}>
          {formatDisplayDate(form.fechaNacimiento)}
        </AppText>
      </TouchableOpacity>

      {showIOSDatePicker ? (
        <DateTimePicker
          value={parseDateForPicker(form.fechaNacimiento)}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (selectedDate) handleChange('fechaNacimiento', toDateOnlyString(selectedDate));
          }}
        />
      ) : null}

      <FieldLabel>Parentesco con el titular</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. Madre, hijo o cónyuge"
        placeholderTextColor="#8298AF"
        value={form.parentesco}
        onChangeText={(value) => handleChange('parentesco', value)}
        autoCapitalize="sentences"
        accessibilityLabel="Parentesco con el titular de la cuenta"
      />
      <View style={styles.switchRow}>
        <AppText style={styles.switchLabel}>Marcar como paciente principal</AppText>
        <Switch
          value={form.esPrincipal}
          onValueChange={(value) => handleChange('esPrincipal', value)}
          thumbColor={form.esPrincipal ? '#29B6FF' : undefined}
        />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
        <AppText style={styles.btnText}>
          {submitting ? 'Guardando...' : isEditing ? 'Actualizar Paciente' : 'Guardar Paciente'}
        </AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#071120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#C9D7E8',
    marginTop: 10,
  },
  container: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: '#071120',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    color: '#F4F8FF',
  },
  subtitle: {
    color: '#C9D7E8',
    marginBottom: 8,
  },
  requiredHint: {
    color: '#9FB3C8',
    fontSize: 13,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  requiredMark: {
    color: '#FF8A80',
  },
  optionalText: {
    color: '#9FB3C8',
    fontWeight: '500',
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
  pickerShell: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
  },
  dateField: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  dateValue: {
    fontSize: 16,
    color: '#F4F8FF',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9FB3C8',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  switchRow: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#0D1B2A',
  },
  switchLabel: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
});
