import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { RootStackParamList } from '../navigation/types';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CompartirHistorial'>;

type DoctorRegistry = {
  usuarioId: number;
  titulo: string | null;
  especialidadprincipal: string | null;
  hospitaltrabajo: string | null;
  numerolicencia: string | null;
  estado: string | null;
};

type PermissionDuration = '15m' | '1h' | '1d';
type PermissionType = 'temporal' | 'permanente';
type ShareSectionKey =
  | 'resumenClinico'
  | 'consultasMedicas'
  | 'examenesClinicos'
  | 'medicaciones'
  | 'vacunas'
  | 'citasMedicas'
  | 'saludMental';

type GeneratedShareLink = {
  shareUrl: string;
  appUrl: string;
  token: string;
  expiresAt: string;
  patientName: string;
  doctorLabel: string;
};

const SECTION_OPTIONS: Array<{ key: ShareSectionKey; label: string; helper: string }> = [
  { key: 'resumenClinico', label: 'Resumen', helper: 'Datos principales del expediente' },
  { key: 'consultasMedicas', label: 'Consultas', helper: 'Atenciones medicas registradas' },
  { key: 'examenesClinicos', label: 'Examenes', helper: 'Resultados y examenes clinicos' },
  { key: 'medicaciones', label: 'Medicacion', helper: 'Tratamientos y medicamentos' },
  { key: 'vacunas', label: 'Vacunas', helper: 'Dosis y proximas aplicaciones' },
  { key: 'citasMedicas', label: 'Citas', helper: 'Citas agendadas y seguimiento' },
  { key: 'saludMental', label: 'Salud mental', helper: 'Historial y alertas relacionadas' },
];

const DEFAULT_SECTIONS: ShareSectionKey[] = [
  'resumenClinico',
  'consultasMedicas',
  'examenesClinicos',
  'medicaciones',
];

const SHARE_DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 180, label: '3 horas' },
  { value: 1440, label: '24 horas' },
] as const;

const PERMISSION_DURATION_OPTIONS: Array<{ value: PermissionDuration; label: string }> = [
  { value: '15m', label: '15 min' },
  { value: '1h', label: '1 hora' },
  { value: '1d', label: '1 dia' },
];

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const extractShareToken = (shareUrl: string, fallbackToken?: string | null) => {
  if (fallbackToken) return String(fallbackToken);
  try {
    const parsed = new URL(shareUrl);
    return parsed.pathname.split('/').filter(Boolean).pop() ?? shareUrl;
  } catch {
    return shareUrl.split('/').filter(Boolean).pop() ?? shareUrl;
  }
};

const buildDoctorLabel = (doctor: DoctorRegistry) => {
  return `Medico #${doctor.usuarioId}`;
};

const buildDoctorSummary = (doctor: DoctorRegistry) => {
  return [doctor.especialidadprincipal, doctor.hospitaltrabajo].filter(Boolean).join(' · ') || 'Sin detalles';
};

const mapDoctors = (payload: any[]): DoctorRegistry[] =>
  payload
    .map((item) => {
      const usuarioId = Number(item?.usuarioId ?? item?.usuarioid);
      if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
        return null;
      }
      return {
        usuarioId,
        titulo: normalizeText(item?.titulo),
        especialidadprincipal: normalizeText(item?.especialidadprincipal),
        hospitaltrabajo: normalizeText(item?.hospitaltrabajo),
        numerolicencia: normalizeText(item?.numerolicencia),
        estado: normalizeText(item?.estado),
      } satisfies DoctorRegistry;
    })
    .filter((item): item is DoctorRegistry => Boolean(item));

export function CompartirHistorialScreen({ route }: Props) {
  const { token, user } = useAuth();
  const initialPatientId = route.params?.pacienteId;
  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [doctors, setDoctors] = useState<DoctorRegistry[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId ? String(initialPatientId) : '',
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [permissionType, setPermissionType] = useState<PermissionType>('temporal');
  const [permissionDuration, setPermissionDuration] = useState<PermissionDuration>('1h');
  const [shareDurationMinutes, setShareDurationMinutes] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [manualDoctorId, setManualDoctorId] = useState('');
  const [selectedSections, setSelectedSections] = useState<ShareSectionKey[]>(DEFAULT_SECTIONS);
  const [generatedLink, setGeneratedLink] = useState<GeneratedShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient.pacienteId) === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.usuarioId) === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  const effectiveDoctorId = useMemo(() => {
    const selected = Number(selectedDoctorId);
    if (Number.isFinite(selected) && selected > 0) {
      return selected;
    }
    const manual = Number(manualDoctorId);
    if (Number.isFinite(manual) && manual > 0) {
      return manual;
    }
    return null;
  }, [manualDoctorId, selectedDoctorId]);

  const loadData = useCallback(async () => {
    if (!token) {
      setError('Necesitas iniciar sesion para compartir historial.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [patientItems, doctorsResponse] = await Promise.all([
        fetchLinkedPatients(authHeaders, { forceRefresh: true }),
        fetch(`${API_URL}/medicoregistro`, { headers: authHeaders }),
      ]);

      const doctorsPayload = await doctorsResponse.json().catch(() => null);
      if (!doctorsResponse.ok) {
        throw new Error(doctorsPayload?.message ?? 'No se pudo cargar la lista de medicos');
      }

      const mappedDoctors = mapDoctors(Array.isArray(doctorsPayload) ? doctorsPayload : []);
      const approvedDoctors = mappedDoctors.filter((doctor) => (doctor.estado ?? '').toLowerCase() === 'aprobado');
      const finalDoctors = approvedDoctors.length ? approvedDoctors : mappedDoctors;

      setPatients(patientItems);
      setDoctors(finalDoctors);

      const routePatient = initialPatientId ? String(initialPatientId) : '';
      const routePatientExists = patientItems.some(
        (patient) => String(patient.pacienteId) === routePatient,
      );

      if (routePatient && routePatientExists) {
        setSelectedPatientId(routePatient);
      } else if (!selectedPatientId && patientItems.length > 0) {
        setSelectedPatientId(String(patientItems[0].pacienteId));
      }
      if (!selectedDoctorId && finalDoctors.length > 0) {
        setSelectedDoctorId(String(finalDoctors[0].usuarioId));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la informacion');
      setPatients([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, initialPatientId, selectedDoctorId, selectedPatientId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSection = (section: ShareSectionKey) => {
    setSelectedSections((current) => {
      if (current.includes(section)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== section);
      }
      return [...current, section];
    });
  };

  const handleGenerateLink = async () => {
    if (!selectedPatientId) {
      Alert.alert('Falta la persona', 'Selecciona la persona cuyo historial quieres compartir.');
      return;
    }

    if (!effectiveDoctorId) {
      Alert.alert('Falta el medico', 'Selecciona un usuario medico o escribe su ID de usuario.');
      return;
    }

    if (selectedSections.length === 0) {
      Alert.alert('Faltan secciones', 'Selecciona al menos una parte del historial para compartir.');
      return;
    }

    setSubmitting(true);
    try {
      const permissionResponse = await fetch(`${API_URL}/permiso-acceso/paciente/${selectedPatientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          medicoId: effectiveDoctorId,
          tipo: permissionType,
          duracion: permissionType === 'temporal' ? permissionDuration : undefined,
          notas: notes.trim() || undefined,
        }),
      });

      const permissionPayload = await permissionResponse.json().catch(() => null);
      if (!permissionResponse.ok) {
        throw new Error(
          permissionPayload?.message ??
            'No se pudo crear el permiso. El usuario seleccionado debe tener rol medico.',
        );
      }

      const permisoId = Number(permissionPayload?.id ?? permissionPayload?.permisoId);
      if (!Number.isFinite(permisoId)) {
        throw new Error('El backend no devolvio un permiso valido');
      }

      const shareResponse = await fetch(`${API_URL}/permiso-acceso/${permisoId}/enlace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          duracionMinutos: shareDurationMinutes,
          secciones: selectedSections,
        }),
      });

      const sharePayload = await shareResponse.json().catch(() => null);
      if (!shareResponse.ok) {
        throw new Error(sharePayload?.message ?? 'No se pudo generar el enlace para compartir');
      }

      const doctorLabel = selectedDoctor
        ? `${buildDoctorLabel(selectedDoctor)}${selectedDoctor.especialidadprincipal ? ` · ${selectedDoctor.especialidadprincipal}` : ''}`
        : `Medico #${effectiveDoctorId}`;
      const shareUrl = String(sharePayload?.shareUrl ?? '');
      const shareToken = extractShareToken(shareUrl, sharePayload?.token);

      setGeneratedLink({
        shareUrl,
        token: shareToken,
        appUrl: `gestionsalud://historial-compartido/${encodeURIComponent(shareToken)}`,
        expiresAt: String(sharePayload?.expiresAt ?? ''),
        patientName: selectedPatient?.displayName ?? `Paciente #${selectedPatientId}`,
        doctorLabel,
      });
      Alert.alert('Enlace creado', 'El historial ya se puede compartir por enlace.');
    } catch (submitError) {
      Alert.alert('Error', submitError instanceof Error ? submitError.message : 'No se pudo generar el enlace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!generatedLink) {
      return;
    }

    try {
      await Share.share({
        message:
          `Te comparto el historial medico de ${generatedLink.patientName}. ` +
          `Abre en la app: ${generatedLink.appUrl}. ` +
          `Codigo: ${generatedLink.token}. ` +
          `Enlace web: ${generatedLink.shareUrl}. ` +
          `Expira: ${formatDateTime(generatedLink.expiresAt)}.`,
        url: generatedLink.shareUrl,
      });
    } catch (shareError) {
      Alert.alert('No se pudo compartir', shareError instanceof Error ? shareError.message : 'Intenta nuevamente');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>GESTION</Text>
        <Text style={styles.title}>Compartir historial medico</Text>
        <Text style={styles.subtitle}>
          Crea un permiso para otro usuario. El backend solo lo aprobara si ese usuario tiene rol medico.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={appColors.info} />
          <Text style={styles.loadingText}>Cargando personas y medicos...</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Persona</Text>
            <Text style={styles.helperText}>Selecciona de quién vas a compartir la informacion.</Text>
            <View style={styles.chipList}>
              {patients.map((patient) => {
                const isActive = String(patient.pacienteId) === selectedPatientId;
                return (
                  <TouchableOpacity
                    key={patient.pacienteId}
                    style={[styles.personChip, isActive && styles.personChipActive]}
                    onPress={() => setSelectedPatientId(String(patient.pacienteId))}
                  >
                    <Text style={[styles.personChipText, isActive && styles.personChipTextActive]}>
                      {patient.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Medico</Text>
            <Text style={styles.helperText}>
              Toca un medico disponible o escribe el ID de un usuario con permiso de medico.
            </Text>

            {doctors.length > 0 ? (
              <View style={styles.doctorList}>
                {doctors.map((doctor) => {
                  const isActive = String(doctor.usuarioId) === selectedDoctorId;
                  return (
                    <TouchableOpacity
                      key={doctor.usuarioId}
                      style={[styles.doctorCard, isActive && styles.doctorCardActive]}
                      onPress={() => {
                        setSelectedDoctorId(String(doctor.usuarioId));
                        setManualDoctorId('');
                      }}
                    >
                      <View style={styles.doctorHeader}>
                        <Text style={styles.doctorTitle}>{buildDoctorLabel(doctor)}</Text>
                        {doctor.estado ? (
                          <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>{doctor.estado}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.doctorSubtitle}>
                        {doctor.titulo ?? 'Medico registrado'}
                      </Text>
                      <Text style={styles.doctorMeta}>{buildDoctorSummary(doctor)}</Text>
                      {doctor.numerolicencia ? (
                        <Text style={styles.doctorMeta}>Licencia: {doctor.numerolicencia}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="medkit-outline" size={20} color={appColors.textMuted} />
                <Text style={styles.emptyText}>
                  No se encontraron medicos en el catalogo. Puedes escribir el ID manualmente.
                </Text>
              </View>
            )}

            <Text style={styles.label}>ID del medico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: 12"
              placeholderTextColor={appColors.textMuted}
              keyboardType="numeric"
              value={manualDoctorId}
              onChangeText={(value) => {
                setManualDoctorId(value.replace(/[^0-9]/g, ''));
                setSelectedDoctorId('');
              }}
            />
            <View style={styles.medicoRequirementBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={appColors.success} />
              <Text style={styles.medicoRequirementText}>
                El permiso se crea solamente si el usuario destino tiene rol medico en el backend.
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Alcance del permiso</Text>
            <Text style={styles.helperText}>Define cuánto tiempo vive el permiso principal.</Text>

            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentButton, permissionType === 'temporal' && styles.segmentButtonActive]}
                onPress={() => setPermissionType('temporal')}
              >
                <Text style={[styles.segmentButtonText, permissionType === 'temporal' && styles.segmentButtonTextActive]}>
                  Temporal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, permissionType === 'permanente' && styles.segmentButtonActive]}
                onPress={() => setPermissionType('permanente')}
              >
                <Text
                  style={[styles.segmentButtonText, permissionType === 'permanente' && styles.segmentButtonTextActive]}
                >
                  Permanente
                </Text>
              </TouchableOpacity>
            </View>

            {permissionType === 'temporal' ? (
              <View style={styles.chipList}>
                {PERMISSION_DURATION_OPTIONS.map((option) => {
                  const isActive = permissionDuration === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionChip, isActive && styles.optionChipActive]}
                      onPress={() => setPermissionDuration(option.value)}
                    >
                      <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <Text style={styles.label}>Nota opcional</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Ejemplo: compartir para segunda opinion"
              placeholderTextColor={appColors.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>4. Que quieres compartir</Text>
            <Text style={styles.helperText}>
              Marca solo las partes del historial que el medico necesita revisar.
            </Text>
            <View style={styles.sectionGrid}>
              {SECTION_OPTIONS.map((option) => {
                const isActive = selectedSections.includes(option.key);
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.sectionOption, isActive && styles.sectionOptionActive]}
                    onPress={() => toggleSection(option.key)}
                  >
                    <Text style={[styles.sectionOptionLabel, isActive && styles.sectionOptionLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.sectionOptionHelper}>{option.helper}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>5. Tiempo del enlace</Text>
            <Text style={styles.helperText}>Este es el tiempo durante el cual el enlace funcionara.</Text>
            <View style={styles.chipList}>
              {SHARE_DURATION_OPTIONS.map((option) => {
                const isActive = shareDurationMinutes === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setShareDurationMinutes(option.value)}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={() => void handleGenerateLink()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={appColors.text} />
              ) : (
                <>
                  <Ionicons name="link-outline" size={18} color={appColors.text} />
                  <Text style={styles.primaryButtonText}>Generar enlace</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {generatedLink ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle-outline" size={22} color={appColors.success} />
                <Text style={styles.resultTitle}>Enlace listo</Text>
              </View>
              <Text style={styles.resultText}>Paciente: {generatedLink.patientName}</Text>
              <Text style={styles.resultText}>Medico: {generatedLink.doctorLabel}</Text>
              <Text style={styles.resultText}>Expira: {formatDateTime(generatedLink.expiresAt)}</Text>
              <Text style={styles.resultLabel}>Enlace interno de app</Text>
              <View style={styles.linkBox}>
                <Text selectable style={styles.linkText}>{generatedLink.appUrl}</Text>
              </View>
              <Text style={styles.resultLabel}>Codigo para pegar en la app</Text>
              <View style={styles.linkBox}>
                <Text selectable style={styles.codeText}>{generatedLink.token}</Text>
              </View>
              <Text style={styles.resultLabel}>Enlace web</Text>
              <View style={styles.linkBox}>
                <Text selectable style={styles.linkText}>{generatedLink.shareUrl}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton} onPress={() => void handleShare()}>
                <Ionicons name="share-social-outline" size={18} color={appColors.background} />
                <Text style={styles.shareButtonText}>Compartir enlace</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.footerNote}>
        Este enlace debe compartirse solo con el medico autorizado. Usuario activo: {user?.username ?? 'usuario'}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: appColors.background,
    gap: 16,
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
  loadingCard: {
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  loadingText: {
    marginTop: 10,
    color: appColors.textSoft,
  },
  sectionCard: {
    backgroundColor: appColors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  helperText: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  personChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  personChipActive: {
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderColor: colorAlpha(appColors.info, '60'),
  },
  personChipText: {
    color: appColors.textSoft,
    fontWeight: '700',
  },
  personChipTextActive: {
    color: appColors.info,
  },
  doctorList: {
    gap: 12,
  },
  doctorCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  doctorCardActive: {
    borderColor: appColors.success,
    backgroundColor: colorAlpha(appColors.success, '12'),
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  doctorTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  doctorSubtitle: {
    color: appColors.info,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  doctorMeta: {
    color: appColors.textSoft,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colorAlpha(appColors.success, '16'),
  },
  statusPillText: {
    color: appColors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  emptyText: {
    color: appColors.textSoft,
    flex: 1,
    lineHeight: 18,
  },
  label: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
    color: appColors.text,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  medicoRequirementBox: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: colorAlpha(appColors.success, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '45'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medicoRequirementText: {
    color: appColors.textSoft,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  segmentButtonActive: {
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderColor: colorAlpha(appColors.info, '60'),
  },
  segmentButtonText: {
    color: appColors.textSoft,
    fontWeight: '800',
  },
  segmentButtonTextActive: {
    color: appColors.info,
  },
  optionChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  optionChipActive: {
    backgroundColor: colorAlpha(appColors.success, '14'),
    borderColor: colorAlpha(appColors.success, '55'),
  },
  optionChipText: {
    color: appColors.textSoft,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: appColors.success,
  },
  sectionGrid: {
    gap: 12,
  },
  sectionOption: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  sectionOptionActive: {
    backgroundColor: colorAlpha(appColors.accent, '12'),
    borderColor: colorAlpha(appColors.accent, '55'),
  },
  sectionOptionLabel: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionOptionLabelActive: {
    color: appColors.accent,
  },
  sectionOptionHelper: {
    color: appColors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resultCard: {
    backgroundColor: colorAlpha(appColors.success, '10'),
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '65'),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  resultLabel: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  linkBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  linkText: {
    color: appColors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  codeText: {
    color: appColors.info,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  shareButton: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: appColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  shareButtonText: {
    color: appColors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: appColors.accent,
    marginTop: 8,
    textAlign: 'center',
  },
  footerNote: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
