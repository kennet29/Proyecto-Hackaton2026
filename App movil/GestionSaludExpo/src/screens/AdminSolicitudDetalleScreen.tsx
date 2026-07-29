import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';
import {
  DEMO_SOLICITUDES,
  Estado,
  SolicitudMedica,
  updateDemoSolicitud,
} from './AdminSolicitudesMedicasScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSolicitudDetalle'>;
type ApiError = { message?: string | string[]; error?: string };

const isAdminRole = (role?: string) => {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'superadmin';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const getErrorMessage = (body: ApiError | null) => {
  if (Array.isArray(body?.message)) return body.message.join('\n');
  return body?.message || body?.error || 'No fue posible completar la operación.';
};

const statusMeta = (estado: Estado) => {
  if (estado === 'aprobado') return { label: 'Aprobada', color: '#168A55' };
  if (estado === 'rechazado') return { label: 'Rechazada', color: '#C8324E' };
  if (estado === 'documentos_solicitados') {
    return { label: 'Documentos solicitados', color: '#8758C7' };
  }
  return { label: 'Pendiente', color: '#A86F00' };
};

export function AdminSolicitudDetalleScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const desktop = Platform.OS === 'web' && width >= 1040;
  const { token, user } = useAuth();
  const [solicitud, setSolicitud] = useState<SolicitudMedica | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !isAdminRole(user?.role)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let record: SolicitudMedica | undefined;
        if (route.params.demo) {
          record = DEMO_SOLICITUDES.find(
            (item) => item.medicoregistroId === route.params.solicitudId,
          );
        } else {
          const response = await apiFetch('/medicoregistro', {
            headers: buildJsonHeaders(token),
          });
          const body = await parseJsonResponse<SolicitudMedica[] & ApiError>(response);
          if (!response.ok) throw new Error(getErrorMessage(body));
          record = Array.isArray(body)
            ? body.find(
                (item) =>
                  item.medicoregistroId === Number(route.params.solicitudId),
              )
            : undefined;
        }
        if (!record) throw new Error('La solicitud médica no fue encontrada.');
        setSolicitud({ ...record });
        setReviewNote(record.observaciones || '');
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la solicitud.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [route.params.demo, route.params.solicitudId, token, user?.role]);

  const applyDecision = async (estado: Estado) => {
    if (!solicitud || saving) return;
    setSaving(estado);
    setError(null);
    setSuccess(null);
    const fallbackNote =
      estado === 'aprobado'
        ? 'Solicitud aprobada. Credenciales profesionales verificadas.'
        : estado === 'rechazado'
          ? 'Solicitud rechazada durante la revisión administrativa.'
          : 'Se solicitaron nuevamente los documentos para completar la revisión.';
    const changes: Partial<SolicitudMedica> = {
      estado,
      observaciones: reviewNote.trim() || fallbackNote,
      fecharevision: new Date().toISOString(),
    };

    try {
      if (route.params.demo) {
        updateDemoSolicitud(solicitud.medicoregistroId, changes);
        setSolicitud((current) => (current ? { ...current, ...changes } : current));
      } else {
        const response = await apiFetch(
          `/medicoregistro/${solicitud.medicoregistroId}`,
          {
            method: 'PATCH',
            headers: buildJsonHeaders(token),
            body: JSON.stringify(changes),
          },
        );
        const body = await parseJsonResponse<
          (Partial<SolicitudMedica> & ApiError) | null
        >(response);
        if (!response.ok) throw new Error(getErrorMessage(body));
        setSolicitud((current) =>
          current ? { ...current, ...changes, ...(body || {}) } : current,
        );
      }
      setReviewNote(changes.observaciones || '');
      setSuccess(
        route.params.demo
          ? 'Cambio simulado correctamente. No se guardó en la base de datos.'
          : 'La solicitud fue actualizada correctamente.',
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo actualizar la solicitud.',
      );
    } finally {
      setSaving(null);
    }
  };

  if (!token || !isAdminRole(user?.role)) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="shield-outline" size={42} color={appColors.accent} />
        <AppText style={styles.stateTitle}>Acceso administrativo requerido</AppText>
        <AppText style={styles.stateText}>
          Debes iniciar sesión con una cuenta administradora para ver este expediente.
        </AppText>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={() =>
            token
              ? navigation.navigate('MenuPrincipal')
              : navigation.navigate('Login', { afterLogin: 'AdminSolicitudes' })
          }
        >
          <AppText style={styles.stateButtonText}>{token ? 'Volver' : 'Iniciar sesión'}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={appColors.info} size="large" />
        <AppText style={styles.stateText}>Cargando expediente...</AppText>
      </View>
    );
  }

  if (!solicitud) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="alert-circle-outline" size={42} color={appColors.accent} />
        <AppText style={styles.stateTitle}>Solicitud no disponible</AppText>
        <AppText style={styles.stateText}>{error}</AppText>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={() => navigation.navigate('AdminSolicitudes')}
        >
          <AppText style={styles.stateButtonText}>Volver a la lista</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = statusMeta(solicitud.estado);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <View style={styles.topbar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('AdminSolicitudes')}
          >
            <Ionicons name="arrow-back" size={18} color={appColors.text} />
            <AppText style={styles.backText}>Solicitudes</AppText>
          </TouchableOpacity>
          <View style={[styles.statusBadge, { borderColor: meta.color }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <AppText style={[styles.statusText, { color: meta.color }]}>
              {meta.label}
            </AppText>
          </View>
        </View>

        {route.params.demo ? (
          <View style={styles.demoBanner}>
            <Ionicons name="flask-outline" size={18} color="#F5B942" />
            <AppText style={styles.demoText}>
              Expediente de demostración: las decisiones no afectan la base de datos.
            </AppText>
          </View>
        ) : null}

        <View style={[styles.layout, desktop && styles.layoutDesktop]}>
          <View style={[styles.paper, compact && styles.paperCompact]}>
            <View style={[styles.paperHeader, compact && styles.paperHeaderCompact]}>
              <View style={styles.brand}>
                <View style={styles.logo}>
                  <Ionicons name="medkit" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.brandCopy}>
                  <AppText style={styles.brandName}>GESTIÓN SALUD</AppText>
                  <AppText style={styles.brandSub}>Registro de profesionales médicos</AppText>
                </View>
              </View>
              <View style={styles.folio}>
                <AppText style={styles.folioLabel}>SOLICITUD N.º</AppText>
                <AppText style={styles.folioValue}>
                  {String(solicitud.medicoregistroId).padStart(6, '0')}
                </AppText>
                <AppText style={styles.folioDate}>
                  {formatDate(solicitud.fechasolicitud)}
                </AppText>
              </View>
            </View>

            <View style={styles.titleBlock}>
              <AppText style={styles.paperTitle}>SOLICITUD DE ACREDITACIÓN MÉDICA</AppText>
              <AppText style={styles.paperSubtitle}>
                Formulario de ingreso y verificación de credenciales profesionales
              </AppText>
            </View>

            <PaperSection number="1" title="Datos del solicitante">
              <View style={styles.grid}>
                <PaperField
                  label="Cuenta de usuario"
                  value={solicitud.usuario?.username || `Usuario ${solicitud.usuarioId}`}
                  compact={compact}
                />
                <PaperField label="Correo electrónico" value={solicitud.usuario?.email} compact={compact} />
                <PaperField label="Ciudad" value={solicitud.usuario?.city} compact={compact} />
                <PaperField label="País" value={solicitud.usuario?.country} compact={compact} />
              </View>
            </PaperSection>

            <PaperSection number="2" title="Información profesional">
              <View style={styles.grid}>
                <PaperField label="Título profesional" value={solicitud.titulo} compact={compact} />
                <PaperField label="Especialidad" value={solicitud.especialidadprincipal} compact={compact} />
                <PaperField label="Centro de trabajo" value={solicitud.hospitaltrabajo} compact={compact} />
                <PaperField label="Entidad certificadora" value={solicitud.entidadcertificadora} compact={compact} />
                <PaperField label="Número de licencia" value={solicitud.numerolicencia} compact={compact} />
                <PaperField label="Código MINSA" value={solicitud.codigominsa} compact={compact} />
              </View>
            </PaperSection>

            <PaperSection number="3" title="Documentación presentada">
              <DocumentRow label="Título profesional" available={solicitud.tieneFotoTitulo} />
              <DocumentRow label="Código MINSA" available={solicitud.tieneFotoCodigoMinsa} />
              <DocumentRow
                label={solicitud.documentorespaldo || 'Documento adicional de respaldo'}
                available={Boolean(solicitud.documentorespaldo)}
              />
            </PaperSection>

            <PaperSection number="4" title="Declaración">
              <AppText style={styles.declaration}>
                Declaro que la información proporcionada es verdadera y autorizo su
                revisión con fines de validación profesional.
              </AppText>
              <View style={[styles.signatures, compact && styles.signaturesCompact]}>
                <Signature label="Firma del solicitante" />
                <Signature label="Fecha" value={formatDate(solicitud.fechasolicitud)} />
              </View>
            </PaperSection>

            <View style={styles.internal}>
              <View style={styles.internalTop}>
                <AppText style={styles.internalTitle}>USO EXCLUSIVO DE ADMINISTRACIÓN</AppText>
                <AppText style={[styles.paperStatus, { color: meta.color }]}>
                  {meta.label.toUpperCase()}
                </AppText>
              </View>
              <AppText style={styles.reviewLabel}>Fecha de revisión</AppText>
              <AppText style={styles.reviewValue}>{formatDate(solicitud.fecharevision)}</AppText>
              <AppText style={[styles.reviewLabel, styles.observationLabel]}>Observaciones</AppText>
              <View style={styles.observation}>
                <AppText style={styles.observationText}>
                  {solicitud.observaciones || 'Sin observaciones registradas.'}
                </AppText>
              </View>
            </View>

            <View style={styles.paperFooter}>
              <AppText style={styles.footerText}>
                Gestión Salud · Expediente para revisión administrativa
              </AppText>
              <AppText style={styles.footerText}>Página 1 de 1</AppText>
            </View>
          </View>

          <View style={[styles.actions, desktop && styles.actionsDesktop]}>
            <AppText style={styles.actionsEyebrow}>DECISIÓN ADMINISTRATIVA</AppText>
            <AppText style={styles.actionsTitle}>Revisar solicitud</AppText>
            <AppText style={styles.actionsText}>
              Añade una observación antes de registrar la decisión.
            </AppText>
            <AppTextInput
              multiline
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Escribe una observación para el solicitante..."
              placeholderTextColor={appColors.textMuted}
              style={styles.notesInput}
            />

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
            {success ? <AppText style={styles.successText}>{success}</AppText> : null}

            <DecisionButton
              label="Aceptar solicitud"
              icon="checkmark-circle-outline"
              color={appColors.success}
              loading={saving === 'aprobado'}
              disabled={Boolean(saving)}
              onPress={() => void applyDecision('aprobado')}
            />
            <DecisionButton
              label="Solicitar documentos nuevamente"
              icon="document-attach-outline"
              color="#8758C7"
              loading={saving === 'documentos_solicitados'}
              disabled={Boolean(saving)}
              onPress={() => void applyDecision('documentos_solicitados')}
            />
            <DecisionButton
              label="Rechazar solicitud"
              icon="close-circle-outline"
              color={appColors.accent}
              loading={saving === 'rechazado'}
              disabled={Boolean(saving)}
              onPress={() => void applyDecision('rechazado')}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function PaperSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <AppText style={styles.sectionNumberText}>{number}</AppText>
        </View>
        <AppText style={styles.sectionTitle}>{title.toUpperCase()}</AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function PaperField({
  label,
  value,
  compact,
}: {
  label: string;
  value?: string | null;
  compact: boolean;
}) {
  return (
    <View style={[styles.field, compact && styles.fieldCompact]}>
      <AppText style={styles.fieldLabel}>{label.toUpperCase()}</AppText>
      <AppText style={styles.fieldValue}>{value || 'No indicado'}</AppText>
    </View>
  );
}

function DocumentRow({ label, available }: { label: string; available: boolean }) {
  return (
    <View style={styles.documentRow}>
      <Ionicons
        name={available ? 'checkbox' : 'square-outline'}
        size={18}
        color={available ? '#168A55' : '#8793A0'}
      />
      <AppText style={styles.documentLabel}>{label}</AppText>
      <AppText style={[styles.documentState, available && styles.documentAvailable]}>
        {available ? 'ADJUNTO' : 'NO ADJUNTO'}
      </AppText>
    </View>
  );
}

function Signature({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.signature}>
      <View style={styles.signatureLine}>
        {value ? <AppText style={styles.signatureValue}>{value}</AppText> : null}
      </View>
      <AppText style={styles.signatureLabel}>{label}</AppText>
    </View>
  );
}

function DecisionButton({
  label,
  icon,
  color,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.decisionButton,
        { backgroundColor: color },
        disabled && styles.decisionDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons name={icon} size={19} color="#FFFFFF" />
      )}
      <AppText style={styles.decisionText}>{label}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: appColors.background, padding: 14, paddingBottom: 48 },
  content: { width: '100%', maxWidth: 1220, alignSelf: 'center' },
  topbar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, paddingHorizontal: 13, borderRadius: 11, backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border },
  backText: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: appColors.surface },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  statusText: { fontSize: 10, fontWeight: '900' },
  demoBanner: { flexDirection: 'row', alignItems: 'center', padding: 11, marginBottom: 13, borderRadius: 12, borderWidth: 1, borderColor: colorAlpha('#F5B942', '55'), backgroundColor: colorAlpha('#F5B942', '12') },
  demoText: { flex: 1, marginLeft: 9, color: appColors.textSoft, fontSize: 10 },
  layout: { flexDirection: 'column' },
  layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  paper: { flex: 1, width: '100%', maxWidth: 794, minHeight: 1080, alignSelf: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 44, paddingTop: 38, paddingBottom: 26, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  paperCompact: { minHeight: 0, paddingHorizontal: 17, paddingTop: 20, paddingBottom: 20 },
  paperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 3, borderBottomColor: '#12345A', paddingBottom: 17 },
  paperHeaderCompact: { gap: 8 },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  brandCopy: { flex: 1 },
  logo: { width: 46, height: 46, marginRight: 11, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12345A' },
  brandName: { color: '#12345A', fontSize: 17, fontWeight: '900', letterSpacing: 0.7 },
  brandSub: { color: '#59697A', fontSize: 8, marginTop: 2 },
  folio: { minWidth: 120, borderWidth: 1, borderColor: '#AAB4BF', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'flex-end' },
  folioLabel: { color: '#687583', fontSize: 7, fontWeight: '800' },
  folioValue: { color: '#12345A', fontSize: 15, fontWeight: '900', marginTop: 2 },
  folioDate: { color: '#59697A', fontSize: 7, marginTop: 2 },
  titleBlock: { alignItems: 'center', paddingVertical: 21 },
  paperTitle: { color: '#172A3D', fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  paperSubtitle: { color: '#687583', fontSize: 9, textAlign: 'center', marginTop: 5 },
  section: { borderWidth: 1, borderColor: '#AAB4BF', marginBottom: 13 },
  sectionHeader: { minHeight: 31, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8EEF4', borderBottomWidth: 1, borderBottomColor: '#AAB4BF' },
  sectionNumber: { width: 31, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: '#12345A' },
  sectionNumberText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  sectionTitle: { color: '#12345A', fontSize: 9, fontWeight: '900', letterSpacing: 0.6, marginLeft: 10 },
  sectionBody: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  field: { width: '50%', minHeight: 48, paddingHorizontal: 5, paddingVertical: 6 },
  fieldCompact: { width: '100%' },
  fieldLabel: { color: '#687583', fontSize: 7, fontWeight: '800', letterSpacing: 0.4, marginBottom: 5 },
  fieldValue: { color: '#172A3D', fontSize: 10, fontWeight: '700', paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#D6DDE4' },
  documentRow: { minHeight: 35, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E1E5E9' },
  documentLabel: { flex: 1, color: '#354454', fontSize: 9, marginLeft: 8 },
  documentState: { color: '#8793A0', fontSize: 7, fontWeight: '900' },
  documentAvailable: { color: '#168A55' },
  declaration: { color: '#354454', fontSize: 9, lineHeight: 15 },
  signatures: { flexDirection: 'row', gap: 30, marginTop: 24 },
  signaturesCompact: { flexDirection: 'column', gap: 16 },
  signature: { flex: 1, minWidth: 140 },
  signatureLine: { minHeight: 24, justifyContent: 'flex-end', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#59697A' },
  signatureValue: { color: '#354454', fontSize: 8, paddingBottom: 3 },
  signatureLabel: { color: '#687583', fontSize: 7, textAlign: 'center', marginTop: 4 },
  internal: { borderWidth: 2, borderColor: '#12345A', padding: 12, backgroundColor: '#F7F9FB' },
  internalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  internalTitle: { flex: 1, color: '#12345A', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  paperStatus: { fontSize: 8, fontWeight: '900' },
  reviewLabel: { color: '#687583', fontSize: 7, fontWeight: '800' },
  reviewValue: { color: '#172A3D', fontSize: 9, fontWeight: '700', marginTop: 3 },
  observationLabel: { marginTop: 10 },
  observation: { minHeight: 48, borderWidth: 1, borderColor: '#CBD3DC', marginTop: 5, padding: 8, backgroundColor: '#FFFFFF' },
  observationText: { color: '#354454', fontSize: 8, lineHeight: 13 },
  paperFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#CBD3DC' },
  footerText: { color: '#8793A0', fontSize: 7 },
  actions: { width: '100%', maxWidth: 794, alignSelf: 'center', marginTop: 16, padding: 18, borderWidth: 1, borderColor: appColors.border, borderRadius: 18, backgroundColor: appColors.surface },
  actionsDesktop: { width: 330, marginTop: 0, position: 'sticky', top: 14 } as any,
  actionsEyebrow: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  actionsTitle: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 5 },
  actionsText: { color: appColors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  notesInput: { minHeight: 110, marginTop: 14, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: appColors.border, borderRadius: 12, backgroundColor: appColors.backgroundMuted, color: appColors.text, fontSize: 12, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  decisionButton: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, marginTop: 9 },
  decisionDisabled: { opacity: 0.55 },
  decisionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  errorText: { color: appColors.accent, fontSize: 10, lineHeight: 15, marginBottom: 3 },
  successText: { color: appColors.success, fontSize: 10, lineHeight: 15, marginBottom: 3 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: appColors.background },
  stateTitle: { color: appColors.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  stateText: { maxWidth: 430, color: appColors.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  stateButton: { minHeight: 45, minWidth: 170, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 18, paddingHorizontal: 16, backgroundColor: appColors.info },
  stateButtonText: { color: appColors.background, fontWeight: '900' },
});
