import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function DocumentoFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    tipoDocumentoId: '',
    entidadOrigen: 'general',
    notas: '',
    url: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.tipoDocumentoId) {
      Alert.alert('faltan datos', 'paciente y tipo de documento son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/documentoclinico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          tipodocumentoid: Number(form.tipoDocumentoId),
          entidadorigen: form.entidadOrigen,
          urlexterna: form.url || undefined,
          notas: form.notas || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudo cargar el documento');
      }
      Alert.alert('documento guardado', 'se adjunto al expediente');
      setForm({ pacienteId: '', tipoDocumentoId: '', entidadOrigen: 'general', notas: '', url: '' });
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la peticion');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>documento clinico</Text>
      <TextInput
        style={styles.input}
        placeholder="paciente id"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="tipo documento id"
        keyboardType="numeric"
        value={form.tipoDocumentoId}
        onChangeText={(value) => handleChange('tipoDocumentoId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="entidad de origen (consultamedica, vacuna, general)"
        value={form.entidadOrigen}
        onChangeText={(value) => handleChange('entidadOrigen', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="url externa (opcional)"
        value={form.url}
        onChangeText={(value) => handleChange('url', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="notas"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>guardar documento</Text>
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
    backgroundColor: '#ef4444',
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
