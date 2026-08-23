/**
 * @file App movil/GestionSaludExpo/src/screens/LoginScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { loadFingerprintTemplate } from '../utils/fingerprint';
import { appColors, colorAlpha } from '../theme/colors';
import { getNanoAppearance } from '../components/NanoAppearancePreview';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type FeedbackState = { type: 'success' | 'error'; message: string } | null;
type LoginApiResponse = {
  accessToken: string;
  user: {
    id: number;
    username: string;
    role?: string;
    pacienteId?: number | null;
    pacienteIds?: number[];
  };
  message?: string;
};

const DEFAULT_NANO_APPEARANCE = getNanoAppearance('base');

const LoginBrandLogo = ({ size }: { size: number }) => (
  <Image
    source={DEFAULT_NANO_APPEARANCE.source}
    style={{ width: size, height: size, borderRadius: size * 0.22 }}
    resizeMode="contain"
    accessibilityLabel="Nano"
  />
);

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
      return 'No se pudo acceder al almacenamiento seguro en este dispositivo. Reinstala Expo Go o vuelve a compilar la app para habilitar AsyncStorage.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};

export function LoginScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 760;
  const isWebWide = Platform.OS === 'web' && width >= 920;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [welcomeSession, setWelcomeSession] = useState<LoginApiResponse | null>(null);
  const { clearSessionMessage, login, sessionMessage } = useAuth();

  const fingerprintReady = useMemo(
    () => biometricAvailable && !!fingerprintTemplate,
    [biometricAvailable, fingerprintTemplate],
  );

  const fingerprintStatusMessage = useMemo(() => {
    if (Platform.OS === 'web') {
      return 'La huella digital esta disponible en la app movil.';
    }
    if (!biometricAvailable) {
      return 'Activa la biometría en tu dispositivo para usar esta función.';
    }
    if (!username) {
      return 'Ingresa tu usuario para detectar la huella guardada en este dispositivo.';
    }
    if (!fingerprintTemplate) {
      return 'Registra tu huella desde este dispositivo durante el registro para poder usarla aquí.';
    }
    return 'Usa tu huella para iniciar sesión sin contraseña.';
  }, [biometricAvailable, fingerprintTemplate, username]);

  const sanitizeUsername = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '');

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
    const loadTemplate = async () => {
      if (!username) {
        setFingerprintTemplate(null);
        return;
      }
      try {
        const stored = await loadFingerprintTemplate(username);
        setFingerprintTemplate(stored);
      } catch (error) {
        console.warn('No se pudo leer la huella local', error);
        setFingerprintTemplate(null);
      }
    };
    loadTemplate();
  }, [username]);

  useEffect(() => {
    if (!sessionMessage) {
      return;
    }

    setFeedback({ type: 'error', message: sessionMessage });
    Alert.alert('Sesion requerida', sessionMessage);
    clearSessionMessage();
  }, [clearSessionMessage, sessionMessage]);

  const executeLogin = async (payload: Record<string, unknown>): Promise<LoginApiResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.accessToken || !body?.user) {
      throw new Error(body?.message ?? 'Credenciales inválidas');
    }
    setFeedback({
      type: 'success',
      message: body?.message ?? 'Inicio de sesión exitoso.',
    });
    return body as LoginApiResponse;
  };

  const showWelcome = (body: LoginApiResponse) => {
    setWelcomeSession(body);
  };

  const continueToApp = () => {
    if (!welcomeSession) {
      return;
    }
    login({
      token: welcomeSession.accessToken,
      user: welcomeSession.user,
      initialPrivateRoute: route.params?.afterLogin,
    });
  };

  const handleLogin = async () => {
    setFeedback(null);
    if (!username || !password) {
      const message = 'Por favor completa usuario y contraseña.';
      setFeedback({ type: 'error', message });
      Alert.alert('Campos incompletos', message);
      return;
    }
    try {
      setLoading(true);
      const body = await executeLogin({ username, password });
      showWelcome(body);
    } catch (error) {
      const message = formatErrorMessage(error);
      setFeedback({ type: 'error', message });
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintLogin = async () => {
    setFeedback(null);
    if (Platform.OS === 'web') {
      const message = 'La huella digital esta disponible en la app movil.';
      setFeedback({ type: 'error', message });
      Alert.alert('Opcion movil', message);
      return;
    }
    if (!username) {
      const message = 'Ingresa el usuario asociado a la huella.';
      setFeedback({ type: 'error', message });
      Alert.alert('Usuario requerido', message);
      return;
    }
    if (!fingerprintTemplate) {
      const message =
        'Registra tu huella durante el registro en este mismo dispositivo para usar esta opción.';
      setFeedback({ type: 'error', message });
      Alert.alert('Huella no encontrada', message);
      return;
    }
    if (!biometricAvailable) {
      const message = 'Habilita la biometría en este dispositivo.';
      setFeedback({ type: 'error', message });
      Alert.alert('Biometría no disponible', message);
      return;
    }
    try {
      setFingerprintLoading(true);
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate con tu huella',
        disableDeviceFallback: true,
      });
      if (!auth.success) {
        throw new Error('Autenticación cancelada');
      }
      const body = await executeLogin({ username, fingerprintTemplate });
      showWelcome(body);
    } catch (error) {
      const message = formatErrorMessage(error);
      setFeedback({ type: 'error', message });
      Alert.alert('Error', message);
    } finally {
      setFingerprintLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={[styles.root, isWideLayout && styles.rootWide]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.circle, styles.blueCircle]} />
      <View style={[styles.circle, styles.orangeCircle]} />
      <View style={[styles.authShell, isWebWide && styles.authShellWide]}>
        {isWebWide ? (
          <View style={styles.webBrandPanel}>
            <View style={styles.webBrandBadge}>
              <Ionicons name="medkit-outline" size={18} color="#071120" />
              <AppText style={styles.webBrandBadgeText}>NicaPlus</AppText>
            </View>
            <View style={styles.webBrandLogo}>
              <LoginBrandLogo size={125} />
            </View>
            <AppText style={styles.webBrandTitle}>Tu panel clinico en un solo lugar</AppText>
            <AppText style={styles.webBrandCopy}>
              Organiza pacientes, consultas, recordatorios y seguimiento de bienestar desde una
              experiencia preparada para escritorio.
            </AppText>
            <View style={styles.webHighlights}>
              <View style={styles.webHighlightItem}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#38E28E" />
                <AppText style={styles.webHighlightText}>Acceso seguro</AppText>
              </View>
              <View style={styles.webHighlightItem}>
                <Ionicons name="calendar-outline" size={22} color="#29B6FF" />
                <AppText style={styles.webHighlightText}>Agenda y controles</AppText>
              </View>
              <View style={styles.webHighlightItem}>
                <Ionicons name="analytics-outline" size={22} color="#FF4D73" />
                <AppText style={styles.webHighlightText}>Seguimiento continuo</AppText>
              </View>
            </View>
          </View>
        ) : null}
      <View style={[styles.card, isWideLayout && styles.cardWide, isWebWide && styles.webCard]}>
        <View style={[styles.loginIntro, !isWebWide && styles.loginIntroWithLogo]}>
          <View style={styles.loginIntroCopy}>
            <AppText style={styles.welcome}>Bienvenido</AppText>
            <AppText style={styles.subtitle}>Nos alegra tenerte de vuelta</AppText>
          </View>
          {!isWebWide ? (
            <View style={styles.loginLogo}>
              <LoginBrandLogo size={72} />
            </View>
          ) : null}
        </View>
        <FeedbackBanner feedback={feedback} />
        <AppText style={styles.label}>Usuario</AppText>
        <AppTextInput
          style={styles.input}
          placeholder="Ej: usuario.demo"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={(text) => setUsername(sanitizeUsername(text))}
        />
        <AppText style={styles.label}>Contraseña</AppText>
        <View style={styles.passwordWrapper}>
          <AppTextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Escribe tu contraseña"
            placeholderTextColor="#9FB3C8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.togglePassword}>
            <AppText style={styles.togglePasswordText}>{showPassword ? 'Ocultar' : 'Ver'}</AppText>
          </Pressable>
        </View>
        <View style={styles.actions}>
          <AppText style={styles.remember}>Recordarme</AppText>
          <TouchableOpacity onPress={() => navigation.navigate('CambiarContrasena')}>
            <AppText style={styles.forget}>Olvidé mi contraseña</AppText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#F4F8FF" />
          ) : (
            <AppText style={styles.btnText}>Iniciar</AppText>
          )}
        </TouchableOpacity>
        <View style={styles.fingerprintSection}>
          <View style={styles.fingerprintHeader}>
            <Ionicons name="finger-print-outline" size={22} color="#29B6FF" />
            <AppText style={styles.fingerprintTitle}>Huella digital</AppText>
          </View>
          <AppText style={styles.fingerprintHint}>{fingerprintStatusMessage}</AppText>
          <TouchableOpacity
            style={[
              styles.fingerprintAction,
              (Platform.OS === 'web' || !fingerprintReady || fingerprintLoading) &&
                styles.fingerprintActionDisabled,
            ]}
            onPress={handleFingerprintLogin}
            disabled={Platform.OS === 'web' || !fingerprintReady || fingerprintLoading}
            accessibilityLabel="Iniciar sesión con huella digital"
          >
            {fingerprintLoading ? (
              <ActivityIndicator color="#29B6FF" />
            ) : (
              <AppText
                style={[
                  styles.fingerprintActionText,
                  (Platform.OS === 'web' || !fingerprintReady) &&
                    styles.fingerprintActionTextDisabled,
                ]}
              >
                {fingerprintReady ? 'Ingresar con huella' : 'Huella no disponible'}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
        <AppText style={styles.footer}>
          ¿No tienes cuenta?
          <AppText style={styles.link} onPress={() => navigation.navigate('Registro')}>
            {' '}
            Registrarme
          </AppText>
        </AppText>
      </View>
      </View>
      <Modal
        transparent
        visible={!!welcomeSession}
        animationType="fade"
        onRequestClose={continueToApp}
      >
        <View style={styles.welcomeOverlay}>
          <View style={styles.welcomeModalCard}>
            <View style={styles.welcomeModalIcon}>
              <Ionicons name="shield-checkmark-outline" size={30} color={appColors.background} />
            </View>
            <AppText style={styles.welcomeModalEyebrow}>Sesión verificada</AppText>
            <AppText style={styles.welcomeModalTitle}>
              Bienvenido, {welcomeSession?.user.username ?? 'usuario'}
            </AppText>
            <AppText style={styles.welcomeModalText}>
              {welcomeSession?.message ?? 'Inicio de sesión exitoso. Tu panel de salud está listo.'}
            </AppText>
            <TouchableOpacity style={styles.welcomeModalButton} onPress={continueToApp}>
              <AppText style={styles.welcomeModalButtonText}>Entrar al panel</AppText>
              <Ionicons name="arrow-forward" size={18} color={appColors.background} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  root: {
    flexGrow: 1,
    backgroundColor: '#F4F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rootWide: {
    paddingVertical: 24,
  },
  authShell: {
    width: '100%',
    alignItems: 'center',
  },
  authShellWide: {
    maxWidth: 1180,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 28,
  },
  webBrandPanel: {
    flex: 1,
    maxWidth: 560,
    borderRadius: 28,
    padding: 28,
    backgroundColor: '#071120',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
  },
  webBrandBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F4F8FF',
  },
  webBrandBadgeText: {
    color: '#071120',
    fontSize: 13,
    fontWeight: '800',
  },
  webBrandLogo: {
    width: 236,
    height: 236,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 18,
  },
  webBrandTitle: {
    color: '#F4F8FF',
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 44,
    marginTop: 18,
  },
  webBrandCopy: {
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 470,
  },
  webHighlights: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  webHighlightItem: {
    flex: 1,
    minHeight: 86,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: '#132238',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  webHighlightText: {
    color: '#F4F8FF',
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#F4F8FF',
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  cardWide: {
    padding: 28,
  },
  webCard: {
    alignSelf: 'center',
    maxWidth: 460,
    borderRadius: 28,
    padding: 28,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  loginIntro: {
    marginBottom: 20,
  },
  loginIntroWithLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginIntroCopy: {
    flex: 1,
  },
  loginLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#071120',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9FB3C8',
  },
  label: {
    fontSize: 12,
    color: '#9FB3C8',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#071120',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 70,
  },
  togglePassword: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  togglePasswordText: {
    color: '#29B6FF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remember: {
    fontSize: 12,
    color: '#9FB3C8',
  },
  forget: {
    fontSize: 12,
    color: '#29B6FF',
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 16,
  },
  fingerprintSection: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F4F8FF',
  },
  fingerprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    columnGap: 8,
  },
  fingerprintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#29B6FF',
  },
  fingerprintHint: {
    fontSize: 12,
    color: '#29B6FF',
    marginBottom: 10,
  },
  fingerprintAction: {
    borderWidth: 1,
    borderColor: '#29B6FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fingerprintActionDisabled: {
    borderColor: '#C9D7E8',
    backgroundColor: '#29B6FF18',
  },
  fingerprintActionText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  fingerprintActionTextDisabled: {
    color: '#9FB3C8',
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
    color: '#9FB3C8',
  },
  link: {
    color: '#29B6FF',
    fontWeight: '600',
  },
  welcomeOverlay: {
    flex: 1,
    backgroundColor: colorAlpha(appColors.overlay, 'B8'),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  welcomeModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
    shadowColor: appColors.overlay,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  welcomeModalIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.success,
    marginBottom: 16,
  },
  welcomeModalEyebrow: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  welcomeModalTitle: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeModalText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeModalButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: appColors.accent,
  },
  welcomeModalButtonText: {
    color: appColors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  circle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.9,
  },
  blueCircle: {
    backgroundColor: '#29B6FF',
    top: 90,
    left: 30,
  },
  orangeCircle: {
    backgroundColor: '#FF4D73',
    bottom: 90,
    right: 30,
  },
  feedbackBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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
});
