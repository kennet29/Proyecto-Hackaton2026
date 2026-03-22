import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function CitaFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: '',
    especialidad: '',
    motivo: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha) {
      Alert.alert('faltan datos', 'paciente y fecha son requeridos');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/citamedica`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          fechacita: form.fecha,
          especialidad: form.especialidad || undefined,
          motivo: form.motivo || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo agendar la cita');
      }
      Alert.alert('cita creada', 'la cita quedo registrada');
      setForm({ pacienteId: '', fecha: '', especialidad: '', motivo: '' });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la peticion');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>programar cita</Text>
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha (YYYY-MM-DDTHH:MM)"
        value={form.fecha}
        onChangeText={(value) => handleChange('fecha', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="especialidad"
        value={form.especialidad}
        onChangeText={(value) => handleChange('especialidad', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="motivo"
        value={form.motivo}
        onChangeText={(value) => handleChange('motivo', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar cita</Text>
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
  primaryBtn: {
    backgroundColor: '#22c55e',
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
