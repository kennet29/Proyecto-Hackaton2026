import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Consulta = {
  consultaId: number;
  pacienteId: number;
  fechaconsulta: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaList'>;

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

export function ConsultaListScreen({ navigation }: Props) {
  const [data, setData] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPacienteId, setFilterPacienteId] = useState('');
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const { token } = useAuth();
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setLoadingPatients(false);
      setPatientLoadError(null);
      return;
    }
    setLoadingPatients(true);
    setPatientLoadError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar las personas');
      }
      const items: (LinkedPatient | null)[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const rawId =
                relation?.pacienteId ??
                relation?.pacienteid ??
                relation?.id ??
                relation?.paciente?.pacienteId;
              const pacienteId = Number(rawId);
              if (!Number.isFinite(pacienteId)) {
                return null;
              }
              let displayName =
                relation?.displayName ??
                relation?.nombrePaciente ??
                relation?.paciente?.displayName ??
                `Paciente #${pacienteId}`;
              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: authHeaders,
                });
                const patient = await patientResponse.json().catch(() => null);
                if (patient && patientResponse.ok) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const combined = `${nombres} ${apellidos}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // ignorar errores individuales
              }
              return {
                pacienteId,
                displayName,
              };
            }),
          )
        : [];
      setPatientOptions(items.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setPatientLoadError(error instanceof Error ? error.message : 'Falló al cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const fetchData = useCallback(async (pacienteId?: string) => {
    try {
      setLoading(true);
      const query = pacienteId ? `?pacienteId=${pacienteId}` : '';
      const response = await fetch(`${API_URL}/consultamedica${query}`, { headers: authHeaders });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudieron obtener las consultas');
      }
      const body = await response.json();
      const validData = Array.isArray(body)
        ? body.filter((item) => item && typeof item === 'object' && item.consultaId)
        : [];
      const sortedData = validData.sort((a, b) => {
        const aDate = a.fechaconsulta ? new Date(a.fechaconsulta).getTime() : 0;
        const bDate = b.fechaconsulta ? new Date(b.fechaconsulta).getTime() : 0;
        return bDate - aDate;
      });
      setData(sortedData);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la consulta');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const applyFilter = () => {
    fetchData(filterPacienteId || undefined);
  };

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const renderItem = ({ item }: { item: Consulta }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ConsultaForm', { consulta: item })}>
      <Text style={styles.title}>Consulta #{item?.consultaId || 'N/A'}</Text>
      <Text style={styles.text}>
        Paciente: {patientNameById[item.pacienteId] ?? `Paciente #${item?.pacienteId || 'N/A'}`}
      </Text>
      <Text style={styles.text}>
        Fecha: {item?.fechaconsulta ? new Date(item.fechaconsulta).toLocaleString() : 'N/A'}
      </Text>
      <Text style={styles.text}>Motivo: {item?.motivo || 'N/A'}</Text>
      {item?.diagnostico && <Text style={styles.text}>Diagnóstico: {item.diagnostico}</Text>}
      {item?.tratamiento && <Text style={styles.text}>Tratamiento: {item.tratamiento}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Consultas Médicas</Text>
      <View style={styles.filterContainer}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={filterPacienteId}
            onValueChange={(value) => setFilterPacienteId(String(value))}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Todos los pacientes" value="" />
            {patientOptions.map((patient) => (
              <Picker.Item
                key={patient.pacienteId}
                label={patient.displayName}
                value={String(patient.pacienteId)}
              />
            ))}
          </Picker>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={applyFilter} disabled={loadingPatients}>
          <Text style={styles.btnText}>{loadingPatients ? 'Cargando...' : 'Filtrar'}</Text>
        </TouchableOpacity>
      </View>
      {patientLoadError ? <Text style={styles.errorText}>{patientLoadError}</Text> : null}
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.consultaId?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchData(filterPacienteId || undefined)}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Aún no tienes consultas registradas</Text> : null
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ConsultaForm')}>
        <Text style={styles.fabText}>+</Text>
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
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginRight: 12,
  },
  picker: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  filterBtn: {
    backgroundColor: '#64748b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorText: {
    color: '#fecaca',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 50,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
