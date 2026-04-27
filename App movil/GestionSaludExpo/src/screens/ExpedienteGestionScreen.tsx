import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpedienteGestion'>;

type Item = {
  label: string;
  description: string;
  navigateTo?: keyof RootStackParamList;
};

type Section = {
  title: string;
  helper: string;
  items: Item[];
};

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

const FeedbackBanner: React.FC<{ feedback: FeedbackState }> = ({ feedback }) => {
  if (!feedback) return null;
  const isSuccess = feedback.type === 'success';
  return (
    <View
      style={[
        styles.feedbackBox,
        isSuccess ? styles.feedbackSuccess : styles.feedbackError,
      ]}
    >
      <Text
        style={[
          styles.feedbackText,
          isSuccess ? styles.feedbackTextSuccess : styles.feedbackTextError,
        ]}
      >
        {feedback.message}
      </Text>
    </View>
  );
};

const formatErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo completar la acción, intenta nuevamente.';
};

const sections: Section[] = [
  {
    title: 'Datos Del Paciente',
    helper: 'Informacion basica de identidad y contacto',
    items: [
      {
        label: 'Perfil Del Paciente',
        description: 'Nombres, documentos, direccion y contactos',
        navigateTo: 'PacienteForm',
      },
      {
        label: 'Documentos Clinicos',
        description: 'Sube estudios, recetas, PDFs o imagenes',
        navigateTo: 'DocumentoForm',
      },
    ],
  },
  {
    title: 'Historial Clinico',
    helper: 'Consultas, citas y tratamientos activos',
    items: [
      {
        label: 'Consultas Medicas',
        description: 'Motivos, diagnosticos y tratamientos',
        navigateTo: 'ConsultaList',
      },
      {
        label: 'Citas Programadas',
        description: 'Agenda, estados y recordatorios',
        navigateTo: 'CitaForm',
      },
      {
        label: 'Registro Dental',
        description: 'Procedimientos y atenciones odontologicas',
        navigateTo: 'RegistroDentalForm',
      },
      {
        label: 'Alergias',
        description: 'Reacciones previas y planes de accion',
        navigateTo: 'Alergia',
      },
      {
        label: 'Vacunas Aplicadas',
        description: 'Dosis, lotes y proximas aplicaciones',
        navigateTo: 'VacunaForm',
      },
    ],
  },
  {
    title: 'Tratamientos Y Recordatorios',
    helper: 'Medicacion, adherencia y notificaciones',
    items: [
      {
        label: 'Medicacion Y Dosis',
        description: 'Horarios, duracion y seguimiento',
        navigateTo: 'MedicacionForm',
      },
      {
        label: 'Recordatorios Personalizados',
        description: 'Alertas para citas, vacunas o habitos',
        navigateTo: 'RecordatorioForm',
      },
      {
        label: 'Agenda De Recordatorios',
        description: 'Lista completa de proximos avisos',
        navigateTo: 'RecordatorioList',
      },
    ],
  },
  {
    title: 'Habitos Y Bienestar',
    helper: 'Estilo de vida y antecedentes',
    items: [
      {
        label: 'Habitos Diarios',
        description: 'Actividad fisica, sueno y alimentacion',
      },
      {
        label: 'Antecedentes Familiares',
        description: 'Herencia genetica y condiciones relevantes',
      },
      {
        label: 'Condiciones Cronicas',
        description: 'Seguimiento y metas terapeuticas',
      },
    ],
  },

];

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
  const handleNavigate = (route?: keyof RootStackParamList) => {
    if (!route) return;
    navigation.navigate(route as any);
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
      setPatientFeedback({ type: 'error', message: 'Inicia sesión nuevamente para crear personas.' });
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
        throw new Error('El backend no devolvió el identificador del paciente.');
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
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerLabel}>Expediente Medico</Text>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <Text style={styles.headerSubtitle}>Selecciona una seccion para administrar</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => handleNavigate('PacienteResumen')}>
          <Text style={styles.primaryBtnText}>Ver Resumen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.peopleCard}>
        <View style={styles.peopleHeader}>
          <View>
            <Text style={styles.peopleTitle}>Personas Asociadas</Text>
            <Text style={styles.peopleHelper}>
              Vincula familiares o pacientes que compartirán este expediente.
            </Text>
          </View>
        </View>
        <FeedbackBanner feedback={patientFeedback} />
        {loadingPatients ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#1d4ed8" />
            <Text style={styles.stateText}>Cargando personas...</Text>
          </View>
        ) : linkedPatients.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Sin personas registradas</Text>
            <Text style={styles.stateText}>
              Aún no has vinculado a nadie. Usa el botón para crear tu primera persona.
            </Text>
          </View>
        ) : (
          linkedPatients.map((person) => (
            <View key={`${person.relationId}-${person.pacienteId}`} style={styles.personCard}>
              <View style={styles.personCardHeader}>
                <Text style={styles.personName}>{person.nombreCompleto}</Text>
                {person.esPrincipal && <Text style={styles.personBadge}>Principal</Text>}
              </View>
              <Text style={styles.personMeta}>
                ID #{person.pacienteId}
                {person.parentesco ? ` · ${person.parentesco}` : ''}
              </Text>
              {person.contacto ? (
                <Text style={styles.personContact}>Contacto: {person.contacto}</Text>
              ) : null}
              {person.notas ? <Text style={styles.personNotes}>{person.notas}</Text> : null}
            </View>
          ))
        )}
        <TouchableOpacity
          style={styles.addPersonBtn}
          onPress={() => {
            setShowPersonForm((prev) => !prev);
            setPatientFeedback(null);
          }}
        >
          <Text style={styles.addPersonText}>
            {showPersonForm ? 'Cerrar formulario' : 'Crear persona'}
          </Text>
        </TouchableOpacity>
        {showPersonForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva persona</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombres"
              value={personForm.nombres}
              onChangeText={(text) => handlePersonInput('nombres', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellidos"
              value={personForm.apellidos}
              onChangeText={(text) => handlePersonInput('apellidos', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              value={personForm.telefono}
              onChangeText={(text) => handlePersonInput('telefono', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              value={personForm.email}
              onChangeText={(text) => handlePersonInput('email', text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Parentesco o rol"
              value={personForm.parentesco}
              onChangeText={(text) => handlePersonInput('parentesco', text)}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Notas"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={personForm.notas}
              onChangeText={(text) => handlePersonInput('notas', text)}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Marcar como principal</Text>
              <Switch
                value={personForm.esPrincipal}
                onValueChange={(value) => handlePersonInput('esPrincipal', value)}
                thumbColor={personForm.esPrincipal ? '#1d4ed8' : undefined}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, submittingPerson && styles.saveBtnDisabled]}
              onPress={handleCreatePerson}
              disabled={submittingPerson}
            >
              {submittingPerson ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar persona</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionHelper}>{section.helper}</Text>
          </View>
          <FlatList
            data={section.items}
            scrollEnabled={false}
            keyExtractor={(item) => `${section.title}-${item.label}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const actionable = Boolean(item.navigateTo);
              return (
                <TouchableOpacity
                  style={[styles.itemRow, !actionable && styles.itemDisabled]}
                  disabled={!actionable}
                  onPress={() => handleNavigate(item.navigateTo)}
                >
                  <View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                  {actionable ? (
                    <Text style={styles.itemAction}>Gestionar</Text>
                  ) : (
                    <Text style={styles.itemActionDisabled}>Proximamente</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
  headerCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 30,
    padding: 20,
  },
  headerLabel: {
    color: '#bfdbfe',
    letterSpacing: 1,
    fontSize: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 6,
  },
  headerSubtitle: {
    color: '#dbeafe',
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHelper: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDisabled: {
    opacity: 0.7,
  },
  itemLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  itemDescription: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  itemAction: {
    color: '#60a5fa',
    fontWeight: '700',
    fontSize: 12,
  },
  itemActionDisabled: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  peopleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  peopleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  peopleTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  peopleHelper: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  stateBox: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  stateTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  stateText: {
    color: '#cbd5f5',
    textAlign: 'center',
    fontSize: 13,
  },
  personCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  personCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  personBadge: {
    color: '#065f46',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
  },
  personMeta: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  personContact: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  personNotes: {
    color: '#94a3b8',
    fontSize: 12,
  },
  addPersonBtn: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addPersonText: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  multiline: {
    minHeight: 80,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  feedbackBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  feedbackError: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackTextSuccess: {
    color: '#166534',
  },
  feedbackTextError: {
    color: '#b91c1c',
  },
});
