import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


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
      Alert.alert('Faltan Datos', 'Paciente, fecha y procedimiento son obligatorios');
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
        throw new Error(body?.message ?? 'No se pudo registrar la atencion dental');
      }
      Alert.alert('Registro Guardado', 'Se agrego la atencion dental');
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro Dental</Text>
      <TextInput
        style={styles.input}
        placeholder="Paciente ID"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Atencion (YYYY-MM-DDTHH:MM)"
        value={form.fechaAtencion}
        onChangeText={(value) => handleChange('fechaAtencion', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Procedimiento"
        value={form.procedimiento}
        onChangeText={(value) => handleChange('procedimiento', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Diagnostico"
        value={form.diagnostico}
        onChangeText={(value) => handleChange('diagnostico', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Odontologo"
        value={form.odontologo}
        onChangeText={(value) => handleChange('odontologo', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Piezas Tratadas"
        value={form.piezasTratadas}
        onChangeText={(value) => handleChange('piezasTratadas', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Registro</Text>
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
