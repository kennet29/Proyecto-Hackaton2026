import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


export function PacienteFormScreen() {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombres || !form.apellidos) {
      Alert.alert('Faltan Datos', 'Nombres y apellidos son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/paciente`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nombres: form.nombres,
          apellidos: form.apellidos,
          telefono: form.telefono || undefined,
          email: form.email || undefined,
          fechanacimiento: form.fechaNacimiento || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Error al crear paciente');
      }
      Alert.alert('Paciente Registrado', 'El paciente se guardo correctamente');
      setForm({ nombres: '', apellidos: '', telefono: '', email: '', fechaNacimiento: '' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo Paciente</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={form.nombres}
        onChangeText={(value) => handleChange('nombres', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={form.apellidos}
        onChangeText={(value) => handleChange('apellidos', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefono"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(value) => handleChange('telefono', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(value) => handleChange('email', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Nacimiento (YYYY-MM-DD)"
        value={form.fechaNacimiento}
        onChangeText={(value) => handleChange('fechaNacimiento', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Paciente</Text>
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
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
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
