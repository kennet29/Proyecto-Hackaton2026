import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';

type ReminderRecord = {
  recordatoriocitaId: number;
  citaId: number;
  pacienteId: number;
  fecharecordatorio: string;
  mensaje: string;
  canal: string | null;
  estado: string | null;
};

type AppointmentRecord = {
  citaId: number;
  pacienteId: number;
  patientName: string | null;
  motivo: string | null;
  especialidad: string | null;
  fechacita: string | null;
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const formatDateTimeLabel = (value?: string | null) => {
  if (!value) return 'Fecha no disponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const resolveAppointmentName = (item: any) => {
  const fullName = `${item?.paciente?.nombres ?? ''} ${item?.paciente?.apellidos ?? ''}`.trim();
  return (
    normalizeText(fullName) ??
    normalizeText(item?.nombrePaciente) ??
    normalizeText(item?.displayName) ??
    normalizeText(item?.pacienteNombre) ??
    null
  );
};

const mapReminders = (payload: any[]): ReminderRecord[] =>
  payload
    .map((item) => {
      const recordatoriocitaId = Number(item?.recordatoriocitaId ?? item?.recordatoriocitaid ?? item?.id);
      const citaId = Number(item?.citaId ?? item?.citaid);
      const pacienteId = Number(item?.pacienteId ?? item?.pacienteid);
      const fecharecordatorio = normalizeText(item?.fecharecordatorio);
      const mensaje = normalizeText(item?.mensaje);

      if (
        !Number.isFinite(recordatoriocitaId) ||
        !Number.isFinite(citaId) ||
        !Number.isFinite(pacienteId) ||
        !fecharecordatorio ||
        !mensaje
      ) {
        return null;
      }

      return {
        recordatoriocitaId,
        citaId,
        pacienteId,
        fecharecordatorio,
        mensaje,
        canal: normalizeText(item?.canal),
        estado: normalizeText(item?.estado),
      } satisfies ReminderRecord;
    })
    .filter((item): item is ReminderRecord => Boolean(item));

const mapAppointments = (payload: any[]): AppointmentRecord[] =>
  payload
    .map((item) => {
      const citaId = Number(item?.citaId ?? item?.citaid ?? item?.id);
      const pacienteId = Number(item?.pacienteId ?? item?.pacienteid ?? item?.paciente?.pacienteId);
      if (!Number.isFinite(citaId) || !Number.isFinite(pacienteId)) {
        return null;
      }

      return {
        citaId,
        pacienteId,
        patientName: resolveAppointmentName(item),
        motivo: normalizeText(item?.motivo),
        especialidad: normalizeText(item?.especialidad),
        fechacita: normalizeText(item?.fechacita ?? item?.fecha),
      } satisfies AppointmentRecord;
    })
    .filter((item): item is AppointmentRecord => Boolean(item));

export function RecordatorioListScreen() {
  const { token } = useAuth();
  const headers = useMemo(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [remindersResult, appointmentsResult, patientsResult] = await Promise.allSettled([
        fetch(`${API_URL}/recordatoriocita`, { headers }),
        fetch(`${API_URL}/citamedica`, { headers }),
        fetchLinkedPatients(headers, { forceRefresh: true }),
      ]);

      if (remindersResult.status !== 'fulfilled') {
        throw remindersResult.reason;
      }

      const remindersPayload = await remindersResult.value.json().catch(() => null);
      if (!remindersResult.value.ok) {
        throw new Error(remindersPayload?.message ?? 'No se pudieron cargar los recordatorios');
      }

      setReminders(mapReminders(Array.isArray(remindersPayload) ? remindersPayload : []));

      if (appointmentsResult.status === 'fulfilled') {
        const appointmentPayload = await appointmentsResult.value.json().catch(() => null);
        if (appointmentsResult.value.ok) {
          setAppointments(mapAppointments(Array.isArray(appointmentPayload) ? appointmentPayload : []));
        } else {
          setAppointments([]);
        }
      } else {
        setAppointments([]);
      }

      if (patientsResult.status === 'fulfilled') {
        setPatients(patientsResult.value);
      } else {
        setPatients([]);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar la informacion');
      setReminders([]);
      setAppointments([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const patientNameById = useMemo(() => {
    const entries = patients.map((patient) => [patient.pacienteId, patient.displayName] as const);
    return Object.fromEntries(entries) as Record<number, string>;
  }, [patients]);

  const appointmentById = useMemo(() => {
    const entries = appointments.map((appointment) => [appointment.citaId, appointment] as const);
    return Object.fromEntries(entries) as Record<number, AppointmentRecord>;
  }, [appointments]);

  const patientsWithReminders = useMemo(() => {
    const ids = new Set(reminders.map((item) => item.pacienteId));
    return patients.filter((patient) => ids.has(patient.pacienteId));
  }, [patients, reminders]);

  const filteredReminders = useMemo(() => {
    const sorted = [...reminders].sort(
      (a, b) => new Date(a.fecharecordatorio).getTime() - new Date(b.fecharecordatorio).getTime(),
    );
    if (selectedPatientId === null) {
      return sorted;
    }
    return sorted.filter((item) => item.pacienteId === selectedPatientId);
  }, [reminders, selectedPatientId]);

  const pendingCount = useMemo(
    () => reminders.filter((item) => (item.estado ?? 'pendiente').toLowerCase().includes('pendiente')).length,
    [reminders],
  );

  const sentCount = Math.max(reminders.length - pendingCount, 0);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={appColors.text} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>NOTIFICACIONES</Text>
        <Text style={styles.title}>Recordatorios programados</Text>
        <Text style={styles.subtitle}>
          Revisa a quién está asignado cada aviso y cuál cita tiene vinculada.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{reminders.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{sentCount}</Text>
          <Text style={styles.summaryLabel}>Procesados</Text>
        </View>
      </View>

      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filtrar por persona</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPatientId === null && styles.filterChipActive]}
            onPress={() => setSelectedPatientId(null)}
          >
            <Text style={[styles.filterChipText, selectedPatientId === null && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {patientsWithReminders.map((patient) => {
            const isActive = selectedPatientId === patient.pacienteId;
            return (
              <TouchableOpacity
                key={patient.pacienteId}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedPatientId(patient.pacienteId)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {patient.displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={appColors.info} />
          <Text style={styles.loadingText}>Cargando recordatorios...</Text>
        </View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={24} color={appColors.textMuted} />
          <Text style={styles.emptyTitle}>No hay recordatorios</Text>
          <Text style={styles.emptyText}>
            {selectedPatientId === null
              ? 'Todavia no se han registrado avisos.'
              : 'Esta persona no tiene avisos programados.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredReminders.map((item) => {
            const appointment = appointmentById[item.citaId];
            const patientName =
              patientNameById[item.pacienteId] ??
              appointment?.patientName ??
              `Paciente #${item.pacienteId}`;
            const appointmentLabel =
              appointment?.motivo ??
              appointment?.especialidad ??
              `Cita #${item.citaId}`;
            const state = item.estado ?? 'pendiente';

            return (
              <View key={item.recordatoriocitaId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.personRow}>
                    <View style={styles.personIcon}>
                      <Ionicons name="person-outline" size={16} color={appColors.info} />
                    </View>
                    <View style={styles.personTextWrap}>
                      <Text style={styles.personName}>{patientName}</Text>
                      <Text style={styles.personSubtext}>Registro vinculado: {appointmentLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.stateBadge}>
                    <Text style={styles.stateBadgeText}>{state}</Text>
                  </View>
                </View>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaTitle}>Fecha del aviso</Text>
                  <Text style={styles.metaValue}>{formatDateTimeLabel(item.fecharecordatorio)}</Text>
                </View>

                {appointment?.fechacita ? (
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaTitle}>Fecha de la cita</Text>
                    <Text style={styles.metaValue}>{formatDateTimeLabel(appointment.fechacita)}</Text>
                  </View>
                ) : null}

                <View style={styles.messageCard}>
                  <Text style={styles.metaTitle}>Mensaje</Text>
                  <Text style={styles.messageText}>{item.mensaje}</Text>
                </View>

                <View style={styles.footerRow}>
                  <View style={styles.footerPill}>
                    <Ionicons name="send-outline" size={14} color={appColors.success} />
                    <Text style={styles.footerPillText}>{item.canal ?? 'Sin canal'}</Text>
                  </View>
                  <Text style={styles.footerId}>Recordatorio #{item.recordatoriocitaId}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: appColors.background,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  kicker: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: appColors.text,
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: appColors.surface,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
  },
  summaryValue: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: appColors.textSoft,
    fontSize: 12,
    marginTop: 6,
  },
  filterCard: {
    marginTop: 16,
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  filterTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  filterRow: {
    gap: 10,
    paddingTop: 12,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  filterChipActive: {
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderColor: colorAlpha(appColors.info, '60'),
  },
  filterChipText: {
    color: appColors.textSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: appColors.info,
  },
  loadingBox: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    color: appColors.textSoft,
    marginTop: 8,
  },
  emptyCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  emptyTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: appColors.textSoft,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  list: {
    gap: 14,
    marginTop: 16,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  personRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  personIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '18'),
  },
  personTextWrap: {
    flex: 1,
  },
  personName: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  personSubtext: {
    color: appColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  stateBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colorAlpha(appColors.success, '18'),
  },
  stateBadgeText: {
    color: appColors.success,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  metaBlock: {
    marginTop: 14,
  },
  metaTitle: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  messageCard: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  messageText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.success, '12'),
  },
  footerPillText: {
    color: appColors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  footerId: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: appColors.accent,
    marginTop: 16,
    textAlign: 'center',
  },
});
