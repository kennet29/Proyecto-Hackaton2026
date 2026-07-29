import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { fetchLinkedPatients, LinkedPatient } from '../utils/linkedPatients';

type Props = NativeStackScreenProps<RootStackParamList, 'CompartirHistorial'>;

type GeneratedCode = {
  code: string;
  expiresAt: string;
  pacienteId: number;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('es-NI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export function CompartirHistorialScreen({ route }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 920;
  const { token } = useAuth();
  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [patientId, setPatientId] = useState(
    route.params?.pacienteId ? String(route.params.pacienteId) : '',
  );
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = patients.find(
    (item) => String(item.pacienteId) === patientId,
  );
  const load = useCallback(async () => {
    if (!token) {
      setError('Inicia sesión para compartir un expediente.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const patientItems = await fetchLinkedPatients(headers, {
        forceRefresh: true,
      });
      setPatients(patientItems);
      setPatientId((current) => {
        if (
          current &&
          patientItems.some((item) => String(item.pacienteId) === current)
        ) {
          return current;
        }
        return String(patientItems[0]?.pacienteId ?? '');
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo preparar el acceso.',
      );
    } finally {
      setLoading(false);
    }
  }, [headers, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const generateCode = async () => {
    if (!patientId) {
      Alert.alert(
        'Selecciona el expediente',
        'Elige el paciente cuyo historial deseas compartir.',
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/permiso-acceso/paciente/${patientId}/codigo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({
            notas: notes.trim() || undefined,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'No se pudo generar el código.');
      }
      setGenerated({
        code: String(payload.code),
        expiresAt: String(payload.expiresAt),
        pacienteId: Number(payload.pacienteId),
      });
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'No se pudo generar el código.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const shareCode = async () => {
    if (!generated) return;
    await Share.share({
      message:
        `Código temporal de Gestión Salud: ${generated.code}. ` +
        `Úsalo con tu cuenta médica. El código vence el ${formatDateTime(
          generated.expiresAt,
        )} y habilita una hora de acceso al expediente.`,
    });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.hero, desktop && styles.heroDesktop]}>
        <View style={styles.heroIcon}>
          <Ionicons name="key-outline" size={30} color={appColors.info} />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.eyebrow}>ACCESO MÉDICO TEMPORAL</AppText>
          <AppText style={styles.title}>Comparte tu historial con 6 números</AppText>
          <AppText style={styles.subtitle}>
            El primer médico verificado que introduzca el código recibirá el
            permiso, que finalizará automáticamente una hora después.
          </AppText>
        </View>
        <View style={styles.timePill}>
          <Ionicons name="time-outline" size={17} color={appColors.success} />
          <AppText style={styles.timePillText}>1 hora</AppText>
        </View>
      </View>

      <View style={styles.securityStrip}>
        <SecurityItem icon="shield-checkmark-outline" text="Código único" />
        <SecurityItem icon="medkit-outline" text="Se asigna al usarlo" />
        <SecurityItem icon="timer-outline" text="Expiración automática" />
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={appColors.info} size="large" />
          <AppText style={styles.loadingText}>Preparando tus expedientes...</AppText>
        </View>
      ) : (
        <View style={[styles.layout, desktop && styles.layoutDesktop]}>
          <View style={styles.formColumn}>
            <StepCard number="1" title="Selecciona el expediente">
              <AppText style={styles.helper}>
                Elige el paciente cuyo historial deseas compartir.
              </AppText>
              <View style={styles.choiceGrid}>
                {patients.map((patient) => {
                  const active = String(patient.pacienteId) === patientId;
                  return (
                    <TouchableOpacity
                      key={patient.pacienteId}
                      style={[styles.choiceCard, active && styles.choiceCardActive]}
                      onPress={() => {
                        setPatientId(String(patient.pacienteId));
                        setGenerated(null);
                      }}
                    >
                      <View style={[styles.choiceIcon, active && styles.choiceIconActive]}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={active ? appColors.background : appColors.info}
                        />
                      </View>
                      <AppText style={[styles.choiceTitle, active && styles.choiceTitleActive]}>
                        {patient.displayName}
                      </AppText>
                      {active ? (
                        <Ionicons name="checkmark-circle" size={20} color={appColors.success} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!patients.length ? (
                <AppText style={styles.emptyText}>No hay pacientes asociados a tu cuenta.</AppText>
              ) : null}
            </StepCard>

            <StepCard number="2" title="Nota opcional">
              <AppTextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ejemplo: revisión de resultados y actualización de tratamiento"
                placeholderTextColor={appColors.textMuted}
                multiline
                maxLength={200}
                style={styles.notesInput}
              />
            </StepCard>
          </View>

          <View style={[styles.codePanel, desktop && styles.codePanelDesktop]}>
            <AppText style={styles.panelEyebrow}>CÓDIGO DE ACCESO</AppText>
            {generated ? (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={28} color={appColors.background} />
                </View>
                <AppText style={styles.codeLabel}>Comparte estos 6 números</AppText>
                <View style={styles.codeBox}>
                  {generated.code.split('').map((digit, index) => (
                    <View key={`${digit}-${index}`} style={styles.digitBox}>
                      <AppText style={styles.digit}>{digit}</AppText>
                    </View>
                  ))}
                </View>
                <AppText style={styles.codeDescription}>
                  Expediente de {selectedPatient?.displayName}. El código se
                  asignará al primer médico verificado que lo utilice.
                </AppText>
                <View style={styles.expirationBox}>
                  <Ionicons name="hourglass-outline" size={17} color="#F5B942" />
                  <AppText style={styles.expirationText}>
                    Código válido hasta {formatDateTime(generated.expiresAt)}
                  </AppText>
                </View>
                <TouchableOpacity style={styles.shareButton} onPress={() => void shareCode()}>
                  <Ionicons name="share-social-outline" size={18} color={appColors.background} />
                  <AppText style={styles.shareButtonText}>Compartir código</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setGenerated(null)}
                >
                  <AppText style={styles.secondaryButtonText}>Generar uno nuevo</AppText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="lock-closed-outline" size={34} color={appColors.info} />
                </View>
                <AppText style={styles.panelTitle}>Acceso protegido por una hora</AppText>
                <AppText style={styles.panelText}>
                  El médico podrá consultar y modificar el expediente únicamente
                  durante la ventana autorizada.
                </AppText>
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    (submitting || !patientId) && styles.buttonDisabled,
                  ]}
                  disabled={submitting || !patientId}
                  onPress={() => void generateCode()}
                >
                  {submitting ? (
                    <ActivityIndicator color={appColors.background} />
                  ) : (
                    <>
                      <Ionicons name="key-outline" size={19} color={appColors.background} />
                      <AppText style={styles.generateButtonText}>Generar código único</AppText>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StepCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <AppText style={styles.stepNumberText}>{number}</AppText>
        </View>
        <AppText style={styles.stepTitle}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function SecurityItem({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.securityItem}>
      <Ionicons name={icon} size={17} color={appColors.success} />
      <AppText style={styles.securityText}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
  content: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: 16, paddingBottom: 50 },
  hero: { padding: 22, borderRadius: 24, borderWidth: 1, borderColor: appColors.borderStrong, backgroundColor: appColors.surfaceStrong },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28 },
  heroIcon: { width: 62, height: 62, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '16'), marginRight: 17 },
  heroCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: appColors.text, fontSize: 28, lineHeight: 35, fontWeight: '900', marginTop: 5 },
  subtitle: { color: appColors.textSoft, fontSize: 13, lineHeight: 20, marginTop: 6, maxWidth: 720 },
  timePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9, marginTop: 14, backgroundColor: colorAlpha(appColors.success, '13') },
  timePillText: { color: appColors.success, fontSize: 11, fontWeight: '900' },
  securityStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 14 },
  securityItem: { flexGrow: 1, minWidth: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  securityText: { color: appColors.textSoft, fontSize: 10, fontWeight: '800' },
  loadingCard: { minHeight: 260, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: appColors.surface },
  loadingText: { color: appColors.textMuted, marginTop: 12 },
  layout: { gap: 15 },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  formColumn: { flex: 1, gap: 13 },
  stepCard: { padding: 18, borderRadius: 19, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  stepNumber: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: appColors.info },
  stepNumberText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  stepTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', marginLeft: 10 },
  helper: { color: appColors.textMuted, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  choiceCard: { minWidth: 190, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  choiceCardActive: { borderColor: appColors.success, backgroundColor: colorAlpha(appColors.success, '0C') },
  choiceIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '15') },
  choiceIconActive: { backgroundColor: appColors.success },
  choiceTitle: { flex: 1, color: appColors.textSoft, fontSize: 12, fontWeight: '800' },
  choiceTitleActive: { color: appColors.text },
  doctorList: { gap: 9 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  doctorCardActive: { borderColor: appColors.success, backgroundColor: colorAlpha(appColors.success, '0C') },
  doctorAvatar: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11, backgroundColor: colorAlpha(appColors.info, '15') },
  doctorCopy: { flex: 1, minWidth: 0 },
  doctorName: { color: appColors.text, fontSize: 13, fontWeight: '900' },
  doctorMeta: { color: appColors.textSoft, fontSize: 10, marginTop: 3 },
  license: { color: appColors.info, fontSize: 9, fontWeight: '800', marginTop: 4 },
  notesInput: { minHeight: 90, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted, color: appColors.text, fontSize: 12, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  emptyText: { color: appColors.textMuted, fontSize: 11, fontStyle: 'italic' },
  codePanel: { width: '100%', padding: 22, alignItems: 'center', borderRadius: 21, borderWidth: 1, borderColor: appColors.borderStrong, backgroundColor: appColors.surfaceStrong },
  codePanelDesktop: { width: 380, position: 'sticky', top: 14 } as any,
  panelEyebrow: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  placeholderIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 23, marginTop: 22, backgroundColor: colorAlpha(appColors.info, '14') },
  panelTitle: { color: appColors.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  panelText: { color: appColors.textMuted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  generateButton: { width: '100%', minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, marginTop: 20, backgroundColor: appColors.info },
  generateButtonText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  buttonDisabled: { opacity: 0.45 },
  successIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, marginTop: 18, backgroundColor: appColors.success },
  codeLabel: { color: appColors.textSoft, fontSize: 11, fontWeight: '800', marginTop: 14 },
  codeBox: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginVertical: 13 },
  digitBox: { width: 43, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 11, borderWidth: 1, borderColor: colorAlpha(appColors.info, '70'), backgroundColor: appColors.backgroundMuted },
  digit: { color: appColors.text, fontSize: 29, fontWeight: '900' },
  codeDescription: { color: appColors.textSoft, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  expirationBox: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 11, marginTop: 13, backgroundColor: colorAlpha('#F5B942', '10') },
  expirationText: { flex: 1, color: '#F5B942', fontSize: 9, lineHeight: 14, fontWeight: '700' },
  shareButton: { width: '100%', minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, marginTop: 15, backgroundColor: appColors.success },
  shareButtonText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 39, justifyContent: 'center', marginTop: 7 },
  secondaryButtonText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  errorText: { color: appColors.accent, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 },
});
