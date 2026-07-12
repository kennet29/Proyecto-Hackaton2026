import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'CambiarContrasena'>;
type ApiMessage = { message?: string; token?: string };
type CaptchaResponse = { question?: string; captchaToken?: string; message?: string };
const SECURITY_QUESTIONS = [
  { id: 'pet', label: '¿Cómo se llamaba tu primera mascota?' },
  { id: 'school', label: '¿Cuál fue el nombre de tu primera escuela?' },
  { id: 'city', label: '¿En qué ciudad naciste?' },
] as const;

export function CambiarContrasenaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState<'pet' | 'school' | 'city'>('pet');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('Cargando...');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const loadCaptcha = useCallback(async () => {
    try {
      const response = await apiFetch('/auth/captcha');
      const body = await parseJsonResponse<CaptchaResponse>(response);
      if (!response.ok || !body?.captchaToken || !body.question) throw new Error(body?.message ?? 'No se pudo cargar el captcha.');
      setCaptchaQuestion(body.question);
      setCaptchaToken(body.captchaToken);
      setCaptchaAnswer('');
    } catch (error) {
      setCaptchaQuestion('No disponible');
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar el captcha.');
    }
  }, []);

  useEffect(() => { void loadCaptcha(); }, [loadCaptcha]);

  const requestCode = async () => {
    const accountEmail = email.trim().toLowerCase();
    if (!accountEmail || !securityAnswer.trim() || !captchaAnswer.trim() || !captchaToken) {
      Alert.alert('Faltan datos', 'Completa el correo, la pregunta de seguridad y el captcha.');
      return;
    }

    try {
      setSendingCode(true);
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        headers: buildJsonHeaders(),
        body: JSON.stringify({ username: accountEmail, securityQuestion, securityAnswer: securityAnswer.trim(), captchaAnswer: captchaAnswer.trim(), captchaToken }),
      });
      const body = await parseJsonResponse<ApiMessage>(response);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo enviar el codigo.');
      }
      if (!body?.token) throw new Error('El servidor no devolvio el codigo.');
      setCode(body.token);
      Alert.alert('Codigo generado', `Tu codigo de recuperacion es: ${body.token}`);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo enviar el codigo.',
      );
      void loadCaptcha();
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
    <ScrollView contentContainerStyle={styles.container}>
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
      <Text style={styles.label}>Pregunta de seguridad</Text>
      {SECURITY_QUESTIONS.map((question) => (
        <TouchableOpacity key={question.id} style={[styles.questionOption, securityQuestion === question.id && styles.questionOptionActive]} onPress={() => setSecurityQuestion(question.id)}>
          <Text style={styles.questionOptionText}>{question.label}</Text>
        </TouchableOpacity>
      ))}
      <TextInput style={styles.input} placeholder="Respuesta de seguridad" placeholderTextColor="#9FB3C8" value={securityAnswer} onChangeText={setSecurityAnswer} />
      <View style={styles.captchaRow}>
        <Text style={styles.captchaText}>{captchaQuestion}</Text>
        <TouchableOpacity onPress={() => void loadCaptcha()}><Text style={styles.refreshText}>Cambiar</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="Resultado del captcha" placeholderTextColor="#9FB3C8" keyboardType="number-pad" value={captchaAnswer} onChangeText={setCaptchaAnswer} />
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
    </ScrollView>
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
  label: { fontSize: 13, fontWeight: '600', color: '#486581', marginBottom: 8 },
  questionOption: { borderWidth: 1, borderColor: '#C9D7E8', borderRadius: 10, padding: 11, marginBottom: 8 },
  questionOptionActive: { borderColor: '#29B6FF', backgroundColor: '#EAF7FF' },
  questionOptionText: { color: '#071120' },
  captchaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#EAF7FF', marginBottom: 10 },
  captchaText: { color: '#071120', fontSize: 18, fontWeight: '700' },
  refreshText: { color: '#0A6FA8', fontWeight: '600' },
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
