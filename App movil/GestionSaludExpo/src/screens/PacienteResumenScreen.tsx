import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteResumen'>;

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

type PatientDetail = {
  pacienteId: number;
  nombres?: string;
  apellidos?: string;
  fechanacimiento?: string;
  telefono?: string;
  email?: string;
};

type SummaryData = {
  alergias: any[];
  consultas: any[];
  medicaciones: any[];
  vacunas: any[];
  dentales: any[];
  operaciones: any[];
  condiciones: any[];
  antecedentes: any[];
  citas: any[];
};

const emptySummary: SummaryData = {
  alergias: [],
  consultas: [],
  medicaciones: [],
  vacunas: [],
  dentales: [],
  operaciones: [],
  condiciones: [],
  antecedentes: [],
  citas: [],
};

const getPatientId = (item: any) => Number(item?.pacienteId ?? item?.pacienteid ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sortByDateDesc = (items: any[], keys: string[]) =>
  [...items].sort((a, b) => {
    const aValue = keys.map((key) => a?.[key]).find(Boolean);
    const bValue = keys.map((key) => b?.[key]).find(Boolean);
    const aTime = aValue ? new Date(aValue).getTime() : 0;
    const bTime = bValue ? new Date(bValue).getTime() : 0;
    return bTime - aTime;
  });

const filterByPatient = (items: any[], pacienteId: number) =>
  items.filter((item) => getPatientId(item) === pacienteId);

const buildFullName = (patient?: PatientDetail | null, fallback?: string) => {
  const combined = `${patient?.nombres ?? ''} ${patient?.apellidos ?? ''}`.trim();
  return combined || fallback || 'Paciente';
};

export function PacienteResumenScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSelectedPatientId('');
      return;
    }

    setLoadingPatients(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar los pacientes');
      }

      const items: (LinkedPatient | null)[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const pacienteId = Number(
                relation?.pacienteId ??
                  relation?.pacienteid ??
                  relation?.id ??
                  relation?.paciente?.pacienteId,
              );
              if (!Number.isFinite(pacienteId)) return null;

              let displayName =
                relation?.displayName ??
                relation?.nombrePaciente ??
                relation?.paciente?.displayName ??
                `Paciente #${pacienteId}`;

              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: authHeaders,
                });
                const patientBody = await patientResponse.json().catch(() => null);
                if (patientResponse.ok && patientBody) {
                  const combined =
                    `${patientBody?.nombres ?? ''} ${patientBody?.apellidos ?? ''}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // ignorar errores individuales
              }

              return { pacienteId, displayName };
            }),
          )
        : [];

      let normalized = items.filter((item): item is LinkedPatient => Boolean(item));
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }

      setPatientOptions(normalized);
      if (!selectedPatientId && normalized.length > 0) {
        setSelectedPatientId(String(normalized[0].pacienteId));
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Falló al cargar pacientes');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, selectedPatientId, token, user?.pacienteId, user?.username]);

  const fetchSummary = useCallback(
    async (patientIdValue: string, silent = false) => {
      const pacienteId = Number(patientIdValue);
      if (!token || !Number.isFinite(pacienteId) || !pacienteId) {
        setSelectedPatient(null);
        setSummary(emptySummary);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingSummary(true);
      }
      setError(null);

      const fetchJson = async (path: string) => {
        const response = await fetch(`${API_URL}${path}`, { headers: authHeaders });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.message ?? `No se pudo cargar ${path}`);
        }
        return Array.isArray(body) ? body : [];
      };

      try {
        const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
          headers: authHeaders,
        });
        const patientBody = await patientResponse.json().catch(() => null);
        if (!patientResponse.ok) {
          throw new Error(patientBody?.message ?? 'No se pudo cargar el paciente');
        }

        setSelectedPatient({
          pacienteId,
          nombres: patientBody?.nombres,
          apellidos: patientBody?.apellidos,
          fechanacimiento: patientBody?.fechanacimiento,
          telefono: patientBody?.telefono,
          email: patientBody?.email,
        });

        const results = await Promise.allSettled([
          fetchJson('/alergia'),
          fetchJson(`/consultamedica?pacienteId=${pacienteId}`),
          fetchJson('/medicacion'),
          fetchJson('/vacuna'),
          fetchJson('/registrodental'),
          fetchJson('/operacion'),
          fetchJson('/condicioncronica'),
          fetchJson('/antecedentefamiliar'),
          fetchJson('/citamedica'),
        ]);

        const getResult = (index: number) =>
          results[index].status === 'fulfilled' ? results[index].value : [];

        setSummary({
          alergias: sortByDateDesc(filterByPatient(getResult(0), pacienteId), ['fechadiagnostico', 'creadoen']),
          consultas: sortByDateDesc(getResult(1), ['fechaconsulta', 'creadoen']),
          medicaciones: sortByDateDesc(filterByPatient(getResult(2), pacienteId), ['fechainicio', 'creadoen']),
          vacunas: sortByDateDesc(filterByPatient(getResult(3), pacienteId), ['fechaaplicacion', 'creadoen']),
          dentales: sortByDateDesc(filterByPatient(getResult(4), pacienteId), ['fechaatencion', 'creadoen']),
          operaciones: sortByDateDesc(filterByPatient(getResult(5), pacienteId), ['fechaoperacion', 'creadoen']),
          condiciones: sortByDateDesc(filterByPatient(getResult(6), pacienteId), ['fechadiagnostico', 'creadoen']),
          antecedentes: sortByDateDesc(filterByPatient(getResult(7), pacienteId), ['fecharegistro', 'creadoen']),
          citas: sortByDateDesc(filterByPatient(getResult(8), pacienteId), ['fechacita', 'creadoen']),
        });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Falló al cargar el resumen');
        setSummary(emptySummary);
      } finally {
        setLoadingSummary(false);
        setRefreshing(false);
      }
    },
    [authHeaders, token],
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchSummary(selectedPatientId);
    }
  }, [fetchSummary, selectedPatientId]);

  const patientName = useMemo(() => {
    const selectedOption = patientOptions.find((item) => String(item.pacienteId) === selectedPatientId);
    return buildFullName(selectedPatient, selectedOption?.displayName ?? user?.username?.split('@')[0]);
  }, [patientOptions, selectedPatient, selectedPatientId, user?.username]);

  const overview = useMemo(
    () => [
      { label: 'Alergias', value: summary.alergias.length, color: '#ef4444', icon: 'alert-circle-outline' as const, soft: '#fee2e2' },
      { label: 'Consultas', value: summary.consultas.length, color: '#0ea5e9', icon: 'document-text-outline' as const, soft: '#e0f2fe' },
      { label: 'Medicinas', value: summary.medicaciones.length, color: '#22c55e', icon: 'pill' as const, soft: '#dcfce7', iconFamily: 'material' as const },
      { label: 'Dental', value: summary.dentales.length, color: '#f59e0b', icon: 'tooth-outline' as const, soft: '#fef3c7', iconFamily: 'material' as const },
      { label: 'Operaciones', value: summary.operaciones.length, color: '#a855f7', icon: 'bandage-outline' as const, soft: '#f3e8ff' },
      { label: 'Vacunas', value: summary.vacunas.length, color: '#14b8a6', icon: 'shield-checkmark-outline' as const, soft: '#ccfbf1' },
    ],
    [summary],
  );

  const timeline = useMemo(
    () =>
      [
        ...summary.consultas.map((item) => ({
          type: 'Consulta',
          title: item.motivo || 'Consulta médica',
          date: item.fechaconsulta,
          detail: item.diagnostico || item.tratamiento || 'Sin detalle',
        })),
        ...summary.dentales.map((item) => ({
          type: 'Dental',
          title: item.procedimiento || 'Atención dental',
          date: item.fechaatencion,
          detail: item.diagnostico || item.notas || 'Sin detalle',
        })),
        ...summary.operaciones.map((item) => ({
          type: 'Operación',
          title: item.tipo || 'Operación',
          date: item.fechaoperacion,
          detail: item.resultado || item.hospital || 'Sin detalle',
        })),
        ...summary.citas.map((item) => ({
          type: 'Cita',
          title: item.especialidad || 'Cita médica',
          date: item.fechacita,
          detail: item.estado || item.motivo || 'Sin detalle',
        })),
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 8),
    [summary],
  );

  const renderTagList = (items: string[]) => {
    if (items.length === 0) {
      return <Text style={styles.emptyCopy}>Sin registros</Text>;
    }
    return (
      <View style={styles.tagWrap}>
        {items.map((item) => (
          <View key={item} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderInfoRow = (label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchSummary(selectedPatientId, true)}
          tintColor="#111827"
        />
      }
    >
      <View style={styles.headerCard}>
        <View style={styles.headerIconRow}>
          <View style={styles.headerIconBadge}>
            <Ionicons name="medkit-outline" size={24} color="#102a43" />
          </View>
        </View>
        <Text style={styles.kicker}>EXPEDIENTE DEL PACIENTE</Text>
        <Text style={styles.title}>Vista integral desde cero</Text>
        <Text style={styles.subtitle}>
          Selecciona un paciente y revisa alergias, tratamientos, dental, operaciones y más en una sola pantalla.
        </Text>

        <View style={styles.selectorCard}>
          <View style={styles.inlineLabelRow}>
            <Ionicons name="people-outline" size={16} color="#d9e2ec" />
            <Text style={styles.selectorLabel}>Paciente seleccionado</Text>
          </View>
          <View style={styles.pickerShell}>
            <Picker
              selectedValue={selectedPatientId}
              onValueChange={(value) => setSelectedPatientId(String(value))}
              enabled={!loadingPatients}
              style={styles.picker}
            >
              <Picker.Item
                label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'}
                value=""
              />
              {patientOptions.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={patient.displayName}
                  value={String(patient.pacienteId)}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {(loadingPatients || loadingSummary) && !refreshing ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Cargando información del paciente...</Text>
        </View>
      ) : null}

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View>
            <View style={styles.inlineLabelRow}>
              <Ionicons name="person-circle-outline" size={24} color="#8b5e34" />
              <Text style={styles.profileName}>{patientName}</Text>
            </View>
            <Text style={styles.profileMeta}>
              ID #{(selectedPatient?.pacienteId ?? selectedPatientId) || 'N/A'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => {
              const pacienteId = Number(selectedPatient?.pacienteId ?? selectedPatientId);
              navigation.navigate(
                'PacienteEditor',
                Number.isFinite(pacienteId) && pacienteId > 0 ? { pacienteId } : undefined,
              );
            }}
          >
            <Text style={styles.manageButtonText}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoGrid}>
          {renderInfoRow('Nacimiento', formatDate(selectedPatient?.fechanacimiento))}
          {renderInfoRow('Teléfono', selectedPatient?.telefono || 'Sin dato')}
          {renderInfoRow('Correo', selectedPatient?.email || 'Sin dato')}
          {renderInfoRow('Próximas citas', String(summary.citas.length))}
        </View>
      </View>

      <View style={styles.metricGrid}>
        {overview.map((item) => (
          <View key={item.label} style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBadge, { backgroundColor: item.soft }]}>
                {item.iconFamily === 'material' ? (
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                ) : (
                  <Ionicons name={item.icon} size={18} color={item.color} />
                )}
              </View>
              <View style={[styles.metricDot, { backgroundColor: item.color }]} />
            </View>
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="warning-outline" size={18} color="#ef4444" />
          </View>
          <Text style={styles.sectionTitle}>Alertas rápidas</Text>
        </View>
        {renderTagList([
          ...summary.alergias.slice(0, 6).map((item) => item.tipo || 'Alergia'),
          ...summary.condiciones.slice(0, 4).map((item) => item.tratamientoprincipal || item.estado || 'Condición crónica'),
        ])}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="pill" size={18} color="#16a34a" />
          </View>
          <Text style={styles.sectionTitle}>Tratamientos activos</Text>
        </View>
        {summary.medicaciones.length === 0 ? (
          <Text style={styles.emptyCopy}>Sin tratamientos registrados</Text>
        ) : (
          summary.medicaciones.slice(0, 6).map((item, index) => (
            <View key={`med-${index}`} style={styles.recordRow}>
              <View style={styles.recordMain}>
                <Text style={styles.recordTitle}>{item.nombremedicamento || 'Medicamento'}</Text>
                <Text style={styles.recordDetail}>
                  {item.dosis || 'Sin dosis'} · {item.viaadministracion || 'Sin vía'}
                </Text>
                <Text style={styles.recordSub}>{item.indicaciones || 'Sin indicaciones'}</Text>
              </View>
              <Text style={styles.recordDate}>{formatDate(item.fechainicio)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#ede9fe' }]}>
            <Ionicons name="time-outline" size={18} color="#7c3aed" />
          </View>
          <Text style={styles.sectionTitle}>Historial clínico reciente</Text>
        </View>
        {timeline.length === 0 ? (
          <Text style={styles.emptyCopy}>Sin movimientos recientes</Text>
        ) : (
          timeline.map((item, index) => (
            <View key={`${item.type}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineMarker} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineType}>{item.type}</Text>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.timelineDate}>{formatDateTime(item.date)}</Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4efe6',
  },
  content: {
    padding: 18,
    paddingBottom: 34,
  },
  headerCard: {
    backgroundColor: '#102a43',
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  headerIconRow: {
    marginBottom: 12,
  },
  headerIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: '#9fb3c8',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: '#f0f4f8',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#bcccdc',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  selectorCard: {
    marginTop: 18,
    backgroundColor: '#243b53',
    borderRadius: 20,
    padding: 14,
  },
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorLabel: {
    color: '#d9e2ec',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerShell: {
    backgroundColor: '#0b1220',
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#f8fafc',
  },
  errorText: {
    color: '#fca5a5',
    marginBottom: 12,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingText: {
    color: '#cbd5e1',
    marginTop: 10,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
  },
  profileMeta: {
    color: '#cbd5e1',
    marginTop: 4,
  },
  manageButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  manageButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '58%',
    textAlign: 'right',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#0b1220',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  recordRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e7da',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordMain: {
    flex: 1,
    paddingRight: 12,
  },
  recordTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  recordDetail: {
    color: '#475569',
    marginTop: 4,
    fontSize: 13,
  },
  recordSub: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 12,
  },
  recordDate: {
    color: '#8b5e34',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e7da',
  },
  timelineMarker: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#111827',
    marginTop: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    paddingRight: 10,
  },
  timelineType: {
    color: '#8b5e34',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timelineTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  timelineDetail: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 12,
  },
  timelineDate: {
    color: '#6b7280',
    fontSize: 11,
    maxWidth: 88,
    textAlign: 'right',
  },
  dualSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  miniSection: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eadfce',
  },
  simpleItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e7da',
  },
  simpleTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  simpleText: {
    color: '#64748b',
    marginTop: 4,
    fontSize: 12,
  },
});
