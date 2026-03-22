import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function RegistroDentalFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    fechaAtencion: '',
    procedimiento: '',
    diagnostico: '',
    odontologo: '',
    piezasTratadas: '',
    notas: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fechaAtencion || !form.procedimiento) {
      Alert.alert('faltan datos', 'paciente, fecha y procedimiento son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/registrodental`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          fechaatencion: form.fechaAtencion,
          procedimiento: form.procedimiento,
          diagnostico: form.diagnostico || undefined,
          odontologo: form.odontologo || undefined,
          piezastratadas: form.piezasTratadas || undefined,
          notas: form.notas || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo registrar la atencion dental');
      }
      Alert.alert('registro guardado', 'se agrego la atencion dental');
      setForm({
        pacienteId: '',
        fechaAtencion: '',
        procedimiento: '',
        diagnostico: '',
        odontologo: '',
        piezasTratadas: '',
        notas: '',
      });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>registro dental</Text>
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="fecha atencion (YYYY-MM-DDTHH:MM)"
        value={form.fechaAtencion}
        onChangeText={(value) => handleChange('fechaAtencion', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="procedimiento"
        value={form.procedimiento}
        onChangeText={(value) => handleChange('procedimiento', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="diagnostico"
        value={form.diagnostico}
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="odontologo"
        value={form.odontologo}
        onChangeText={(value) => handleChange('odontologo', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="piezas tratadas"
        value={form.piezasTratadas}
        onChangeText={(value) => handleChange('piezasTratadas', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="notas"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar registro</Text>
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
    height: 120,
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
