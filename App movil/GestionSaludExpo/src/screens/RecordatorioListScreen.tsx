import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Recordatorio = {
  recordatoriocitaid: number;
  citaid: number;
  pacienteid: number;
  fecharecordatorio: string;
  mensaje: string;
  canal?: string;
  estado?: string;
};


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
        throw new Error(body?.message ?? 'No se pudieron obtener los recordatorios');
      }
      const body = await response.json();
      setData(Array.isArray(body) ? body : []);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la consulta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Recordatorio }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Recordatorio #{item.recordatoriocitaid}</Text>
      <Text style={styles.text}>Cita: {item.citaid}</Text>
      <Text style={styles.text}>Paciente: {item.pacienteid}</Text>
      <Text style={styles.text}>Fecha: {new Date(item.fecharecordatorio).toLocaleString()}</Text>
      <Text style={styles.text}>Mensaje: {item.mensaje}</Text>
      <Text style={styles.text}>Canal: {item.canal ?? 'sin especificar'}</Text>
      <Text style={styles.text}>Estado: {item.estado ?? 'pendiente'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recordatorios Programados</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.recordatoriocitaid.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#F4F8FF" />}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Aun no tienes recordatorios registrados</Text> : null
        }
      />
      <TouchableOpacity style={styles.reloadBtn} onPress={fetchData} disabled={loading}>
        <Text style={styles.reloadText}>{loading ? 'Actualizando...' : 'Actualizar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#071120',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F4F8FF',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: '#F4F8FF',
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    color: '#C9D7E8',
    marginBottom: 2,
  },
  empty: {
    color: '#C9D7E8',
    textAlign: 'center',
    marginTop: 40,
  },
  reloadBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  reloadText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '700',
  },
});
