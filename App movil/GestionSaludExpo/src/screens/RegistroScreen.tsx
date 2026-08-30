/**
 * @file App movil/GestionSaludExpo/src/screens/RegistroScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { API_URL } from '../config/api';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  generateFingerprintTemplate,
  saveFingerprintTemplate,
} from '../utils/fingerprint';
import NanoDoctor from '../svg/Nano Doctor.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;
type FeedbackState = { type: 'success' | 'error'; message: string } | null;
const SECURITY_QUESTIONS = [
  { id: 'pet', label: '¿Cómo se llamaba tu primera mascota?' },
  { id: 'school', label: '¿Cuál fue el nombre de tu primera escuela?' },
  { id: 'city', label: '¿En qué ciudad naciste?' },
] as const;

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  if (!feedback) {
    return null;
  }
  const isSuccess = feedback.type === 'success';
  return (
    <View
      style={[
        styles.feedbackBox,
        isSuccess ? styles.feedbackSuccess : styles.feedbackError,
      ]}
    >
      <AppText
        style={[
          styles.feedbackText,
          isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError,
        ]}
      >
        {feedback.message}
      </AppText>
    </View>
  );
};

const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (/native module is null/i.test(error.message)) {
      return 'No se pudo acceder al almacenamiento local de este dispositivo. Reinstala Expo Go o vuelve a compilar para habilitar la huella.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

export function RegistroScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 760;
  const isWebWide = Platform.OS === 'web' && width >= 980;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<'pet' | 'school' | 'city'>('pet');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<string | null>(null);
  const [fingerprintStatus, setFingerprintStatus] = useState<'idle' | 'saved'>('idle');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [bootstrapMode, setBootstrapMode] = useState(false);

  const sanitizeText = (value: string) =>
    value.replace(/[^a-zA-Z\u00C0-\u00FF\u00F1\u00D1\s.-]/g, '');
  const sanitizeUsername = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '');
  const sanitizePassword = (value: string) => value;
  const sanitizeEmail = (value: string) => value.replace(/\s/g, '').toLowerCase();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setBiometricAvailable(false);
      return;
    }

    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && enrolled);
      } catch {
        setBiometricAvailable(false);
      }
    };
    checkBiometrics();
  }, []);

  useEffect(() => {
    const loadRegistrationStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/users/registration-status`);
        const body = await response.json().catch(() => null);
        if (!response.ok || !body) {
          return;
        }
        setRegistrationEnabled(Boolean(body.publicRegistrationEnabled));
        setBootstrapMode(Boolean(body.bootstrapMode));
      } catch (error) {
        console.warn('No se pudo consultar el estado del registro', error);
      }
    };

    loadRegistrationStatus();
  }, []);

  const handleRegisterFingerprint = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Opcion movil', 'La huella digital esta disponible en la app movil.');
        return;
      }
      if (!biometricAvailable) {
        Alert.alert(
          'Biometría no disponible',
          'Configura tu huella en este dispositivo antes de continuar.',
        );
        return;
      }
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu huella para guardarla',
        disableDeviceFallback: true,
      });
      if (!auth.success) {
        Alert.alert('Huella cancelada', 'No se guardó ninguna huella.');
        return;
      }
      const template = generateFingerprintTemplate();
      setFingerprintTemplate(template);
      setFingerprintStatus('saved');
      Alert.alert('Huella registrada', 'Se enviará junto con tu registro.');
    } catch (error) {
      Alert.alert(
        'Error biométrico',
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la huella. Intenta nuevamente.',
      );
    }
  };

  const handleRegister = async () => {
    setFeedback(null);
    if (!registrationEnabled) {
      const message =
        'El registro público está deshabilitado. Solicita a un administrador que cree tu cuenta.';
      setFeedback({ type: 'error', message });
      Alert.alert('Registro no disponible', message);
      return;
    }
    if (!fullName || !email || !city || !country || !username || !password || !confirmPassword || !securityAnswer.trim()) {
      const message = 'Completa todos los datos para continuar.';
      setFeedback({ type: 'error', message });
      Alert.alert('Campos incompletos', message);
      return;
    }
    if (password !== confirmPassword) {
      const message = 'La contraseña y su confirmación no coinciden.';
      setFeedback({ type: 'error', message });
      Alert.alert('Validación', message);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          city,
          country,
          username,
          password,
          fingerprintTemplate: fingerprintTemplate ?? undefined,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo crear la cuenta');
      }
      let successMessage =
        body?.message ?? 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
      if (fingerprintTemplate) {
        try {
          await saveFingerprintTemplate(username, fingerprintTemplate);
        } catch (storageError) {
          console.warn('No se pudo guardar la huella localmente', storageError);
          successMessage =
            'Cuenta creada, pero no pudimos guardar la huella en este dispositivo. Podrás registrarla nuevamente desde este mismo teléfono.';
        }
      }
      setFeedback({ type: 'success', message: successMessage });
      Alert.alert('Éxito', successMessage, [
        { text: 'Ir al login', onPress: () => navigation.replace('Login') },
        {
          text: 'Registro médico',
          onPress: () =>
            navigation.replace('Login', { afterLogin: 'MedicoRegistro' }),
        },
      ]);
    } catch (error) {
      const message = formatErrorMessage(error);
      setFeedback({ type: 'error', message });
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, isWideLayout && styles.containerWide, isWebWide && styles.webContainer]}>
      <View style={[styles.authShell, isWebWide && styles.webAuthShell]}>
        {isWebWide ? (
          <View style={styles.webIntroPanel}>
            <View style={styles.webIntroIcon}>
              <NanoDoctor width={264} height={264} />
            </View>
            <AppText style={styles.webIntroTitle}>Crea tu expediente digital</AppText>
            <AppText style={styles.webIntroCopy}>
              Registra tu cuenta para administrar pacientes asociados, historial clinico y
              recordatorios desde una vista web mas amplia.
            </AppText>
            <View style={styles.webIntroLine} />
            <AppText style={styles.webIntroNote}>Acceso web y movil con la misma cuenta.</AppText>
          </View>
        ) : null}
      <View style={[styles.card, isWideLayout && styles.cardWide, isWebWide && styles.webCard]}>
        <AppText style={styles.title}>Crear cuenta</AppText>
        <AppText style={styles.subtitle}>
          Completa tus datos para registrarte en Gestión Salud.
        </AppText>
        <FeedbackBanner feedback={feedback} />
        {bootstrapMode ? (
          <View style={styles.bootstrapNotice}>
            <AppText style={styles.bootstrapNoticeText}>
              Estás creando el primer usuario del sistema. Esta cuenta recibirá acceso
              administrador inicial.
            </AppText>
          </View>
        ) : null}

        <AppText style={styles.label}>Nombre completo</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Ej: Andrea López"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="words"
          value={fullName}
          onChangeText={(text) => setFullName(sanitizeText(text))}
        />

        <AppText style={styles.label}>Correo electrónico</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="tu@email.com"
          placeholderTextColor="#9FB3C8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(text) => setEmail(sanitizeEmail(text))}
        />

        <AppText style={styles.label}>Ciudad</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Ej: Managua"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="words"
          value={city}
          onChangeText={(text) => setCity(sanitizeText(text))}
        />

        <AppText style={styles.label}>País</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Ej: Nicaragua"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="words"
          value={country}
          onChangeText={(text) => setCountry(sanitizeText(text))}
        />

        <AppText style={styles.label}>Usuario</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="usuario.demo"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={(text) => setUsername(sanitizeUsername(text))}
        />

        <AppText style={styles.label}>Contraseña</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#9FB3C8"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(sanitizePassword(text))}
        />

        <AppText style={styles.label}>Confirmar contraseña</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Repite la contraseña"
          placeholderTextColor="#9FB3C8"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(sanitizePassword(text))}
        />

        <AppText style={styles.label}>Pregunta de seguridad</AppText>
        {SECURITY_QUESTIONS.map((question) => (
          <TouchableOpacity key={question.id} style={[styles.questionOption, securityQuestion === question.id && styles.questionOptionActive]} onPress={() => setSecurityQuestion(question.id)} disabled={loading}>
            <AppText style={styles.questionOptionText}>{question.label}</AppText>
          </TouchableOpacity>
        ))}
        <AppTextInput style={styles.input} placeholder="Tu respuesta" placeholderTextColor="#9FB3C8" value={securityAnswer} onChangeText={setSecurityAnswer} />

        {biometricAvailable ? (
          <View style={styles.fingerprintBox}>
            <AppText style={styles.label}>Huella digital</AppText>
            <AppText style={styles.fingerprintHint}>
              Registra tu huella para iniciar sesión desde este dispositivo sin
              contraseña.
            </AppText>
            <TouchableOpacity
              style={[
                styles.fingerprintBtn,
                fingerprintStatus === 'saved' && styles.fingerprintBtnActive,
              ]}
              onPress={handleRegisterFingerprint}
              disabled={loading}
            >
              <AppText
                style={[
                  styles.fingerprintBtnText,
                  fingerprintStatus === 'saved' && styles.fingerprintBtnTextActive,
                ]}
              >
                {fingerprintStatus === 'saved' ? 'Huella lista' : 'Registrar huella'}
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <AppText style={styles.fingerprintWarning}>
            {Platform.OS === 'web'
              ? 'La huella digital esta disponible en la app movil.'
              : 'Configura la huella en tu teléfono para habilitar esta opción.'}
          </AppText>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleRegister}
          disabled={loading || !registrationEnabled}
          accessibilityLabel="Crear cuenta"
        >
          {loading ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <AppText style={styles.primaryLabel}>Registrarme</AppText>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
          <AppText style={styles.secondaryLabel}>Ya tengo cuenta</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.medicalRegisterBtn}
          onPress={() => navigation.navigate('MedicoRegistro')}
          accessibilityLabel="Acceder al registro médico"
        >
          <NanoDoctor width={42} height={42} />
          <AppText style={styles.medicalRegisterIcon}>⚕</AppText>
          <View style={styles.medicalRegisterCopy}>
            <AppText style={styles.medicalRegisterTitle}>Registro médico</AppText>
            <AppText style={styles.medicalRegisterHint}>
              Crea tu cuenta y registra tus credenciales profesionales
            </AppText>
          </View>
          <AppText style={styles.medicalRegisterArrow}>›</AppText>
        </TouchableOpacity>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#071120',
  },
  containerWide: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  webContainer: {
    backgroundColor: '#F4F8FF',
  },
  authShell: {
    width: '100%',
  },
  webAuthShell: {
    maxWidth: 1180,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 28,
  },
  webIntroPanel: {
    flex: 1,
    maxWidth: 460,
    borderRadius: 28,
    padding: 34,
    backgroundColor: '#071120',
    justifyContent: 'center',
  },
  webIntroIcon: {
    width: 316,
    height: 316,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6F4FE',
    alignSelf: 'center',
    marginBottom: 34,
  },
  webIntroIconText: {
    color: '#071120',
    fontSize: 20,
    fontWeight: '900',
  },
  webIntroTitle: {
    color: '#F4F8FF',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
  },
  webIntroCopy: {
    color: '#C9D7E8',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
  },
  webIntroLine: {
    height: 1,
    backgroundColor: '#27496D',
    marginVertical: 28,
  },
  webIntroNote: {
    color: '#38E28E',
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#F4F8FF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardWide: {
    padding: 28,
  },
  webCard: {
    flex: 1,
    maxWidth: 620,
    borderRadius: 28,
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#071120',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9FB3C8',
    marginBottom: 20,
  },
  feedbackBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#38E28E18',
    borderColor: '#38E28E',
  },
  feedbackError: {
    backgroundColor: '#FF4D7318',
    borderColor: '#FF4D73',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#38E28E',
  },
  feedbackTextError: {
    color: '#FF4D73',
  },
  bootstrapNotice: {
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#29B6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bootstrapNoticeText: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9FB3C8',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#071120',
  },
  fingerprintBox: {
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F4F8FF',
  },
  questionOption: { borderWidth: 1, borderColor: '#C9D7E8', borderRadius: 10, padding: 11, marginBottom: 8 },
  questionOptionActive: { borderColor: '#29B6FF', backgroundColor: '#EAF7FF' },
  questionOptionText: { color: '#071120', fontSize: 14 },
  fingerprintHint: {
    fontSize: 12,
    color: '#9FB3C8',
    marginBottom: 10,
  },
  fingerprintBtn: {
    borderWidth: 1,
    borderColor: '#29B6FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fingerprintBtnActive: {
    backgroundColor: '#29B6FF18',
  },
  fingerprintBtnText: {
    color: '#29B6FF',
    fontWeight: '600',
  },
  fingerprintBtnTextActive: {
    color: '#29B6FF',
  },
  fingerprintWarning: {
    fontSize: 12,
    color: '#FF4D73',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  primaryLabel: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9FB3C8',
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#071120',
    fontWeight: '600',
    fontSize: 14,
  },
  medicalRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#29B6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#EAF7FF',
  },
  medicalRegisterIcon: {
    display: 'none',
    width: 34,
    color: '#29B6FF',
    fontSize: 25,
    fontWeight: '800',
  },
  medicalRegisterCopy: {
    flex: 1,
  },
  medicalRegisterTitle: {
    color: '#071120',
    fontSize: 14,
    fontWeight: '800',
  },
  medicalRegisterHint: {
    color: '#54708C',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  medicalRegisterArrow: {
    color: '#29B6FF',
    fontSize: 28,
    marginLeft: 8,
  },
});
