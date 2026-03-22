import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function MedicacionFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    nombre: '',
    dosis: '',
    via: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.nombre || !form.fechaInicio) {
      Alert.alert('faltan datos', 'paciente, nombre y fecha de inicio son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/medicacion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          nombremedicamento: form.nombre,
          dosis: form.dosis || undefined,
          viaadministracion: form.via || undefined,
          fechainicio: form.fechaInicio,
          fechafin: form.fechaFin || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo registrar la medicacion');
      }
      Alert.alert('medicacion guardada', 'se agrego a los horarios');
      setForm({ pacienteId: '', nombre: '', dosis: '', via: '', fechaInicio: '', fechaFin: '' });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>prescripcion</Text>
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="nombre medicamento"
        value={form.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="dosis (ej. 500mg)"
        value={form.dosis}
        onChangeText={(value) => handleChange('dosis', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="via administracion"
        value={form.via}
        onChangeText={(value) => handleChange('via', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha inicio (YYYY-MM-DD)"
        value={form.fechaInicio}
        onChangeText={(value) => handleChange('fechaInicio', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha fin (opcional)"
        value={form.fechaFin}
        onChangeText={(value) => handleChange('fechaFin', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar medicacion</Text>
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
    backgroundColor: '#a855f7',
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
