import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function RecordatorioFormScreen() {
  const [form, setForm] = useState({
    citaId: '',
    pacienteId: '',
    fecha: '',
    mensaje: 'recordatorio de cita',
    canal: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.citaId || !form.pacienteId || !form.fecha || !form.mensaje) {
      Alert.alert('faltan datos', 'cita, paciente, fecha y mensaje son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/recordatoriocita`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          citaid: Number(form.citaId),
          pacienteid: Number(form.pacienteId),
          fecharecordatorio: form.fecha,
          mensaje: form.mensaje,
          canal: form.canal || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo crear el recordatorio');
      }
      Alert.alert('recordatorio creado', 'se notificara al paciente conforme al canal elegido');
      setForm({ citaId: '', pacienteId: '', fecha: '', mensaje: 'recordatorio de cita', canal: '' });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>nuevo recordatorio</Text>
      <TextInput
        style={styles.input}
        placeholder="cita id"
        keyboardType="numeric"
        value={form.citaId}
        onChangeText={(value) => handleChange('citaId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha recordatorio (YYYY-MM-DDTHH:MM)"
        value={form.fecha}
        onChangeText={(value) => handleChange('fecha', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="mensaje"
        value={form.mensaje}
        multiline
        onChangeText={(value) => handleChange('mensaje', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="canal (sms, email, push)"
        value={form.canal}
        onChangeText={(value) => handleChange('canal', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar recordatorio</Text>
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
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#14b8a6',
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
