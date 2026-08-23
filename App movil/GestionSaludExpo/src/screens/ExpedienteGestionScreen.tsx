/**
 * @file App movil/GestionSaludExpo/src/screens/ExpedienteGestionScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';
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

const getInitials = (name: string) =>
  name
    .replace(/\s*\(Principal\)\s*$/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'P';

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
        color={isSuccess ? '#38E28E' : '#FF4D73'}
      />
      <AppText style={styles.feedbackText}>{feedback.message}</AppText>
    </View>
  );
};

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
      sexo: '',
      fechanacimiento: '',
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
              nombreCompleto:
                linkedItem?.displayName?.replace(/\s*\(Principal\)\s*$/i, '') ??
                `Paciente #${pacienteId}`,
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
          sexo: personForm.sexo || undefined,
          fechanacimiento: personForm.fechanacimiento.trim() || undefined,
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
        <View style={styles.heroHeading}>
          <View style={styles.heroIcon}>
            <Ionicons name="people-outline" size={25} color={appColors.info} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroEyebrow}>EXPEDIENTE FAMILIAR</AppText>
            <AppText style={styles.heroTitle}>Personas asociadas</AppText>
            <AppText style={styles.heroSubtitle}>
              Administra los perfiles clínicos vinculados a tu cuenta.
            </AppText>
          </View>
          <View style={styles.totalBadge}>
            <AppText style={styles.totalValue}>{linkedPatients.length}</AppText>
            <AppText style={styles.totalLabel}>
              {linkedPatients.length === 1 ? 'persona' : 'personas'}
            </AppText>
          </View>
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, showPersonForm && styles.primaryActionBtnSecondary]}
            onPress={() => {
              setShowPersonForm((prev) => !prev);
              setPatientFeedback(null);
            }}
          >
            <Ionicons
              name={showPersonForm ? 'close-outline' : 'person-add-outline'}
              size={19}
              color={showPersonForm ? appColors.text : appColors.background}
            />
            <AppText
              style={[
                styles.primaryActionText,
                showPersonForm && styles.primaryActionTextSecondary,
              ]}
            >
              {showPersonForm ? 'Cerrar formulario' : 'Agregar persona'}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareHistoryBtn}
            onPress={() => navigation.navigate('CompartirHistorial')}
          >
            <Ionicons name="share-social-outline" size={19} color={appColors.info} />
            <AppText style={styles.shareHistoryText}>Compartir expediente</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.panelCard}>
        <View style={styles.panelHeaderRow}>
          <View style={styles.panelHeaderCopy}>
            <AppText style={styles.panelTitle}>Directorio del expediente</AppText>
            <AppText style={styles.panelHelper}>
              Selecciona una persona para consultar o administrar su información clínica.
            </AppText>
          </View>
        </View>

        <FeedbackBanner feedback={patientFeedback} />

        {loadingPatients ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#29B6FF" />
            <AppText style={styles.stateTitle}>Cargando personas</AppText>
            <AppText style={styles.stateText}>Estamos consultando tus vinculos registrados.</AppText>
          </View>
        ) : linkedPatients.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="people-outline" size={28} color="#29B6FF" />
            <AppText style={styles.stateTitle}>Aun no tienes personas vinculadas</AppText>
            <AppText style={styles.stateText}>
              Crea la primera persona para comenzar a llenar el expediente familiar o personal.
            </AppText>
          </View>
        ) : (
          <View style={styles.peopleList}>
            {linkedPatients.map((person) => (
              <View key={`${person.relationId}-${person.pacienteId}`} style={styles.personCard}>
                <View style={styles.personMainRow}>
                  <View style={styles.personAvatar}>
                    <AppText style={styles.personAvatarText}>{getInitials(person.nombreCompleto)}</AppText>
                  </View>
                  <View style={styles.personCopy}>
                    <View style={styles.personTitleRow}>
                      <AppText style={styles.personName}>{person.nombreCompleto}</AppText>
                      {person.esPrincipal ? (
                        <View style={styles.personBadge}>
                          <AppText style={styles.personBadgeText}>Principal</AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.personDetails}>
                      <View style={styles.personDetail}>
                        <Ionicons name="finger-print-outline" size={14} color={appColors.textMuted} />
                        <AppText style={styles.personMeta}>ID #{person.pacienteId}</AppText>
                      </View>
                      {person.parentesco ? (
                        <View style={styles.personDetail}>
                          <Ionicons name="people-outline" size={14} color={appColors.textMuted} />
                          <AppText style={styles.personMeta}>{person.parentesco}</AppText>
                        </View>
                      ) : null}
                      {person.contacto ? (
                        <View style={styles.personDetail}>
                          <Ionicons name="call-outline" size={14} color={appColors.textMuted} />
                          <AppText style={styles.personContact}>{person.contacto}</AppText>
                        </View>
                      ) : null}
                    </View>
                    {person.notas ? <AppText style={styles.personNotes}>{person.notas}</AppText> : null}
                  </View>
                </View>
                <View style={styles.personActions}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.personAction, styles.personActionPrimary]}
                    onPress={() =>
                      navigation.navigate('PacienteResumen', {
                        pacienteId: person.pacienteId,
                      })
                    }
                  >
                    <Ionicons name="pulse-outline" size={17} color={appColors.background} />
                    <AppText style={styles.personActionPrimaryText}>Ver resumen</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.personAction}
                    onPress={() =>
                      navigation.navigate('PacienteEditor', { pacienteId: person.pacienteId })
                    }
                  >
                    <Ionicons name="create-outline" size={17} color={appColors.info} />
                    <AppText style={styles.personActionText}>Editar</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.personActionIcon}
                    accessibilityLabel={`Compartir expediente de ${person.nombreCompleto}`}
                    onPress={() =>
                      navigation.navigate('CompartirHistorial', {
                        pacienteId: person.pacienteId,
                      })
                    }
                  >
                    <Ionicons name="share-social-outline" size={18} color={appColors.success} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {showPersonForm ? (
          <View style={styles.formCard}>
            <AppText style={styles.formTitle}>Registrar nueva persona</AppText>
            <AppText style={styles.formSubtitle}>
              Completa los datos basicos para vincularla al expediente actual.
            </AppText>

            <View style={styles.formGrid}>
              <AppTextInput
                style={styles.input}
                placeholder="Nombres"
                placeholderTextColor="#9FB3C8"
                value={personForm.nombres}
                onChangeText={(text) => handlePersonInput('nombres', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#9FB3C8"
                value={personForm.apellidos}
                onChangeText={(text) => handlePersonInput('apellidos', text)}
              />
              <View style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>Sexo</AppText>
                <View style={styles.segmentedRow}>
                  {[
                    { label: 'Femenino', value: 'F' },
                    { label: 'Masculino', value: 'M' },
                    { label: 'Otro', value: 'O' },
                  ].map((option) => {
                    const isSelected = personForm.sexo === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        activeOpacity={0.86}
                        style={[styles.segmentOption, isSelected && styles.segmentOptionActive]}
                        onPress={() => handlePersonInput('sexo', isSelected ? '' : option.value)}
                      >
                        <AppText
                          style={[
                            styles.segmentOptionText,
                            isSelected && styles.segmentOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <AppTextInput
                style={styles.input}
                placeholder="Fecha de nacimiento (YYYY-MM-DD)"
                placeholderTextColor="#9FB3C8"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                value={personForm.fechanacimiento}
                onChangeText={(text) => handlePersonInput('fechanacimiento', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Telefono"
                placeholderTextColor="#9FB3C8"
                keyboardType="phone-pad"
                value={personForm.telefono}
                onChangeText={(text) => handlePersonInput('telefono', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Correo electronico"
                placeholderTextColor="#9FB3C8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={personForm.email}
                onChangeText={(text) => handlePersonInput('email', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Parentesco o rol"
                placeholderTextColor="#9FB3C8"
                value={personForm.parentesco}
                onChangeText={(text) => handlePersonInput('parentesco', text)}
              />
              <AppTextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Notas"
                placeholderTextColor="#9FB3C8"
                multiline
                textAlignVertical="top"
                value={personForm.notas}
                onChangeText={(text) => handlePersonInput('notas', text)}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.principalButton,
                personForm.esPrincipal && styles.principalButtonActive,
              ]}
              onPress={() => handlePersonInput('esPrincipal', !personForm.esPrincipal)}
            >
              <View style={styles.principalButtonIcon}>
                <Ionicons
                  name={personForm.esPrincipal ? 'star' : 'star-outline'}
                  size={22}
                  color={personForm.esPrincipal ? appColors.background : appColors.accent}
                />
              </View>
              <View style={styles.principalButtonCopy}>
                <AppText style={styles.switchTitle}>Marcar como principal</AppText>
                <AppText style={styles.switchHelper}>
                  Usa esta opción para destacar la persona central del expediente.
                </AppText>
              </View>
              <View
                style={[
                  styles.principalStatus,
                  personForm.esPrincipal && styles.principalStatusActive,
                ]}
              >
                <Ionicons
                  name={personForm.esPrincipal ? 'checkmark' : 'add'}
                  size={16}
                  color={personForm.esPrincipal ? appColors.background : appColors.textSoft}
                />
              </View>
            </TouchableOpacity>

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
                  <AppText style={styles.submitBtnText}>Guardar persona</AppText>
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
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    gap: 18,
  },
  heroHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    color: appColors.info,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  heroTitle: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
  },
  heroSubtitle: {
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  totalBadge: {
    minWidth: 74,
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
  },
  totalValue: {
    color: appColors.text,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
  },
  totalLabel: {
    color: appColors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  panelCard: {
    backgroundColor: appColors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 14,
  },
  panelHeaderRow: {
    marginBottom: 2,
  },
  panelHeaderCopy: {
    gap: 4,
  },
  panelTitle: {
    color: appColors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  panelHelper: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryActionBtn: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appColors.success,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionBtnSecondary: {
    backgroundColor: colorAlpha(appColors.text, '10'),
    borderWidth: 1,
    borderColor: appColors.border,
  },
  primaryActionText: {
    color: appColors.background,
    fontWeight: '800',
    fontSize: 13,
  },
  primaryActionTextSecondary: {
    color: appColors.text,
  },
  shareHistoryBtn: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
  },
  shareHistoryText: {
    color: appColors.info,
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
    backgroundColor: colorAlpha(appColors.success, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '55'),
  },
  feedbackError: {
    backgroundColor: colorAlpha(appColors.accent, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '55'),
  },
  feedbackText: {
    flex: 1,
    color: '#F4F8FF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: appColors.backgroundMuted,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  stateTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  peopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  personCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 360,
    maxWidth: 560,
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    gap: 12,
  },
  personMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.info,
  },
  personAvatarText: {
    color: appColors.background,
    fontSize: 16,
    fontWeight: '900',
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
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  personBadge: {
    backgroundColor: colorAlpha(appColors.success, '18'),
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  personBadgeText: {
    color: appColors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  personMeta: {
    color: appColors.textMuted,
    fontSize: 12,
  },
  personContact: {
    color: appColors.textSoft,
    fontSize: 12,
  },
  personDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  personDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personNotes: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  personActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: appColors.borderStrong,
    paddingTop: 12,
  },
  personAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: colorAlpha(appColors.info, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  personActionPrimary: {
    backgroundColor: appColors.success,
    borderColor: appColors.success,
  },
  personActionText: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  personActionPrimaryText: {
    color: appColors.background,
    fontSize: 12,
    fontWeight: '800',
  },
  personActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colorAlpha(appColors.success, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '45'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  formGrid: {
    gap: 10,
  },
  input: {
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: appColors.text,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 92,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  segmentOptionActive: {
    backgroundColor: colorAlpha(appColors.info, '22'),
    borderColor: appColors.info,
  },
  segmentOptionText: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentOptionTextActive: {
    color: appColors.info,
  },
  principalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: appColors.backgroundMuted,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  principalButtonActive: {
    backgroundColor: colorAlpha(appColors.accent, '18'),
    borderColor: appColors.accent,
  },
  principalButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.text,
  },
  principalButtonCopy: {
    flex: 1,
  },
  principalStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  principalStatusActive: {
    backgroundColor: appColors.accent,
    borderColor: appColors.accent,
  },
  switchTitle: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  switchHelper: {
    color: appColors.textSoft,
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appColors.accent,
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: appColors.background,
    fontSize: 15,
    fontWeight: '800',
  },
});
