import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function ConsultaFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    fecha: '',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha || !form.motivo) {
      Alert.alert('faltan datos', 'paciente, fecha y motivo son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/consultamedica`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          fechaconsulta: form.fecha,
          motivo: form.motivo,
          diagnostico: form.diagnostico || undefined,
          tratamiento: form.tratamiento || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo guardar la consulta');
      }
      Alert.alert('consulta guardada', 'se registro la atencion');
      setForm({ pacienteId: '', fecha: '', motivo: '', diagnostico: '', tratamiento: '' });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la peticion');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>registrar consulta</Text>
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha (YYYY-MM-DD)"
        value={form.fecha}
        onChangeText={(value) => handleChange('fecha', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="motivo"
        value={form.motivo}
        onChangeText={(value) => handleChange('motivo', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="diagnostico"
        value={form.diagnostico}
        multiline
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="tratamiento"
        value={form.tratamiento}
        multiline
        onChangeText={(value) => handleChange('tratamiento', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar consulta</Text>
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
    backgroundColor: '#0ea5e9',
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
