import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';


export function RecordatorioFormScreen() {
  const [form, setForm] = useState({
    citaId: '',
    pacienteId: '',
    fecha: '',
    mensaje: 'recordatorio de cita',
    canal: '',
  });
  const { token, user } = useAuth();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.citaId || !form.pacienteId || !form.fecha || !form.mensaje) {
      Alert.alert('Faltan Datos', 'Cita, paciente, fecha y mensaje son obligatorios');
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/recordatoriocita`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          citaid: Number(form.citaId),
          pacienteid: Number(form.pacienteId),
          fecharecordatorio: form.fecha,
          mensaje: form.mensaje,
          canal: form.canal || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo crear el recordatorio');
      }
      Alert.alert('Recordatorio Creado', 'Se notificara al paciente conforme al canal elegido');
      setForm({ citaId: '', pacienteId: '', fecha: '', mensaje: 'recordatorio de cita', canal: '' });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la solicitud');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo Recordatorio</Text>
      <TextInput
        style={styles.input}
        placeholder="Cita ID"
        keyboardType="numeric"
        value={form.citaId}
        onChangeText={(value) => handleChange('citaId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Paciente ID"
        keyboardType="numeric"
        value={form.pacienteId}
        onChangeText={(value) => handleChange('pacienteId', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha Recordatorio (YYYY-MM-DDTHH:MM)"
        value={form.fecha}
        onChangeText={(value) => handleChange('fecha', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Mensaje"
        value={form.mensaje}
        multiline
        onChangeText={(value) => handleChange('mensaje', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Canal (SMS, email, push)"
        value={form.canal}
        onChangeText={(value) => handleChange('canal', value)}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Guardar Recordatorio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#f8fafc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
});
