import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import {
  fetchLinkedPatients as fetchLinkedPatientsList,
  invalidateLinkedPatientsCache,
} from '../utils/linkedPatients';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpedienteGestion'>;

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

type LinkedPerson = {
  relationId: number;
  pacienteId: number;
  parentesco?: string | null;
  esPrincipal: boolean;
  notas?: string | null;
  nombreCompleto: string;
  contacto?: string | null;
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo completar la accion. Intenta nuevamente.';
};

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  if (!feedback) return null;
  const isSuccess = feedback.type === 'success';
  return (
    <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
      <Ionicons
        name={isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={18}
        color={isSuccess ? '#38F28E' : '#FF4D73'}
      />
      <Text style={styles.feedbackText}>{feedback.message}</Text>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <View style={[styles.statCard, { borderColor: `${accent}40`, backgroundColor: `${accent}12` }]}>
    <View style={[styles.statAccentBar, { backgroundColor: accent }]} />
    <Text style={[styles.statValue, { color: accent }]} numberOfLines={2}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export function ExpedienteGestionScreen({ navigation }: Props) {
  const { user, token } = useAuth();
  const [linkedPatients, setLinkedPatients] = useState<LinkedPerson[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientFeedback, setPatientFeedback] = useState<FeedbackState>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [submittingPerson, setSubmittingPerson] = useState(false);

  const emptyForm = useMemo(
    () => ({
      nombres: '',
      apellidos: '',
      telefono: '',
      email: '',
      parentesco: '',
      notas: '',
      esPrincipal: linkedPatients.length === 0,
    }),
    [linkedPatients.length],
  );

  const [personForm, setPersonForm] = useState(emptyForm);

  useEffect(() => {
    setPersonForm((prev) => ({
      ...prev,
      esPrincipal: linkedPatients.length === 0,
    }));
  }, [linkedPatients.length]);

  const displayName = user?.username?.split('@')[0] ?? 'Paciente';
  const principalCount = linkedPatients.filter((person) => person.esPrincipal).length;

  const authHeaders = useCallback(
    (extra?: Record<string, string>) => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra ?? {}),
    }),
    [token],
  );

  const fetchLinkedPatients = useCallback(async () => {
    if (!token) {
      setLinkedPatients([]);
      setLoadingPatients(false);
      return;
    }

    setLoadingPatients(true);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders(),
      });
      const relationsBody = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relationsBody?.message ?? 'No se pudieron consultar tus personas registradas.');
      }
      const relations: any[] = Array.isArray(relationsBody) ? relationsBody : [];
      const linkedItems = await fetchLinkedPatientsList(authHeaders(), { forceRefresh: true });
      const linkedItemsById = new Map(linkedItems.map((item) => [item.pacienteId, item]));

      setLinkedPatients(
        relations
          .map((relation) => {
            const pacienteId = Number(relation?.pacienteId);
            if (!Number.isFinite(pacienteId) || pacienteId <= 0) {
              return null;
            }

            const linkedItem = linkedItemsById.get(pacienteId);

            return {
              relationId:
                relation.id ??
                relation.usuariopacienteid ??
                relation.usuarioPacienteId ??
                relation.pacienteId,
              pacienteId,
              parentesco: relation.parentesco ?? linkedItem?.parentesco ?? null,
              esPrincipal: Boolean(relation.esPrincipal),
              notas: relation.notas ?? null,
              nombreCompleto: linkedItem?.displayName ?? `Paciente #${pacienteId}`,
              contacto: linkedItem?.contacto ?? null,
            } as LinkedPerson;
          })
          .filter((item): item is LinkedPerson => Boolean(item)),
      );
    } catch (error) {
      setPatientFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchLinkedPatients();
  }, [fetchLinkedPatients]);

  const handlePersonInput = (key: keyof typeof personForm, value: string | boolean) => {
    setPersonForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPersonForm = () => setPersonForm(emptyForm);

  const handleCreatePerson = async () => {
    setPatientFeedback(null);

    if (!personForm.nombres.trim() || !personForm.apellidos.trim()) {
      setPatientFeedback({ type: 'error', message: 'Nombres y apellidos son obligatorios.' });
      return;
    }

    if (!token) {
      setPatientFeedback({ type: 'error', message: 'Inicia sesion nuevamente para crear personas.' });
      return;
    }

    setSubmittingPerson(true);
    try {
      const pacienteResponse = await fetch(`${API_URL}/paciente`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          nombres: personForm.nombres.trim(),
          apellidos: personForm.apellidos.trim(),
          telefono: personForm.telefono.trim() || undefined,
          email: personForm.email.trim() || undefined,
          direccion: undefined,
          creadopor: user?.username ?? undefined,
        }),
      });

      const pacienteBody = await pacienteResponse.json().catch(() => null);
      if (!pacienteResponse.ok) {
        throw new Error(pacienteBody?.message ?? 'No se pudo crear la persona.');
      }

      const pacienteId =
        pacienteBody?.pacienteId ??
        pacienteBody?.pacienteid ??
        pacienteBody?.id ??
        pacienteBody?.paciente?.pacienteId;

      if (!pacienteId) {
        throw new Error('El backend no devolvio el identificador del paciente.');
      }

      const relationResponse = await fetch(`${API_URL}/usuario-paciente`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          pacienteId,
          parentesco: personForm.parentesco.trim() || undefined,
          esPrincipal: personForm.esPrincipal,
          notas: personForm.notas.trim() || undefined,
        }),
      });

      const relationBody = await relationResponse.json().catch(() => null);
      if (!relationResponse.ok) {
        throw new Error(relationBody?.message ?? 'No se pudo vincular la persona al usuario.');
      }

      setPatientFeedback({ type: 'success', message: 'Persona registrada correctamente.' });
      resetPersonForm();
      setShowPersonForm(false);
      invalidateLinkedPatientsCache(authHeaders());
      fetchLinkedPatients();
    } catch (error) {
      setPatientFeedback({ type: 'error', message: formatErrorMessage(error) });
    } finally {
      setSubmittingPerson(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="folder-open-outline" size={16} color="#29B6FF" />
            <Text style={styles.heroBadgeText}>Expediente</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Personas asociadas al expediente</Text>
        <Text style={styles.heroSubtitle}>
          Crea y administra familiares o pacientes vinculados a tu cuenta desde una sola vista.
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            label="Personas"
            value={String(linkedPatients.length)}
            accent="#29B6FF"
          />
          <StatCard
            label="Principal"
            value={principalCount > 0 ? String(principalCount) : '0'}
            accent="#38F28E"
          />
          <StatCard
            label="Usuario"
            value={displayName.slice(0, 10) || 'Paciente'}
            accent="#FF4D73"
          />
        </View>
      </View>

      <View style={styles.panelCard}>
        <View style={styles.panelHeaderRow}>
          <View style={styles.panelHeaderCopy}>
            <Text style={styles.panelTitle}>Personas asociadas</Text>
            <Text style={styles.panelHelper}>
              Crea y administra familiares o pacientes vinculados a tu cuenta.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => {
              setShowPersonForm((prev) => !prev);
              setPatientFeedback(null);
            }}
          >
            <Ionicons
              name={showPersonForm ? 'close-outline' : 'add-outline'}
              size={18}
              color="#071120"
            />
            <Text style={styles.primaryActionText}>
              {showPersonForm ? 'Cerrar' : 'Nueva persona'}
            </Text>
          </TouchableOpacity>
        </View>

        <FeedbackBanner feedback={patientFeedback} />

        {loadingPatients ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#29B6FF" />
            <Text style={styles.stateTitle}>Cargando personas</Text>
            <Text style={styles.stateText}>Estamos consultando tus vinculos registrados.</Text>
          </View>
        ) : linkedPatients.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="people-outline" size={28} color="#29B6FF" />
            <Text style={styles.stateTitle}>Aun no tienes personas vinculadas</Text>
            <Text style={styles.stateText}>
              Crea la primera persona para comenzar a llenar el expediente familiar o personal.
            </Text>
          </View>
        ) : (
          <View style={styles.peopleList}>
            {linkedPatients.map((person) => (
              <View key={`${person.relationId}-${person.pacienteId}`} style={styles.personCard}>
                <View style={styles.personMainRow}>
                  <View style={styles.personAvatar}>
                    <Ionicons name="person-outline" size={20} color="#29B6FF" />
                  </View>
                  <View style={styles.personCopy}>
                    <View style={styles.personTitleRow}>
                      <Text style={styles.personName}>{person.nombreCompleto}</Text>
                      {person.esPrincipal ? (
                        <View style={styles.personBadge}>
                          <Text style={styles.personBadgeText}>Principal</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.personMeta}>
                      ID #{person.pacienteId}
                      {person.parentesco ? ` - ${person.parentesco}` : ''}
                    </Text>
                    {person.contacto ? (
                      <Text style={styles.personContact}>Contacto: {person.contacto}</Text>
                    ) : null}
                    {person.notas ? <Text style={styles.personNotes}>{person.notas}</Text> : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {showPersonForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Registrar nueva persona</Text>
            <Text style={styles.formSubtitle}>
              Completa los datos basicos para vincularla al expediente actual.
            </Text>

            <View style={styles.formGrid}>
              <TextInput
                style={styles.input}
                placeholder="Nombres"
                placeholderTextColor="#9FB3C8"
                value={personForm.nombres}
                onChangeText={(text) => handlePersonInput('nombres', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#9FB3C8"
                value={personForm.apellidos}
                onChangeText={(text) => handlePersonInput('apellidos', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefono"
                placeholderTextColor="#9FB3C8"
                keyboardType="phone-pad"
                value={personForm.telefono}
                onChangeText={(text) => handlePersonInput('telefono', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electronico"
                placeholderTextColor="#9FB3C8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={personForm.email}
                onChangeText={(text) => handlePersonInput('email', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Parentesco o rol"
                placeholderTextColor="#9FB3C8"
                value={personForm.parentesco}
                onChangeText={(text) => handlePersonInput('parentesco', text)}
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Notas"
                placeholderTextColor="#9FB3C8"
                multiline
                textAlignVertical="top"
                value={personForm.notas}
                onChangeText={(text) => handlePersonInput('notas', text)}
              />
            </View>

            <View style={styles.switchCard}>
              <View>
                <Text style={styles.switchTitle}>Marcar como principal</Text>
                <Text style={styles.switchHelper}>Usa esta opcion para la persona central del expediente.</Text>
              </View>
              <Switch
                value={personForm.esPrincipal}
                onValueChange={(value) => handlePersonInput('esPrincipal', value)}
                thumbColor={personForm.esPrincipal ? '#29B6FF' : undefined}
                trackColor={{ false: '#27496D', true: '#1B3355' }}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPerson && styles.submitBtnDisabled]}
              onPress={handleCreatePerson}
              disabled={submittingPerson}
            >
              {submittingPerson ? (
                <ActivityIndicator color="#071120" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#071120" />
                  <Text style={styles.submitBtnText}>Guardar persona</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#182A44',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: '#C9D7E8',
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#182A44',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#FF4D73',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#132238',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#9FB3C8',
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 92,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  statAccentBar: {
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9FB3C8',
    fontSize: 12,
    fontWeight: '700',
  },
  panelCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#C9D7E8',
    gap: 14,
  },
  panelHeaderRow: {
    gap: 12,
  },
  panelHeaderCopy: {
    gap: 4,
  },
  panelTitle: {
    color: '#071120',
    fontSize: 20,
    fontWeight: '800',
  },
  panelHelper: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryActionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38F28E',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: '#071120',
    fontWeight: '800',
    fontSize: 13,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 14,
  },
  feedbackSuccess: {
    backgroundColor: '#38F28E',
  },
  feedbackError: {
    backgroundColor: '#FF4D73',
  },
  feedbackText: {
    flex: 1,
    color: '#F4F8FF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F4F8FF',
  },
  stateTitle: {
    color: '#071120',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: '#9FB3C8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  peopleList: {
    gap: 12,
  },
  personCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C9D7E8',
    gap: 12,
  },
  personMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C9D7E8',
  },
  personCopy: {
    flex: 1,
    gap: 4,
  },
  personTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  personName: {
    color: '#071120',
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  personBadge: {
    backgroundColor: '#38F28E18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  personBadgeText: {
    color: '#38F28E',
    fontSize: 11,
    fontWeight: '800',
  },
  personMeta: {
    color: '#9FB3C8',
    fontSize: 13,
  },
  personContact: {
    color: '#27496D',
    fontSize: 13,
  },
  personNotes: {
    color: '#9FB3C8',
    fontSize: 12,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: '#182A44',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#182A44',
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#C9D7E8',
    fontSize: 13,
    lineHeight: 19,
  },
  formGrid: {
    gap: 10,
  },
  input: {
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#071120',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 92,
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F4F8FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C9D7E8',
  },
  switchTitle: {
    color: '#071120',
    fontSize: 14,
    fontWeight: '700',
  },
  switchHelper: {
    color: '#9FB3C8',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF4D7322',
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FF4D73',
    fontSize: 15,
    fontWeight: '800',
  },
});
