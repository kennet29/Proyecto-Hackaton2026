/**
 * @file App movil/GestionSaludExpo/src/screens/PacienteFormScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { fetchLinkedPatients as fetchLinkedPatientsList, invalidateLinkedPatientsCache } from '../utils/linkedPatients';
import { apiFetch } from '../utils/apiClient';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteForm'>;

type LinkedPatient = {
  relationId?: number;
  pacienteId: number;
  nombreCompleto: string;
  sexo?: string | null;
  contacto?: string | null;
  parentesco?: string | null;
};

export function PacienteFormScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token } = useAuth();
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<LinkedPatient | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
          relationId: item.relationId,
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

  const requestDelete = useCallback((patient: LinkedPatient) => {
    if (deletingPatientId === null) setDeleteCandidate(patient);
  }, [deletingPatientId]);

  const confirmDelete = useCallback(async () => {
    if (!deleteCandidate || deletingPatientId !== null) return;
    const patient = deleteCandidate;
    setDeletingPatientId(patient.pacienteId);
    try {
      const response = await apiFetch(`/paciente/${patient.pacienteId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudo eliminar el paciente.');
      invalidateLinkedPatientsCache(authHeaders);
      setLinkedPatients((current) => current.filter((item) => item.pacienteId !== patient.pacienteId));
      setToast({ type: 'success', message: 'Paciente eliminado de la base de datos.' });
    } catch (error) {
      setToast({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo eliminar el paciente.' });
    } finally {
      setDeletingPatientId(null);
      setDeleteCandidate(null);
    }
  }, [authHeaders, deletingPatientId]);

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
            <Ionicons name="add" size={28} color={colors.text} />
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
            <ActivityIndicator size="large" color={colors.info} />
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
          <View
            key={patient.pacienteId}
            style={styles.patientCard}
          >
            <View style={styles.patientCardHeader}>
              <View style={styles.patientIcon}>
                <Ionicons name="person-outline" size={22} color={colors.info} />
              </View>
              <View style={styles.patientMain}>
                <AppText style={styles.patientName}>{patient.nombreCompleto}</AppText>
                <AppText style={styles.patientId}>ID #{patient.pacienteId}</AppText>
              </View>
              <TouchableOpacity
                style={styles.cardAction}
                onPress={() => navigation.navigate('PacienteEditor', { pacienteId: patient.pacienteId })}
                accessibilityLabel={`Editar ${patient.nombreCompleto}`}
              >
                <Ionicons name="create-outline" size={22} color={colors.info} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardAction, styles.deleteAction]}
                onPress={() => requestDelete(patient)}
                disabled={deletingPatientId === patient.pacienteId}
                accessibilityLabel={`Eliminar ${patient.nombreCompleto}`}
              >
                {deletingPatientId === patient.pacienteId
                  ? <ActivityIndicator size="small" color={colors.accent} />
                  : <Ionicons name="trash-outline" size={21} color={colors.accent} />}
              </TouchableOpacity>
            </View>
            {patient.sexo ? <AppText style={styles.patientMeta}>Genero: {patient.sexo}</AppText> : null}
            {patient.parentesco ? <AppText style={styles.patientMeta}>Parentesco: {patient.parentesco}</AppText> : null}
            {patient.contacto ? <AppText style={styles.patientMeta}>Contacto: {patient.contacto}</AppText> : null}
          </View>
        ))}
      </ScrollView>
      <Modal visible={Boolean(deleteCandidate)} transparent animationType="fade" onRequestClose={() => !deletingPatientId && setDeleteCandidate(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Ionicons name="trash-outline" size={26} color="#DC2626" /></View>
            <AppText style={styles.modalTitle}>¿Eliminar paciente?</AppText>
            <AppText style={styles.modalText}>Se eliminará a {deleteCandidate?.nombreCompleto} de la base de datos. Esta acción no se puede deshacer.</AppText>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteCandidate(null)} disabled={Boolean(deletingPatientId)}><AppText style={styles.cancelButtonText}>Cancelar</AppText></TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={() => void confirmDelete()} disabled={Boolean(deletingPatientId)}>
                {deletingPatientId ? <ActivityIndicator color="#FFFFFF" /> : <AppText style={styles.confirmDeleteText}>Eliminar</AppText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {toast ? <TouchableOpacity style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]} onPress={() => setToast(null)} accessibilityRole="alert">
        <Ionicons name={toast.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={22} color="#FFFFFF" />
        <AppText style={styles.toastText}>{toast.message}</AppText>
        <Ionicons name="close" size={18} color="#FFFFFF" />
      </TouchableOpacity> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  subtitle: {
    color: colors.textSoft,
    marginTop: 4,
    maxWidth: 240,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.info,
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
    color: colors.text,
  },
  linkText: {
    color: colors.info,
    fontWeight: '800',
  },
  errorText: {
    color: colors.accent,
    marginBottom: 12,
  },
  loadingCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSoft,
    marginTop: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textSoft,
  },
  patientCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    backgroundColor: `${colors.info}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientMain: {
    flex: 1,
  },
  cardAction: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  deleteAction: {
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(2, 12, 27, 0.68)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginBottom: 14,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  modalText: { color: colors.textSoft, fontSize: 14, lineHeight: 21 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelButton: { paddingHorizontal: 16, minHeight: 42, justifyContent: 'center', borderRadius: 11, backgroundColor: colors.backgroundMuted },
  cancelButtonText: { color: colors.text, fontWeight: '800' },
  confirmDeleteButton: { minWidth: 104, minHeight: 42, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#DC2626' },
  confirmDeleteText: { color: '#FFFFFF', fontWeight: '900' },
  toast: { position: 'absolute', right: 20, bottom: 20, maxWidth: 470, minHeight: 56, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 8 },
  toastSuccess: { backgroundColor: '#15803D' },
  toastError: { backgroundColor: '#B91C1C' },
  toastText: { flex: 1, color: '#FFFFFF', fontWeight: '700', fontSize: 13, lineHeight: 18 },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  patientId: {
    color: colors.textSoft,
    marginTop: 2,
  },
  patientMeta: {
    color: colors.textSoft,
    marginBottom: 2,
  },
});
