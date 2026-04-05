import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


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
      Alert.alert('Faltan Datos', 'Paciente, nombre y fecha de inicio son obligatorios');
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
        throw new Error(body?.message ?? 'No se pudo registrar la medicacion');
      }
      Alert.alert('Medicacion Guardada', 'Se agrego a los horarios');
      setForm({ pacienteId: '', nombre: '', dosis: '', via: '', fechaInicio: '', fechaFin: '' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Prescripcion</Text>
      <TextInput
        style={styles.input}
        placeholder="Paciente ID"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre Medicamento"
        value={form.nombre}
        onChangeText={(value) => handleChange('nombre', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Dosis (Ej. 500mg)"
        value={form.dosis}
        onChangeText={(value) => handleChange('dosis', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Via Administracion"
        value={form.via}
        onChangeText={(value) => handleChange('via', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Inicio (YYYY-MM-DD)"
        value={form.fechaInicio}
        onChangeText={(value) => handleChange('fechaInicio', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Fin (Opcional)"
        value={form.fechaFin}
        onChangeText={(value) => handleChange('fechaFin', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Medicacion</Text>
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
