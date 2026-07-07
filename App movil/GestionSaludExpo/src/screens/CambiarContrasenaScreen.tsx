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
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'CambiarContrasena'>;
type ApiMessage = { message?: string };

export function CambiarContrasenaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);

  const requestCode = async () => {
    const accountEmail = email.trim().toLowerCase();
    if (!accountEmail) {
      Alert.alert('Correo requerido', 'Escribe el correo de tu cuenta.');
      return;
    }

    try {
      setSendingCode(true);
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        headers: buildJsonHeaders(),
        body: JSON.stringify({ username: accountEmail }),
      });
      const body = await parseJsonResponse<ApiMessage>(response);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo enviar el codigo.');
      }
      Alert.alert('Codigo enviado', 'Revisa tu correo e ingresa el codigo recibido.');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo enviar el codigo.',
      );
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmit = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode || !newPassword) {
      Alert.alert('Faltan datos', 'Codigo y nueva contrasena son requeridos.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        headers: buildJsonHeaders(),
        body: JSON.stringify({
          token: trimmedCode,
          password: newPassword,
        }),
      });
      const body = await parseJsonResponse<ApiMessage>(response);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo cambiar la contrasena.');
      }
      Alert.alert('Contrasena actualizada', 'Ya puedes iniciar sesion.', [
        { text: 'Ir al login', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo cambiar la contrasena.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cambiar contrasena</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9FB3C8"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity
        style={[styles.secondaryBtn, sendingCode && styles.disabledBtn]}
        onPress={requestCode}
        disabled={sendingCode}
      >
        {sendingCode ? (
          <ActivityIndicator color="#0A6FA8" />
        ) : (
          <Text style={styles.secondaryText}>Enviar codigo</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Codigo"
        placeholderTextColor="#9FB3C8"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Nueva contrasena"
        placeholderTextColor="#9FB3C8"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.disabledBtn]}
        onPress={onSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#F4F8FF" />
        ) : (
          <Text style={styles.btnText}>Guardar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F4F8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 18,
    color: '#071120',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: '#071120',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#29B6FF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#EAF7FF',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryText: {
    color: '#0A6FA8',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
