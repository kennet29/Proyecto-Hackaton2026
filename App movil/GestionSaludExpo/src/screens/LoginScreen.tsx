import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { loadFingerprintTemplate } from '../utils/fingerprint';

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
      <Text
        style={[
          styles.feedbackText,
          isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError,
        ]}
      >
        {feedback.message}
      </Text>
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
  return 'OcurriÃƒÂ³ un error inesperado. Intenta nuevamente.';
};

export function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const { login } = useAuth();
  const fingerprintReady = useMemo(() => biometricAvailable && !!fingerprintTemplate, [biometricAvailable, fingerprintTemplate]);
  const fingerprintStatusMessage = useMemo(() => {
    if (!biometricAvailable) {
      return 'Activa la biometria en tu dispositivo para usar esta funcion.';
    }
    if (!username) {
      return 'Ingresa tu usuario para detectar la huella guardada en este dispositivo.';
    }
    if (!fingerprintTemplate) {
      return 'Registra tu huella desde este dispositivo durante el registro para poder usarla aquÃƒÂ­.';
    }
    return 'Usa tu huella para iniciar sesion sin contrasena.';
  }, [biometricAvailable, fingerprintTemplate, username]);

  const sanitizeUsername = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '');

  useEffect(() => {
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

  const executeLogin = async (payload: Record<string, unknown>): Promise<LoginApiResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.accessToken || !body?.user) {
      throw new Error(body?.message ?? 'credenciales invalidas');
    }
    login({ token: body.accessToken, user: body.user });
    setFeedback({
      type: 'success',
      message: body?.message ?? 'Inicio de sesi?n exitoso.',
    });
    return body as LoginApiResponse;
  };

  const handleLogin = async () => {
    setFeedback(null);
    if (!username || !password) {
      const message = 'Por favor completa usuario y contraseÃƒÂ±a.';
      setFeedback({ type: 'error', message });
      Alert.alert('Campos Incompletos', message);
      return;
    }
    try {
      setLoading(true);
      const body = await executeLogin({ username, password });
      Alert.alert('Bienvenido', body?.message ?? 'Inicio de sesiÃƒÂ³n exitoso');
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
    if (!username) {
      const message = 'Ingresa el usuario asociado a la huella.';
      setFeedback({ type: 'error', message });
      Alert.alert('Usuario Requerido', message);
      return;
    }
    if (!fingerprintTemplate) {
      const message = 'Registra tu huella durante el registro en este mismo dispositivo para usar esta opciÃƒÂ³n.';
      setFeedback({ type: 'error', message });
      Alert.alert('Huella No Encontrada', message);
      return;
    }
    if (!biometricAvailable) {
      const message = 'Habilita la biometrÃƒÂ­a en este dispositivo.';
      setFeedback({ type: 'error', message });
      Alert.alert('BiometrÃƒÂ­a No Disponible', message);
      return;
    }
    try {
      setFingerprintLoading(true);
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'AutentÃƒÂ­cate con tu huella',
        disableDeviceFallback: true,
      });
      if (!auth.success) {
        throw new Error('autenticaciÃƒÂ³n cancelada');
      }
      const body = await executeLogin({ username, fingerprintTemplate });
      Alert.alert('Bienvenido', body?.message ?? 'Inicio de sesiÃƒÂ³n exitoso');
    } catch (error) {
      const message = formatErrorMessage(error);
      setFeedback({ type: 'error', message });
      Alert.alert('Error', message);
    } finally {
      setFingerprintLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.circle, styles.blueCircle]} />
      <View style={[styles.circle, styles.orangeCircle]} />
      <View style={styles.card}>
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.subtitle}>Nos Alegra Tenerte De Vuelta</Text>
        <FeedbackBanner feedback={feedback} />
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Usuario.demo"
          placeholderTextColor="#9FB3C8"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={(text) => setUsername(sanitizeUsername(text))}
        />
        <Text style={styles.label}>ContraseÃƒÂ±a</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Escribe Tu ContraseÃƒÂ±a"
            placeholderTextColor="#9FB3C8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.togglePassword}>
            <Text style={styles.togglePasswordText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
          </Pressable>
        </View>
        <View style={styles.actions}>
          <Text style={styles.remember}>Recordarme</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CambiarContrasena')}>
            <Text style={styles.forget}>Olvide Mi ContraseÃƒÂ±a</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#F4F8FF" /> : <Text style={styles.btnText}>Iniciar</Text>}
        </TouchableOpacity>
        <View style={styles.fingerprintSection}>
          <View style={styles.fingerprintHeader}>
            <Ionicons name="finger-print-outline" size={22} color="#29B6FF" />
            <Text style={styles.fingerprintTitle}>Huella digital</Text>
          </View>
          <Text style={styles.fingerprintHint}>{fingerprintStatusMessage}</Text>
          <TouchableOpacity
            style={[styles.fingerprintAction, (!fingerprintReady || fingerprintLoading) && styles.fingerprintActionDisabled]}
            onPress={handleFingerprintLogin}
            disabled={!fingerprintReady || fingerprintLoading}
            accessibilityLabel="Iniciar sesion con huella digital"
          >
            {fingerprintLoading ? (
              <ActivityIndicator color="#29B6FF" />
            ) : (
              <Text style={[styles.fingerprintActionText, !fingerprintReady && styles.fingerprintActionTextDisabled]}>
                {fingerprintReady ? 'Ingresar con huella' : 'Huella no disponible'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>
          Ã‚Â¿No Tienes Cuenta?
          <Text style={styles.link} onPress={() => navigation.navigate('Registro')}>
            {' '}
            Registrarme
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#F4F8FF',
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
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
    marginBottom: 20,
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
    backgroundColor: '#38F28E18',
    borderColor: '#38F28E',
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
    color: '#38F28E',
  },
  feedbackTextError: {
    color: '#FF4D73',
  },
});

