import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


export function VacunaFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    nombre: '',
    fecha: '',
    lote: '',
    proximaDosis: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.nombre || !form.fecha) {
      Alert.alert('Faltan Datos', 'Paciente, nombre y fecha son requeridos');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/vacuna`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          nombre: form.nombre,
          fechaaplicacion: form.fecha,
          lote: form.lote || undefined,
          proximadosis: form.proximaDosis || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar la vacuna');
      }
      Alert.alert('Vacuna Registrada', 'El carnet fue actualizado');
      setForm({ pacienteId: '', nombre: '', fecha: '', lote: '', proximaDosis: '' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar Vacuna</Text>
      <TextInput
        style={styles.input}
        placeholder="Paciente ID"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre Vacuna"
        value={form.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Aplicacion (YYYY-MM-DD)"
        value={form.fecha}
        onChangeText={(value) => handleChange('fecha', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Lote"
        value={form.lote}
        onChangeText={(value) => handleChange('lote', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Proxima Dosis (YYYY-MM-DD)"
        value={form.proximaDosis}
        onChangeText={(value) => handleChange('proximaDosis', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Vacuna</Text>
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
  primaryBtn: {
    backgroundColor: '#f97316',
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
