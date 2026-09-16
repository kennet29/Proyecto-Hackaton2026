/**
 * @file App movil/GestionSaludExpo/src/screens/ExpedienteGestionScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { AppColors, useAppColors } from '../theme/useAppColors';

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

const formatBirthDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const toApiBirthDate = (value: string): string | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
};

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (!feedback) return null;
  const isSuccess = feedback.type === 'success';
  return (
    <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
      <Ionicons
        name={isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={18}
        color={isSuccess ? colors.success : colors.accent}
      />
      <AppText style={styles.feedbackText}>{feedback.message}</AppText>
    </View>
  );
};

export function ExpedienteGestionScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { user, token } = useAuth();
  const [linkedPatients, setLinkedPatients] = useState<LinkedPerson[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientFeedback, setPatientFeedback] = useState<FeedbackState>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [submittingPerson, setSubmittingPerson] = useState(false);
  const [deletingRelationId, setDeletingRelationId] = useState<number | null>(null);

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

    const birthDate = personForm.fechanacimiento.trim()
      ? toApiBirthDate(personForm.fechanacimiento.trim())
      : undefined;
    if (personForm.fechanacimiento.trim() && !birthDate) {
      setPatientFeedback({ type: 'error', message: 'La fecha de nacimiento debe tener el formato dd/mm/aaaa.' });
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
          fechanacimiento: birthDate,
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

  const handleRemovePerson = (person: LinkedPerson) => {
    if (!token) {
      setPatientFeedback({ type: 'error', message: 'Inicia sesion nuevamente para administrar personas.' });
      return;
    }

    Alert.alert(
      'Quitar persona de la cuenta',
      `${person.nombreCompleto} se desvinculara de esta cuenta. Su historial clinico no sera eliminado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setDeletingRelationId(person.relationId);
            setPatientFeedback(null);
            try {
              const response = await fetch(`${API_URL}/usuario-paciente/${person.relationId}`, {
                method: 'DELETE',
                headers: authHeaders(),
              });
              const body = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(body?.message ?? 'No se pudo quitar la persona de la cuenta.');
              }
              setLinkedPatients((current) => current.filter((item) => item.relationId !== person.relationId));
              invalidateLinkedPatientsCache(authHeaders());
              setPatientFeedback({ type: 'success', message: `${person.nombreCompleto} fue quitado de esta cuenta.` });
              void fetchLinkedPatients();
            } catch (error) {
              setPatientFeedback({ type: 'error', message: formatErrorMessage(error) });
            } finally {
              setDeletingRelationId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeading}>
          <View style={styles.heroIcon}>
            <Ionicons name="people-outline" size={25} color={colors.info} />
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
              color={showPersonForm ? colors.text : colors.background}
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
            <Ionicons name="share-social-outline" size={19} color={colors.info} />
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
            <ActivityIndicator color={colors.info} />
            <AppText style={styles.stateTitle}>Cargando personas</AppText>
            <AppText style={styles.stateText}>Estamos consultando tus vinculos registrados.</AppText>
          </View>
        ) : linkedPatients.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="people-outline" size={28} color={colors.info} />
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
                        <Ionicons name="finger-print-outline" size={14} color={colors.textMuted} />
                        <AppText style={styles.personMeta}>ID #{person.pacienteId}</AppText>
                      </View>
                      {person.parentesco ? (
                        <View style={styles.personDetail}>
                          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                          <AppText style={styles.personMeta}>{person.parentesco}</AppText>
                        </View>
                      ) : null}
                      {person.contacto ? (
                        <View style={styles.personDetail}>
                          <Ionicons name="call-outline" size={14} color={colors.textMuted} />
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
                    <Ionicons name="pulse-outline" size={17} color={colors.onAccent} />
                    <AppText style={styles.personActionPrimaryText}>Ver resumen</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.personAction}
                    onPress={() =>
                      navigation.navigate('PacienteEditor', { pacienteId: person.pacienteId })
                    }
                  >
                    <Ionicons name="create-outline" size={17} color={colors.info} />
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
                    <Ionicons name="share-social-outline" size={18} color={colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.personActionIcon, styles.personActionDelete]}
                    accessibilityLabel={`Quitar a ${person.nombreCompleto} de la cuenta`}
                    disabled={deletingRelationId === person.relationId || person.relationId <= 0}
                    onPress={() => handleRemovePerson(person)}
                  >
                    {deletingRelationId === person.relationId ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color={colors.accent} />
                    )}
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
                placeholderTextColor={colors.textMuted}
                value={personForm.nombres}
                onChangeText={(text) => handlePersonInput('nombres', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor={colors.textMuted}
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
                placeholder="Fecha de nacimiento (dd/mm/aaaa)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                value={personForm.fechanacimiento}
                onChangeText={(text) => handlePersonInput('fechanacimiento', formatBirthDateInput(text))}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Telefono"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={personForm.telefono}
                onChangeText={(text) => handlePersonInput('telefono', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Correo electronico"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={personForm.email}
                onChangeText={(text) => handlePersonInput('email', text)}
              />
              <AppTextInput
                style={styles.input}
                placeholder="Parentesco o rol"
                placeholderTextColor={colors.textMuted}
                value={personForm.parentesco}
                onChangeText={(text) => handlePersonInput('parentesco', text)}
              />
              <AppTextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Notas"
                placeholderTextColor={colors.textMuted}
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
                  color={personForm.esPrincipal ? colors.background : colors.accent}
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
                  color={personForm.esPrincipal ? colors.background : colors.textSoft}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPerson && styles.submitBtnDisabled]}
              onPress={handleCreatePerson}
              disabled={submittingPerson}
            >
              {submittingPerson ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={colors.onAccent} />
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

const createStyles = (colors: AppColors) => StyleSheet.create({
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
    backgroundColor: colors.surfaceStrong,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
    backgroundColor: colorAlpha(colors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.info, '45'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    color: colors.info,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  totalBadge: {
    minWidth: 74,
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    paddingHorizontal: 10,
  },
  totalValue: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
  },
  totalLabel: {
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  panelHeaderRow: {
    marginBottom: 2,
  },
  panelHeaderCopy: {
    gap: 4,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  panelHelper: {
    color: colors.textSoft,
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
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryActionBtnSecondary: {
    backgroundColor: colorAlpha(colors.text, '10'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryActionText: {
    color: colors.onAccent,
    fontWeight: '800',
    fontSize: 13,
  },
  primaryActionTextSecondary: {
    color: colors.text,
  },
  shareHistoryBtn: {
    flex: 1,
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colorAlpha(colors.info, '12'),
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colorAlpha(colors.info, '55'),
  },
  shareHistoryText: {
    color: colors.info,
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
    backgroundColor: colorAlpha(colors.success, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.success, '55'),
  },
  feedbackError: {
    backgroundColor: colorAlpha(colors.accent, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.accent, '55'),
  },
  feedbackText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textSoft,
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
    backgroundColor: colors.surfaceStrong,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
    backgroundColor: colors.info,
  },
  personAvatarText: {
    color: colors.onAccent,
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  personBadge: {
    backgroundColor: colorAlpha(colors.success, '18'),
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  personBadgeText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  personMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  personContact: {
    color: colors.textSoft,
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
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  personActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    paddingTop: 12,
  },
  personAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: colorAlpha(colors.info, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.info, '45'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  personActionPrimary: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  personActionText: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  personActionPrimaryText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  personActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colorAlpha(colors.success, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(colors.success, '45'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  personActionDelete: {
    backgroundColor: colorAlpha(colors.accent, '12'),
    borderColor: colorAlpha(colors.accent, '58'),
  },
  formCard: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  formGrid: {
    gap: 10,
  },
  input: {
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 92,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textSoft,
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
    backgroundColor: colors.backgroundMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  segmentOptionActive: {
    backgroundColor: colorAlpha(colors.info, '22'),
    borderColor: colors.info,
  },
  segmentOptionText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentOptionTextActive: {
    color: colors.info,
  },
  principalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundMuted,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  principalButtonActive: {
    backgroundColor: colorAlpha(colors.accent, '18'),
    borderColor: colors.accent,
  },
  principalButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  principalStatusActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  switchTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  switchHelper: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
});
