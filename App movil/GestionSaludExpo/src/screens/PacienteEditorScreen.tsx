/**
 * @file App movil/GestionSaludExpo/src/screens/PacienteEditorScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { AppColors, useAppColors } from '../theme/useAppColors';

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
  const date = parseDateForPicker(value);
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
};

const createIdempotencyKey = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const pacienteId = route.params?.pacienteId ?? null;
  const isEditing = pacienteId !== null;
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(Boolean(isEditing));
  const [submitting, setSubmitting] = useState(false);
  // Evita que dos toques muy seguidos envien dos solicitudes antes de que React actualice el boton.
  const submitInFlight = useRef(false);
  const submitCompleted = useRef(false);
  // Conservan la misma operacion si la red se corta y el usuario vuelve a tocar Guardar.
  // El backend devolverá la respuesta previa en lugar de crear otro paciente.
  const createRequestKey = useRef<string | null>(null);
  const linkRequestKey = useRef<string | null>(null);
  const createdPacienteId = useRef<number | null>(null);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
    if (submitInFlight.current || submitCompleted.current) return;

    if (!form.nombres.trim() || !form.apellidos.trim() || !form.sexo) {
      Alert.alert('Faltan Datos', 'Nombres, apellidos y genero son obligatorios');
      return;
    }

    submitInFlight.current = true;
    setSubmitting(true);
    try {
      let body: Record<string, unknown> = {};

      if (!isEditing) {
        if (!createdPacienteId.current) {
          createRequestKey.current ??= createIdempotencyKey('patient-create');
          const response = await fetch(`${API_URL}/paciente`, {
            method: 'POST',
            headers: { ...headers, 'Idempotency-Key': createRequestKey.current },
            body: JSON.stringify({
              nombres: form.nombres.trim(),
              apellidos: form.apellidos.trim(),
              sexo: form.sexo,
              telefono: form.telefono.trim() || undefined,
              email: form.email.trim() || undefined,
              fechanacimiento: form.fechaNacimiento || undefined,
              creadopor: user?.username ?? undefined,
            }),
          });
          body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error((body as { message?: string })?.message ?? 'Error al crear paciente');
          const newPacienteId = Number((body as any)?.pacienteId ?? (body as any)?.pacienteid ?? (body as any)?.id ?? (body as any)?.paciente?.pacienteId);
          if (!newPacienteId) throw new Error('El backend no devolvio el identificador del paciente');
          createdPacienteId.current = newPacienteId;
        }

        const newPacienteId = createdPacienteId.current;
        if (!newPacienteId) {
          throw new Error('El backend no devolvio el identificador del paciente');
        }
        linkRequestKey.current ??= createIdempotencyKey('patient-link');
        const relationResponse = await fetch(`${API_URL}/usuario-paciente`, {
          method: 'POST',
          headers: { ...headers, 'Idempotency-Key': linkRequestKey.current },
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
      } else {
        const response = await fetch(`${API_URL}/paciente/${pacienteId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            nombres: form.nombres.trim(),
            apellidos: form.apellidos.trim(),
            sexo: form.sexo,
            telefono: form.telefono.trim() || undefined,
            email: form.email.trim() || undefined,
            fechanacimiento: form.fechaNacimiento || undefined,
            modificadopor: user?.username ?? undefined,
          }),
        });
        body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error((body as { message?: string })?.message ?? 'Error al actualizar paciente');
      }

      if (isEditing && relationId) {
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
      submitCompleted.current = true;
      if (isEditing) {
        Alert.alert(
          'Paciente actualizado',
          'Los datos del paciente se actualizaron correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        navigation.popTo('PacienteForm', { patientCreated: true });
      }
    } catch (error) {
      if (!isEditing && createdPacienteId.current) {
        Alert.alert(
          'Paciente creado',
          'El paciente ya fue creado. Solo falta vincularlo a tu cuenta; vuelve a presionar Guardar para reintentar el vínculo. No se creará un duplicado.',
        );
      } else {
        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
      }
    } finally {
      setSubmitting(false);
      submitInFlight.current = false;
    }
  };

  const continueRegistration = () => {
    if (step === 1 && (!form.nombres.trim() || !form.apellidos.trim() || !form.sexo)) {
      Alert.alert('Completa este paso', 'Escribe los nombres, apellidos y selecciona el género para continuar.');
      return;
    }
    setStep((current) => Math.min(3, current + 1) as 1 | 2 | 3);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.info} />
        <AppText style={styles.loadingText}>Cargando paciente...</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.title}>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</AppText>
      <AppText style={styles.subtitle}>
        {isEditing ? `Paciente #${pacienteId}` : 'Nano te ayudará a completar los datos paso a paso.'}
      </AppText>

      {!isEditing ? (
        <View style={styles.wizardHeader}>
          <View style={styles.wizardProgress}>
            {[1, 2, 3].map((item) => (
              <React.Fragment key={item}>
                <View style={[styles.wizardDot, step >= item && styles.wizardDotActive]}>
                  <AppText style={[styles.wizardDotText, step >= item && styles.wizardDotTextActive]}>{item}</AppText>
                </View>
                {item < 3 ? <View style={[styles.wizardLine, step > item && styles.wizardLineActive]} /> : null}
              </React.Fragment>
            ))}
          </View>
          <AppText style={styles.wizardTitle}>
            {step === 1 ? 'Datos básicos' : step === 2 ? 'Contacto y nacimiento' : 'Relación con tu cuenta'}
          </AppText>
          <AppText style={styles.wizardHint}>
            {step === 1
              ? 'Comencemos por identificar a la persona.'
              : step === 2
                ? 'Estos datos son opcionales y puedes completarlos después.'
                : 'Indica qué relación tiene contigo y confirma el registro.'}
          </AppText>
        </View>
      ) : null}

      <AppText style={styles.requiredHint}>Los campos con * son obligatorios.</AppText>

      {isEditing || step === 1 ? <>
      <FieldLabel required>Nombres</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. María José"
        placeholderTextColor={colors.textMuted}
        value={form.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
        autoCapitalize="words"
        accessibilityLabel="Nombres del paciente"
      />

      <FieldLabel required>Apellidos</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. López García"
        placeholderTextColor={colors.textMuted}
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
      </> : null}

      {isEditing || step === 2 ? <>
      <FieldLabel>Teléfono</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. 8888 8888"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
        accessibilityLabel="Teléfono del paciente"
      />

      <FieldLabel>Correo electrónico</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. nombre@correo.com"
        placeholderTextColor={colors.textMuted}
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
        <DateTimePicker themeVariant={colors.mode}
          value={parseDateForPicker(form.fechaNacimiento)}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (selectedDate) handleChange('fechaNacimiento', toDateOnlyString(selectedDate));
          }}
        />
      ) : null}
      </> : null}

      {isEditing || step === 3 ? <>
      <FieldLabel>Parentesco con el titular</FieldLabel>
      <AppTextInput
        style={styles.input}
        placeholder="Ej. Madre, hijo o cónyuge"
        placeholderTextColor={colors.textMuted}
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
          thumbColor={form.esPrincipal ? colors.info : undefined}
        />
      </View>
      </> : null}

      {!isEditing && step > 1 ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep((step - 1) as 1 | 2)} disabled={submitting}>
          <AppText style={styles.backBtnText}>Volver al paso anterior</AppText>
        </TouchableOpacity>
      ) : null}

      {!isEditing && step < 3 ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={continueRegistration}>
          <AppText style={styles.btnText}>Continuar</AppText>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityState={{ disabled: submitting }}
        >
          <AppText style={styles.btnText}>
            {submitting ? 'Guardando...' : isEditing ? 'Actualizar Paciente' : 'Guardar y finalizar'}
          </AppText>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSoft,
    marginTop: 10,
  },
  container: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    color: colors.text,
  },
  subtitle: {
    color: colors.textSoft,
    marginBottom: 8,
  },
  requiredHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  wizardHeader: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  wizardDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardDotActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  wizardDotText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  wizardDotTextActive: {
    color: '#FFFFFF',
  },
  wizardLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 7,
    borderRadius: 2,
  },
  wizardLineActive: {
    backgroundColor: colors.info,
  },
  wizardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  wizardHint: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  requiredMark: {
    color: '#FF8A80',
  },
  optionalText: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundMuted,
    color: colors.text,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: colors.backgroundMuted,
  },
  dateField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.backgroundMuted,
  },
  dateValue: {
    fontSize: 16,
    color: colors.text,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
  primaryBtn: {
    backgroundColor: colors.info,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  backBtnText: {
    color: colors.info,
    fontWeight: '800',
    fontSize: 14,
  },
  btnText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  switchRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.backgroundMuted,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
});
