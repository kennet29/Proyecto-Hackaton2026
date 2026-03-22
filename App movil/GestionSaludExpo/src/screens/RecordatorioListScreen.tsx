import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

type Recordatorio = {
  recordatoriocitaid: number;
  citaid: number;
  pacienteid: number;
  fecharecordatorio: string;
  mensaje: string;
  canal?: string;
  estado?: string;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export function RecordatorioListScreen() {
  const [data, setData] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/recordatoriocita`, { headers });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'no se pudieron obtener los recordatorios');
      }
      const body = await response.json();
      setData(Array.isArray(body) ? body : []);
    } catch (error) {
      Alert.alert('error', error instanceof Error ? error.message : 'fallo la consulta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Recordatorio }) => (
    <View style={styles.card}>
      <Text style={styles.title}>recordatorio #{item.recordatoriocitaid}</Text>
      <Text style={styles.text}>cita: {item.citaid}</Text>
      <Text style={styles.text}>paciente: {item.pacienteid}</Text>
      <Text style={styles.text}>fecha: {new Date(item.fecharecordatorio).toLocaleString()}</Text>
      <Text style={styles.text}>mensaje: {item.mensaje}</Text>
      <Text style={styles.text}>canal: {item.canal ?? 'sin especificar'}</Text>
      <Text style={styles.text}>estado: {item.estado ?? 'pendiente'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>recordatorios programados</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.recordatoriocitaid.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#fff" />}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>aun no tienes recordatorios registrados</Text> : null
        }
      />
      <TouchableOpacity style={styles.reloadBtn} onPress={fetchData} disabled={loading}>
        <Text style={styles.reloadText}>{loading ? 'actualizando...' : 'actualizar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    color: '#cbd5f5',
    marginBottom: 2,
  },
  empty: {
    color: '#cbd5f5',
    textAlign: 'center',
    marginTop: 40,
  },
  reloadBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  reloadText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
});
