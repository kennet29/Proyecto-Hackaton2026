/**
 * @file App movil/GestionSaludExpo/src/screens/PacienteFormScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { fetchLinkedPatients as fetchLinkedPatientsList } from '../utils/linkedPatients';

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
      const items = await fetchLinkedPatientsList(authHeaders, { forceRefresh: true });
      setLinkedPatients(
        items.map((item) => ({
          relationId: item.pacienteId,
          pacienteId: item.pacienteId,
          nombreCompleto: item.displayName,
          sexo: item.sexo ?? null,
          contacto: item.contacto ?? null,
          parentesco: item.parentesco ?? null,
        })),
      );
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
            <AppText style={styles.title}>Pacientes</AppText>
            <AppText style={styles.subtitle}>Administra las personas vinculadas a tu cuenta.</AppText>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PacienteEditor')}
            accessibilityLabel="Crear paciente"
          >
            <Ionicons name="add" size={28} color="#F4F8FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Pacientes de este usuario</AppText>
          <TouchableOpacity onPress={fetchLinkedPatients} disabled={loadingPatients}>
            <AppText style={styles.linkText}>{loadingPatients ? 'Cargando...' : 'Actualizar'}</AppText>
          </TouchableOpacity>
        </View>

        {patientLoadError ? <AppText style={styles.errorText}>{patientLoadError}</AppText> : null}

        {loadingPatients ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#29B6FF" />
            <AppText style={styles.loadingText}>Cargando pacientes...</AppText>
          </View>
        ) : null}

        {!loadingPatients && linkedPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>No hay pacientes vinculados</AppText>
            <AppText style={styles.emptyText}>Usa el boton + para registrar el primero.</AppText>
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
                <Ionicons name="person-outline" size={22} color="#29B6FF" />
              </View>
              <View style={styles.patientMain}>
                <AppText style={styles.patientName}>{patient.nombreCompleto}</AppText>
                <AppText style={styles.patientId}>ID #{patient.pacienteId}</AppText>
              </View>
              <Ionicons name="create-outline" size={22} color="#29B6FF" />
            </View>
            {patient.sexo ? <AppText style={styles.patientMeta}>Genero: {patient.sexo}</AppText> : null}
            {patient.parentesco ? <AppText style={styles.patientMeta}>Parentesco: {patient.parentesco}</AppText> : null}
            {patient.contacto ? <AppText style={styles.patientMeta}>Contacto: {patient.contacto}</AppText> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: '#071120',
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
    color: '#F4F8FF',
  },
  subtitle: {
    color: '#C9D7E8',
    marginTop: 4,
    maxWidth: 240,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#29B6FF',
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
    fontWeight: '800',
    color: '#F4F8FF',
  },
  linkText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
  },
  loadingCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  loadingText: {
    color: '#C9D7E8',
    marginTop: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
  },
  emptyTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    color: '#C9D7E8',
  },
  patientCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    backgroundColor: '#132238',
    borderRadius: 18,
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
    backgroundColor: '#29B6FF18',
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
    color: '#F4F8FF',
  },
  patientId: {
    color: '#C9D7E8',
    marginTop: 2,
  },
  patientMeta: {
    color: '#C9D7E8',
    marginBottom: 2,
  },
});
