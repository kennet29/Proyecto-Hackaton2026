import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteForm'>;

type LinkedPatient = {
  relationId: number;
  pacienteId: number;
  nombreCompleto: string;
  sexo?: string | null;
  contacto?: string | null;
  parentesco?: string | null;
};

export function PacienteFormScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchLinkedPatients = useCallback(async () => {
    if (!token) {
      setLinkedPatients([]);
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
      const relationsBody = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relationsBody?.message ?? 'No se pudieron consultar tus personas registradas.');
      }

      const relations: any[] = Array.isArray(relationsBody) ? relationsBody : [];
      const enriched = await Promise.all(
        relations.map(async (relation) => {
          const pacienteId = Number(
            relation?.pacienteId ??
              relation?.pacienteid ??
              relation?.id ??
              relation?.paciente?.pacienteId,
          );
          if (!Number.isFinite(pacienteId)) {
            return null;
          }

          let nombreCompleto =
            relation?.displayName ??
            relation?.nombrePaciente ??
            relation?.paciente?.displayName ??
            `Paciente #${pacienteId}`;
          let sexo = relation?.sexo ?? relation?.paciente?.sexo ?? null;
          let contacto = relation?.telefono ?? relation?.email ?? null;

          try {
            const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
              headers: authHeaders,
            });
            const patientBody = await patientResponse.json().catch(() => null);
            if (patientBody && patientResponse.ok) {
              const nombre = patientBody?.nombres ?? '';
              const apellido = patientBody?.apellidos ?? '';
              nombreCompleto = `${nombre} ${apellido}`.trim() || nombreCompleto;
              sexo = patientBody?.sexo ?? sexo;
              contacto = patientBody?.telefono ?? patientBody?.email ?? contacto;
            }
          } catch {
            // Se mantiene el dato de la relacion si el detalle del paciente falla.
          }

          return {
            relationId:
              relation?.id ??
              relation?.usuariopacienteid ??
              relation?.usuarioPacienteId ??
              pacienteId,
            pacienteId,
            nombreCompleto,
            sexo,
            contacto,
            parentesco: relation?.parentesco ?? null,
          } as LinkedPatient;
        }),
      );
      setLinkedPatients(enriched.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setPatientLoadError(
        error instanceof Error ? error.message : 'No se pudieron cargar las personas del usuario.',
      );
      setLinkedPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  useFocusEffect(
    useCallback(() => {
      fetchLinkedPatients();
    }, [fetchLinkedPatients]),
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pacientes</Text>
            <Text style={styles.subtitle}>Administra las personas vinculadas a tu cuenta.</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PacienteEditor')}
            accessibilityLabel="Crear paciente"
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pacientes de este usuario</Text>
          <TouchableOpacity onPress={fetchLinkedPatients} disabled={loadingPatients}>
            <Text style={styles.linkText}>{loadingPatients ? 'Cargando...' : 'Actualizar'}</Text>
          </TouchableOpacity>
        </View>

        {patientLoadError ? <Text style={styles.errorText}>{patientLoadError}</Text> : null}

        {loadingPatients ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando pacientes...</Text>
          </View>
        ) : null}

        {!loadingPatients && linkedPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay pacientes vinculados</Text>
            <Text style={styles.emptyText}>Usa el boton + para registrar el primero.</Text>
          </View>
        ) : null}

        {linkedPatients.map((patient) => (
          <TouchableOpacity
            key={patient.relationId}
            style={styles.patientCard}
            onPress={() => navigation.navigate('PacienteEditor', { pacienteId: patient.pacienteId })}
          >
            <View style={styles.patientCardHeader}>
              <View style={styles.patientIcon}>
                <Ionicons name="person-outline" size={22} color="#2563eb" />
              </View>
              <View style={styles.patientMain}>
                <Text style={styles.patientName}>{patient.nombreCompleto}</Text>
                <Text style={styles.patientId}>ID #{patient.pacienteId}</Text>
              </View>
              <Ionicons name="create-outline" size={22} color="#2563eb" />
            </View>
            {patient.sexo ? <Text style={styles.patientMeta}>Genero: {patient.sexo}</Text> : null}
            {patient.parentesco ? <Text style={styles.patientMeta}>Parentesco: {patient.parentesco}</Text> : null}
            {patient.contacto ? <Text style={styles.patientMeta}>Contacto: {patient.contacto}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
    maxWidth: 240,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 12,
  },
  loadingCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  loadingText: {
    color: '#334155',
    marginTop: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 18,
  },
  emptyTitle: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    color: '#64748b',
  },
  patientCard: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  patientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientMain: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  patientId: {
    color: '#64748b',
    marginTop: 2,
  },
  patientMeta: {
    color: '#334155',
    marginBottom: 2,
  },
});
