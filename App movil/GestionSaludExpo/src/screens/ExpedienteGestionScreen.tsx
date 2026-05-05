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

type ModuleItem = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  navigateTo?: keyof RootStackParamList;
};

type ModuleSection = {
  title: string;
  helper: string;
  accent: string;
  items: ModuleItem[];
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo completar la accion. Intenta nuevamente.';
};

const sections: ModuleSection[] = [
  {
    title: 'Perfil y archivos',
    helper: 'Identidad, contacto y documentos base del expediente.',
    accent: '#38bdf8',
    items: [
      {
        label: 'Perfil del paciente',
        description: 'Nombres, documento, telefono y datos personales.',
        icon: 'person-circle-outline',
        accent: '#38bdf8',
        navigateTo: 'PacienteForm',
      },
      {
        label: 'Documentos clinicos',
        description: 'Estudios, recetas, reportes e imagenes.',
        icon: 'documents-outline',
        accent: '#c084fc',
        navigateTo: 'DocumentoForm',
      },
    ],
  },
  {
    title: 'Atencion clinica',
    helper: 'Consultas, citas y registros de seguimiento medico.',
    accent: '#fb7185',
    items: [
      {
        label: 'Consultas medicas',
        description: 'Diagnosticos, motivo de consulta y tratamiento.',
        icon: 'medkit-outline',
        accent: '#a78bfa',
        navigateTo: 'ConsultaList',
      },
      {
        label: 'Citas programadas',
        description: 'Agenda, control y seguimiento de citas.',
        icon: 'calendar-outline',
        accent: '#fb7185',
        navigateTo: 'CitaForm',
      },
      {
        label: 'Registro dental',
        description: 'Procedimientos odontologicos y piezas tratadas.',
        icon: 'color-wand-outline',
        accent: '#fb923c',
        navigateTo: 'RegistroDentalForm',
      },
      {
        label: 'Vacunas',
        description: 'Dosis aplicadas, lotes y proximas fechas.',
        icon: 'shield-checkmark-outline',
        accent: '#60a5fa',
        navigateTo: 'VacunaForm',
      },
      {
        label: 'Alergias',
        description: 'Reacciones, alertas y antecedentes relevantes.',
        icon: 'warning-outline',
        accent: '#fbbf24',
        navigateTo: 'Alergia',
      },
    ],
  },
  {
    title: 'Tratamiento y control',
    helper: 'Medicacion, recordatorios y condiciones de largo plazo.',
    accent: '#f97316',
    items: [
      {
        label: 'Medicacion',
        description: 'Dosis, horarios, duracion y vias de administracion.',
        icon: 'flask-outline',
        accent: '#f97316',
        navigateTo: 'MedicacionForm',
      },
      {
        label: 'Recordatorios',
        description: 'Alertas personalizadas para citas y tratamientos.',
        icon: 'notifications-outline',
        accent: '#f472b6',
        navigateTo: 'RecordatorioForm',
      },
      {
        label: 'Agenda de recordatorios',
        description: 'Vista completa del cronograma de avisos.',
        icon: 'timer-outline',
        accent: '#38bdf8',
        navigateTo: 'RecordatorioList',
      },
      {
        label: 'Condiciones cronicas',
        description: 'Seguimiento y control de enfermedades cronicas.',
        icon: 'pulse-outline',
        accent: '#22c55e',
        navigateTo: 'CondicionCronicaForm',
      },
    ],
  },
  {
    title: 'Habitos y bienestar',
    helper: 'Rutinas diarias, peso, salud mental y estilo de vida.',
    accent: '#2dd4bf',
    items: [
      {
        label: 'Habitos',
        description: 'Sueno, alimentacion, ejercicio y riesgos.',
        icon: 'walk-outline',
        accent: '#2dd4bf',
        navigateTo: 'Habitos',
      },
      {
        label: 'Seguimiento fisico',
        description: 'Peso, pasos, calorias y progreso diario.',
        icon: 'barbell-outline',
        accent: '#38bdf8',
        navigateTo: 'SeguimientoFisico',
      },
      {
        label: 'Salud mental',
        description: 'Registro emocional, alertas y bienestar diario.',
        icon: 'heart-outline',
        accent: '#22c55e',
        navigateTo: 'SaludMental',
      },
      {
        label: 'Periodo',
        description: 'Control de ciclo, sintomas y prediccion.',
        icon: 'moon-outline',
        accent: '#ec4899',
        navigateTo: 'Periodo',
      },
    ],
  },
];

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  if (!feedback) return null;
  const isSuccess = feedback.type === 'success';
  return (
    <View style={[styles.feedbackBox, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
      <Ionicons
        name={isSuccess ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={18}
        color={isSuccess ? '#bbf7d0' : '#fecaca'}
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
  <View style={[styles.statCard, { borderColor: `${accent}66` }]}>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ModuleCard: React.FC<{
  item: ModuleItem;
  onPress: (route?: keyof RootStackParamList) => void;
}> = ({ item, onPress }) => {
  const actionable = Boolean(item.navigateTo);
  return (
    <TouchableOpacity
      style={[styles.moduleCard, { borderColor: `${item.accent}66` }, !actionable && styles.moduleCardDisabled]}
      disabled={!actionable}
      onPress={() => onPress(item.navigateTo)}
    >
      <View style={[styles.moduleIcon, { backgroundColor: `${item.accent}22` }]}>
        <Ionicons name={item.icon} size={20} color={item.accent} />
      </View>
      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>{item.label}</Text>
        <Text style={styles.moduleDescription}>{item.description}</Text>
      </View>
      <View style={styles.moduleActionWrap}>
        <Text style={[styles.moduleAction, actionable ? styles.moduleActionEnabled : styles.moduleActionDisabled]}>
          {actionable ? 'Abrir' : 'Proximamente'}
        </Text>
        {actionable ? <Ionicons name="chevron-forward" size={18} color="#cbd5f5" /> : null}
      </View>
    </TouchableOpacity>
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

  const handleNavigate = (route?: keyof RootStackParamList) => {
    if (!route) return;
    navigation.navigate(route as never);
  };

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
      const enriched = await Promise.all(
        relations.map(async (relation) => {
          const patientResponse = await fetch(`${API_URL}/paciente/${relation.pacienteId}`, {
            headers: authHeaders(),
          });
          const patientBody = await patientResponse.json().catch(() => null);
          const nombre = patientBody?.nombres ?? '';
          const apellido = patientBody?.apellidos ?? '';

          return {
            relationId:
              relation.id ??
              relation.usuariopacienteid ??
              relation.usuarioPacienteId ??
              relation.pacienteId,
            pacienteId: relation.pacienteId,
            parentesco: relation.parentesco ?? null,
            esPrincipal: Boolean(relation.esPrincipal),
            notas: relation.notas ?? null,
            nombreCompleto: `${nombre} ${apellido}`.trim() || `Paciente #${relation.pacienteId}`,
            contacto: patientBody?.telefono ?? patientBody?.email ?? null,
          } as LinkedPerson;
        }),
      );

      setLinkedPatients(enriched);
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
            <Ionicons name="folder-open-outline" size={16} color="#38bdf8" />
            <Text style={styles.heroBadgeText}>Expediente</Text>
          </View>
          <TouchableOpacity style={styles.heroGhostBtn} onPress={() => handleNavigate('PacienteResumen')}>
            <Text style={styles.heroGhostBtnText}>Ver resumen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Gestiona tu expediente desde un solo lugar</Text>
        <Text style={styles.heroSubtitle}>
          Organiza personas vinculadas, documentos, consultas y modulos clinicos con una vista mas clara.
        </Text>

        <View style={styles.statsRow}>
          <StatCard
            label="Personas"
            value={String(linkedPatients.length)}
            accent="#38bdf8"
          />
          <StatCard
            label="Principal"
            value={principalCount > 0 ? String(principalCount) : '0'}
            accent="#34d399"
          />
          <StatCard
            label="Usuario"
            value={displayName.slice(0, 10) || 'Paciente'}
            accent="#facc15"
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
              color="#0f172a"
            />
            <Text style={styles.primaryActionText}>
              {showPersonForm ? 'Cerrar' : 'Nueva persona'}
            </Text>
          </TouchableOpacity>
        </View>

        <FeedbackBanner feedback={patientFeedback} />

        {loadingPatients ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={styles.stateTitle}>Cargando personas</Text>
            <Text style={styles.stateText}>Estamos consultando tus vinculos registrados.</Text>
          </View>
        ) : linkedPatients.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="people-outline" size={28} color="#38bdf8" />
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
                    <Ionicons name="person-outline" size={20} color="#38bdf8" />
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

                <View style={styles.personActionsRow}>
                  <TouchableOpacity
                    style={styles.personActionBtn}
                    onPress={() =>
                      navigation.navigate('PacienteEditor', { pacienteId: person.pacienteId })
                    }
                  >
                    <Ionicons name="create-outline" size={16} color="#e2e8f0" />
                    <Text style={styles.personActionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.personActionBtn}
                    onPress={() => handleNavigate('PacienteResumen')}
                  >
                    <Ionicons name="analytics-outline" size={16} color="#e2e8f0" />
                    <Text style={styles.personActionText}>Resumen</Text>
                  </TouchableOpacity>
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
                placeholderTextColor="#94a3b8"
                value={personForm.nombres}
                onChangeText={(text) => handlePersonInput('nombres', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellidos"
                placeholderTextColor="#94a3b8"
                value={personForm.apellidos}
                onChangeText={(text) => handlePersonInput('apellidos', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefono"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={personForm.telefono}
                onChangeText={(text) => handlePersonInput('telefono', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electronico"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={personForm.email}
                onChangeText={(text) => handlePersonInput('email', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Parentesco o rol"
                placeholderTextColor="#94a3b8"
                value={personForm.parentesco}
                onChangeText={(text) => handlePersonInput('parentesco', text)}
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Notas"
                placeholderTextColor="#94a3b8"
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
                thumbColor={personForm.esPrincipal ? '#38bdf8' : undefined}
                trackColor={{ false: '#334155', true: '#1e3a5f' }}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submittingPerson && styles.submitBtnDisabled]}
              onPress={handleCreatePerson}
              disabled={submittingPerson}
            >
              {submittingPerson ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#0f172a" />
                  <Text style={styles.submitBtnText}>Guardar persona</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <View style={styles.sectionTopRow}>
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionHelper}>{section.helper}</Text>
            </View>
            <View style={[styles.sectionAccentPill, { borderColor: `${section.accent}66` }]}>
              <Text style={[styles.sectionAccentText, { color: section.accent }]}>
                {section.items.length} modulos
              </Text>
            </View>
          </View>

          <View style={styles.moduleList}>
            {section.items.map((item) => (
              <ModuleCard
                key={`${section.title}-${item.label}`}
                item={item}
                onPress={handleNavigate}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#111c34',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0b1220',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '700',
  },
  heroGhostBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroGhostBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  panelCard: {
    backgroundColor: '#1e293b',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  panelHeaderRow: {
    gap: 12,
  },
  panelHeaderCopy: {
    gap: 4,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  panelHelper: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryActionBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#bae6fd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryActionText: {
    color: '#0f172a',
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
    backgroundColor: '#14532d',
  },
  feedbackError: {
    backgroundColor: '#7f1d1d',
  },
  feedbackText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  stateCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  peopleList: {
    gap: 12,
  },
  personCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22304a',
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
    backgroundColor: '#082f49',
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
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  personBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  personBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
  },
  personMeta: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  personContact: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  personNotes: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  personActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  personActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#172235',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  personActionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#111c34',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#22304a',
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  formGrid: {
    gap: 10,
  },
  input: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#f8fafc',
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
    backgroundColor: '#0b1220',
    borderRadius: 16,
    padding: 14,
  },
  switchTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  switchHelper: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#bae6fd',
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  sectionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHelper: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 250,
  },
  sectionAccentPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionAccentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  moduleCardDisabled: {
    opacity: 0.7,
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
    gap: 3,
  },
  moduleTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  moduleDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  moduleActionWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  moduleAction: {
    fontSize: 12,
    fontWeight: '800',
  },
  moduleActionEnabled: {
    color: '#93c5fd',
  },
  moduleActionDisabled: {
    color: '#94a3b8',
  },
});
