import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


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
      Alert.alert('Faltan Datos', 'Paciente y tipo de documento son obligatorios');
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
        throw new Error(body?.message ?? 'No se pudo cargar el documento');
      }
      Alert.alert('Documento Guardado', 'Se adjunto al expediente');
      setForm({ pacienteId: '', tipoDocumentoId: '', entidadOrigen: 'general', notas: '', url: '' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'FallÃ³ la peticiÃ³n');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Documento Clinico</Text>
      <TextInput
        style={styles.input}
        placeholder="Paciente ID"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Tipo Documento ID"
        keyboardType="numeric"
        value={form.tipoDocumentoId}
        onChangeText={(value) => handleChange('tipoDocumentoId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Entidad De Origen (consultamedica, vacuna, general)"
        value={form.entidadOrigen}
        onChangeText={(value) => handleChange('entidadOrigen', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="URL Externa (Opcional)"
        value={form.url}
        onChangeText={(value) => handleChange('url', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Notas"
        value={form.notas}
        multiline
        onChangeText={(value) => handleChange('notas', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Documento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#071120',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#F4F8FF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#FF4D73',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
});
