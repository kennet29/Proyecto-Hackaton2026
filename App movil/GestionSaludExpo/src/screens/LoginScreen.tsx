import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('campos incompletos', 'por favor llena usuario y password');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.accessToken || !body?.user) {
        throw new Error(body?.message ?? 'credenciales invalidas');
      }
      login({ token: body.accessToken, user: body.user });
      navigation.reset({ index: 0, routes: [{ name: 'MenuPrincipal' }] });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'no se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.circle, styles.blueCircle]} />
      <View style={[styles.circle, styles.orangeCircle]} />
      <View style={styles.card}>
        <Text style={styles.welcome}>bienvenido</Text>
        <Text style={styles.subtitle}>nos alegra tenerte de vuelta</Text>
        <Text style={styles.label}>usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="ej: usuario.demo"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <Text style={styles.label}>contrasena</Text>
        <TextInput
          style={styles.input}
          placeholder="escribe tu contrasena"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.actions}>
          <Text style={styles.remember}>recordarme</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CambiarContrasena')}>
            <Text style={styles.forget}>olvide mi contrasena</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>iniciar</Text>}
        </TouchableOpacity>
        <Text style={styles.footer}>
          ¿no tienes cuenta?
          <Text style={styles.link} onPress={() => Alert.alert('contacta al administrador')}>
            {' '}
            registrarme
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#111',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remember: {
    fontSize: 12,
    color: '#6b7280',
  },
  forget: {
    fontSize: 12,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
    color: '#4b5563',
  },
  link: {
    color: '#1d4ed8',
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
    backgroundColor: '#3b82f6',
    top: 90,
    left: 30,
  },
  orangeCircle: {
    backgroundColor: '#fb923c',
    bottom: 90,
    right: 30,
  },
});
