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
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';
import {
  readClinicalSummaryCache,
  writeClinicalSummaryCache,
} from '../utils/clinicalSummaryCache';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteResumen'>;

type ClinicalSummary = {
  generatedAt: string;
  patient: {
    pacienteId: number;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    email: string | null;
    sexo: string | null;
    fechaNacimiento: string | null;
    edadAproximada: number | null;
  };
  overview: {
    totalConsultas: number;
    ultimaConsulta: string | null;
    citasPendientes: number;
    vacunasAplicadas: number;
    medicacionesActivas: number;
    recordatoriosPendientes: number;
    alergiasActivas: number;
    condicionesActivas: number;
    examenesClinicos: number;
    seguimientosActivos: number;
  };
  alerts: Array<{
    level: 'high' | 'medium' | 'info';
    title: string;
    detail: string;
  }>;
  activeTreatments: Array<{
    medicacionId: number;
    nombre: string;
    dosis: string | null;
    viaAdministracion: string | null;
    fechaInicio: string;
    fechaFin: string | null;
    indicaciones: string | null;
  }>;
  upcoming: {
    nextAppointment: {
      citaId: number;
      fecha: string;
      especialidad: string | null;
      motivo: string | null;
      estado: string;
    } | null;
    nextFollowUp: string | null;
  };
  recentTimeline: Array<{
    type: string;
    title: string;
    date: string;
    detail: string;
  }>;
  carePointers: string[];
};

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

const buildFullName = (summary?: ClinicalSummary | null, fallback?: string) => {
  if (!summary?.patient) {
    return fallback || 'Paciente';
  }
  return `${summary.patient.nombres} ${summary.patient.apellidos}`.trim() || fallback || 'Paciente';
};

export function PacienteResumenScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'server' | 'cache' | null>(null);

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
      let linked = await fetchLinkedPatients(authHeaders);
      if (linked.length === 0 && user?.pacienteId) {
        linked = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }
      setPatientOptions(linked);
      if (!selectedPatientId && linked.length > 0) {
        setSelectedPatientId(String(linked[0].pacienteId));
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Fallo al cargar pacientes');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, selectedPatientId, token, user?.pacienteId, user?.username]);

  const fetchSummary = useCallback(
    async (patientIdValue: string, silent = false) => {
      const pacienteId = Number(patientIdValue);
      if (!token || !Number.isFinite(pacienteId) || pacienteId <= 0) {
        setSummary(null);
        setDataSource(null);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingSummary(true);
      }
      setError(null);

      try {
        const response = await fetch(`${API_URL}/paciente/${pacienteId}/resumen-clinico`, {
          headers: authHeaders,
        });
        const body = (await response.json().catch(() => null)) as ClinicalSummary | null;
        if (!response.ok || !body) {
          throw new Error((body as { message?: string } | null)?.message ?? 'No se pudo cargar el resumen');
        }
        setSummary(body);
        setDataSource('server');
        await writeClinicalSummaryCache(pacienteId, body);
      } catch (fetchError) {
        const cached = await readClinicalSummaryCache<ClinicalSummary>(pacienteId);
        if (cached) {
          setSummary(cached);
          setDataSource('cache');
          setError('Mostrando la ultima copia guardada porque no hubo conexion con el servidor.');
        } else {
          setSummary(null);
          setDataSource(null);
          setError(fetchError instanceof Error ? fetchError.message : 'Fallo al cargar el resumen');
        }
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
    return buildFullName(summary, selectedOption?.displayName ?? user?.username?.split('@')[0]);
  }, [patientOptions, selectedPatientId, summary, user?.username]);

  const selectedPatientLabel =
    patientOptions.find((item) => String(item.pacienteId) === selectedPatientId)?.displayName ?? patientName;

  const overviewCards = useMemo(
    () =>
      summary
        ? [
            {
              label: 'Consultas',
              value: summary.overview.totalConsultas,
              color: '#29B6FF',
              soft: '#29B6FF18',
              icon: 'document-text-outline' as const,
            },
            {
              label: 'Citas',
              value: summary.overview.citasPendientes,
              color: '#FF4D73',
              soft: '#FF4D7322',
              icon: 'calendar-outline' as const,
            },
            {
              label: 'Medicacion',
              value: summary.overview.medicacionesActivas,
              color: '#38F28E',
              soft: '#38F28E18',
              icon: 'pill' as const,
              iconFamily: 'material' as const,
            },
            {
              label: 'Examenes',
              value: summary.overview.examenesClinicos,
              color: '#29B6FF',
              soft: '#29B6FF18',
              icon: 'flask-outline' as const,
            },
            {
              label: 'Alergias',
              value: summary.overview.alergiasActivas,
              color: '#FF4D73',
              soft: '#FF4D7318',
              icon: 'warning-outline' as const,
            },
            {
              label: 'Seguimientos',
              value: summary.overview.seguimientosActivos,
              color: '#38F28E',
              soft: '#38F28E22',
              icon: 'pulse-outline' as const,
            },
          ]
        : [],
    [summary],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchSummary(selectedPatientId, true)}
          tintColor={appColors.text}
        />
      }
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <Ionicons name="medkit-outline" size={24} color={appColors.background} />
          </View>
          <View style={styles.headerStatusPill}>
            <Ionicons name="pulse-outline" size={14} color={appColors.info} />
            <Text style={styles.headerStatusText}>Resumen clínico</Text>
          </View>
        </View>
        <Text style={styles.title}>Vista integral del expediente</Text>
        <Text style={styles.subtitleClean}>
          Reúne indicadores, alertas y actividad reciente para consultar el estado clínico sin cambiar de pantalla.
        </Text>
        <Text style={styles.subtitle}>
          Resumen clínico compacto.
        </Text>

        <View style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>Paciente seleccionado</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {selectedPatientId ? selectedPatientLabel : 'Selecciona una persona'}
          </Text>
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

      {!loadingPatients && patientOptions.length === 0 ? (
        <View style={styles.stateCard}>
          <Ionicons name="people-outline" size={28} color={appColors.info} />
          <Text style={styles.stateTitle}>No hay personas asociadas</Text>
          <Text style={styles.stateText}>
            Agrega una persona asociada para generar su resumen clínico.
          </Text>
        </View>
      ) : null}

      {(loadingPatients || loadingSummary) && !refreshing ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={appColors.info} />
          <Text style={styles.loadingText}>Cargando resumen del paciente...</Text>
        </View>
      ) : null}

      {!loadingPatients && !loadingSummary && selectedPatientId && !summary && !error ? (
        <View style={styles.stateCard}>
          <Ionicons name="document-text-outline" size={28} color={appColors.info} />
          <Text style={styles.stateTitle}>Resumen no disponible</Text>
          <Text style={styles.stateText}>Actualiza la pantalla o intenta con otra persona asociada.</Text>
        </View>
      ) : null}

      {summary ? (
        <>
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>{patientName}</Text>
                <Text style={styles.profileMeta}>
                  ID #{summary.patient.pacienteId}
                  {summary.patient.edadAproximada !== null ? ` · ${summary.patient.edadAproximada} años` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => navigation.navigate('PacienteEditor', { pacienteId: summary.patient.pacienteId })}
              >
                <Text style={styles.manageButtonText}>Gestionar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.syncBadge}>
              <Ionicons
                name={dataSource === 'cache' ? 'cloud-offline-outline' : 'cloud-done-outline'}
                size={16}
                color={dataSource === 'cache' ? '#FF4D73' : '#38F28E'}
              />
              <Text style={styles.syncBadgeText}>
                {dataSource === 'cache' ? 'Copia local' : 'Datos sincronizados'} · {formatDateTime(summary.generatedAt)}
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nacimiento</Text>
                <Text style={styles.infoValue}>{formatDate(summary.patient.fechaNacimiento)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefono</Text>
                <Text style={styles.infoValue}>{summary.patient.telefono || 'Sin dato'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Correo</Text>
                <Text style={styles.infoValue}>{summary.patient.email || 'Sin dato'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ultima consulta</Text>
                <Text style={styles.infoValue}>{formatDateTime(summary.overview.ultimaConsulta)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricGrid}>
            {overviewCards.map((item) => (
              <View key={item.label} style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconBadge, { backgroundColor: item.soft }]}>
                    {item.iconFamily === 'material' ? (
                      <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                    ) : (
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    )}
                  </View>
                </View>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Alertas rapidas</Text>
            {summary.alerts.length === 0 ? (
              <Text style={styles.emptyCopy}>Sin alertas prioritarias</Text>
            ) : (
              summary.alerts.map((alert, index) => (
                <View key={`${alert.title}-${index}`} style={styles.alertRow}>
                  <View
                    style={[
                      styles.alertLevel,
                      alert.level === 'high'
                        ? styles.alertHigh
                        : alert.level === 'medium'
                          ? styles.alertMedium
                          : styles.alertInfo,
                    ]}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDetail}>{alert.detail}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Proximos hitos</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Proxima cita</Text>
              <Text style={styles.infoValue}>
                {summary.upcoming.nextAppointment
                  ? `${formatDateTime(summary.upcoming.nextAppointment.fecha)} · ${
                      summary.upcoming.nextAppointment.especialidad || 'Sin especialidad'
                    }`
                  : 'Sin cita pendiente'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Proximo control</Text>
              <Text style={styles.infoValue}>{formatDate(summary.upcoming.nextFollowUp)}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tratamientos activos</Text>
            {summary.activeTreatments.length === 0 ? (
              <Text style={styles.emptyCopy}>Sin tratamientos activos</Text>
            ) : (
              summary.activeTreatments.map((item) => (
                <View key={item.medicacionId} style={styles.recordRow}>
                  <View style={styles.recordMain}>
                    <Text style={styles.recordTitle}>{item.nombre}</Text>
                    <Text style={styles.recordDetail}>
                      {item.dosis || 'Sin dosis'} · {item.viaAdministracion || 'Sin vía'}
                    </Text>
                    <Text style={styles.recordSub}>{item.indicaciones || 'Sin indicaciones'}</Text>
                  </View>
                  <Text style={styles.recordDate}>{formatDate(item.fechaInicio)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Historial reciente</Text>
            {summary.recentTimeline.length === 0 ? (
              <Text style={styles.emptyCopy}>Sin actividad reciente</Text>
            ) : (
              summary.recentTimeline.map((item, index) => (
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

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pistas de cuidado</Text>
            {summary.carePointers.length === 0 ? (
              <Text style={styles.emptyCopy}>Sin observaciones adicionales</Text>
            ) : (
              summary.carePointers.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.pointerRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#38F28E" />
                  <Text style={styles.pointerText}>{item}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 34,
  },
  headerCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: appColors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
  },
  headerStatusText: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
  },
  kicker: {
    color: '#9FB3C8',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: appColors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
  },
  subtitleClean: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  subtitle: {
    display: 'none',
  },
  selectorCard: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 10,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  selectorCopy: {
    flex: 1,
  },
  selectorLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectorValue: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  selectorIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '18'),
  },
  pickerShell: {
    backgroundColor: appColors.background,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  picker: {
    color: '#F4F8FF',
  },
  errorText: {
    color: '#FF4D73',
    marginBottom: 12,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: appColors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  loadingText: {
    color: appColors.textSoft,
    marginTop: 10,
    fontWeight: '700',
  },
  stateCard: {
    backgroundColor: appColors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  stateTitle: {
    color: appColors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#182A44',
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  profileHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  profileName: {
    color: '#071120',
    fontSize: 26,
    fontWeight: '800',
    flexShrink: 1,
  },
  profileMeta: {
    color: '#9FB3C8',
    marginTop: 4,
    flexShrink: 1,
  },
  manageButton: {
    backgroundColor: '#071120',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    color: '#F4F8FF',
    fontWeight: '700',
    fontSize: 12,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#F4F8FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  syncBadgeText: {
    color: '#27496D',
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F8FF',
    paddingBottom: 8,
  },
  infoLabel: {
    color: '#9FB3C8',
    fontSize: 13,
  },
  infoValue: {
    color: '#071120',
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
    backgroundColor: '#F4F8FF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#182A44',
  },
  metricTop: {
    marginBottom: 10,
  },
  metricIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#071120',
    fontSize: 30,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#9FB3C8',
    fontSize: 13,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#182A44',
  },
  sectionTitle: {
    color: '#071120',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyCopy: {
    color: '#9FB3C8',
    fontSize: 14,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertLevel: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
    marginRight: 10,
  },
  alertHigh: {
    backgroundColor: '#FF4D73',
  },
  alertMedium: {
    backgroundColor: '#FF4D73',
  },
  alertInfo: {
    backgroundColor: '#29B6FF',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '700',
  },
  alertDetail: {
    color: '#9FB3C8',
    marginTop: 4,
    fontSize: 13,
  },
  recordRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F8FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordMain: {
    flex: 1,
    paddingRight: 12,
  },
  recordTitle: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '700',
  },
  recordDetail: {
    color: '#9FB3C8',
    marginTop: 4,
    fontSize: 13,
  },
  recordSub: {
    color: '#9FB3C8',
    marginTop: 4,
    fontSize: 12,
  },
  recordDate: {
    color: '#FF4D73',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F8FF',
  },
  timelineMarker: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#071120',
    marginTop: 6,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    paddingRight: 10,
  },
  timelineType: {
    color: '#FF4D73',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timelineTitle: {
    color: '#071120',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  timelineDetail: {
    color: '#9FB3C8',
    marginTop: 4,
    fontSize: 12,
  },
  timelineDate: {
    color: '#9FB3C8',
    fontSize: 11,
    maxWidth: 88,
    textAlign: 'right',
  },
  pointerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  pointerText: {
    flex: 1,
    color: '#27496D',
    fontSize: 13,
    lineHeight: 18,
  },
});
