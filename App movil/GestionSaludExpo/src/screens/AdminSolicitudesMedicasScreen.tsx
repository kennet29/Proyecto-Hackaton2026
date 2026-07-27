import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSolicitudes'>;
type Estado = 'pendiente' | 'aprobado' | 'rechazado';
type Filtro = 'todos' | Estado;

type SolicitudMedica = {
  medicoregistroId: number;
  usuarioId: number;
  hospitaltrabajo: string;
  titulo: string;
  codigominsa?: string | null;
  numerolicencia: string;
  entidadcertificadora?: string | null;
  especialidadprincipal?: string | null;
  documentorespaldo?: string | null;
  estado: Estado;
  fechasolicitud: string;
  fecharevision?: string | null;
  observaciones?: string | null;
  tieneFotoCodigoMinsa: boolean;
  tieneFotoTitulo: boolean;
  usuario?: {
    id: number;
    username: string;
    email?: string | null;
    city?: string | null;
    country?: string | null;
    role?: string;
  } | null;
};

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
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const errorMessage = (body: ApiError | null) => {
  if (Array.isArray(body?.message)) return body.message.join('\n');
  return body?.message || body?.error || 'No se pudieron cargar las solicitudes.';
};

export function AdminSolicitudesMedicasScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 980;
  const { token, user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudMedica[]>([]);
  const [selected, setSelected] = useState<SolicitudMedica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filtro>('todos');

  const loadSolicitudes = useCallback(async () => {
    if (!token || !isAdminRole(user?.role)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/medicoregistro', {
        headers: buildJsonHeaders(token),
      });
      const body = await parseJsonResponse<SolicitudMedica[] & ApiError>(response);
      if (!response.ok) throw new Error(errorMessage(body));
      setSolicitudes(Array.isArray(body) ? body : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useFocusEffect(
    useCallback(() => {
      void loadSolicitudes();
    }, [loadSolicitudes]),
  );

  const counts = useMemo(
    () => ({
      todos: solicitudes.length,
      pendiente: solicitudes.filter((item) => item.estado === 'pendiente').length,
      aprobado: solicitudes.filter((item) => item.estado === 'aprobado').length,
      rechazado: solicitudes.filter((item) => item.estado === 'rechazado').length,
    }),
    [solicitudes],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return solicitudes.filter((item) => {
      if (filter !== 'todos' && item.estado !== filter) return false;
      if (!normalizedQuery) return true;
      return [
        item.usuario?.username,
        item.usuario?.email,
        item.hospitaltrabajo,
        item.titulo,
        item.numerolicencia,
        item.codigominsa,
        item.especialidadprincipal,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [filter, query, solicitudes]);

  if (!token) {
    return (
      <AccessState
        icon="lock-closed-outline"
        title="Acceso administrativo"
        message="Inicia sesión con una cuenta administradora para consultar esta sección."
        button="Iniciar sesión"
        onPress={() => navigation.navigate('Login', { afterLogin: 'AdminSolicitudes' })}
      />
    );
  }

  if (!isAdminRole(user?.role)) {
    return (
      <AccessState
        icon="shield-outline"
        title="Acceso restringido"
        message="Tu cuenta no tiene permisos para consultar solicitudes médicas."
        button="Volver"
        onPress={() => navigation.navigate('MenuPrincipal')}
        danger
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.shell}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={appColors.info} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.eyebrow}>PANEL ADMINISTRATIVO</AppText>
            <AppText style={styles.title}>Solicitudes de permiso médico</AppText>
            <AppText style={styles.subtitle}>
              Consulta la identidad y las credenciales profesionales enviadas para revisión.
            </AppText>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => void loadSolicitudes()}>
            <Ionicons name="refresh-outline" size={18} color={appColors.info} />
            <AppText style={styles.refreshText}>Actualizar</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={counts.todos} color={appColors.info} />
          <StatCard label="Pendientes" value={counts.pendiente} color="#F5B942" />
          <StatCard label="Aprobadas" value={counts.aprobado} color={appColors.success} />
          <StatCard label="Rechazadas" value={counts.rechazado} color={appColors.accent} />
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={appColors.textMuted} />
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por usuario, hospital o licencia"
              placeholderTextColor={appColors.textMuted}
              style={styles.searchInput}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {(['todos', 'pendiente', 'aprobado', 'rechazado'] as Filtro[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.filterChip, filter === item && styles.filterChipActive]}
                  onPress={() => setFilter(item)}
                >
                  <AppText
                    style={[
                      styles.filterText,
                      filter === item && styles.filterTextActive,
                    ]}
                  >
                    {item === 'todos'
                      ? 'Todas'
                      : `${item.charAt(0).toUpperCase()}${item.slice(1)}`}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={appColors.info} size="large" />
            <AppText style={styles.loadingText}>Cargando solicitudes...</AppText>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color={appColors.accent} />
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={() => void loadSolicitudes()}>
              <AppText style={styles.retryText}>Intentar nuevamente</AppText>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={34} color={appColors.textMuted} />
            <AppText style={styles.emptyTitle}>No hay solicitudes</AppText>
            <AppText style={styles.emptyText}>No encontramos resultados con estos filtros.</AppText>
          </View>
        ) : isDesktop ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <AppText style={[styles.headerCell, styles.applicantCell]}>Solicitante</AppText>
              <AppText style={[styles.headerCell, styles.professionCell]}>Credenciales</AppText>
              <AppText style={[styles.headerCell, styles.centerCell]}>Fecha</AppText>
              <AppText style={[styles.headerCell, styles.centerCell]}>Estado</AppText>
              <AppText style={[styles.headerCell, styles.actionCell]}>Detalle</AppText>
            </View>
            {filtered.map((item) => (
              <View key={item.medicoregistroId} style={styles.tableRow}>
                <View style={styles.applicantCell}>
                  <AppText style={styles.primaryText}>{item.usuario?.username || `Usuario ${item.usuarioId}`}</AppText>
                  <AppText style={styles.secondaryText}>{item.usuario?.email || 'Sin correo'}</AppText>
                  <AppText style={styles.tertiaryText}>
                    {[item.usuario?.city, item.usuario?.country].filter(Boolean).join(', ') || 'Ubicación no indicada'}
                  </AppText>
                </View>
                <View style={styles.professionCell}>
                  <AppText style={styles.primaryText}>{item.titulo}</AppText>
                  <AppText style={styles.secondaryText}>{item.hospitaltrabajo}</AppText>
                  <AppText style={styles.tertiaryText}>Lic. {item.numerolicencia}</AppText>
                </View>
                <AppText style={[styles.secondaryText, styles.centerCell]}>
                  {formatDate(item.fechasolicitud)}
                </AppText>
                <View style={styles.centerCell}>
                  <StatusBadge estado={item.estado} />
                </View>
                <View style={styles.actionCell}>
                  <TouchableOpacity style={styles.detailButton} onPress={() => setSelected(item)}>
                    <Ionicons name="eye-outline" size={17} color={appColors.info} />
                    <AppText style={styles.detailButtonText}>Ver</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.medicoregistroId}
                style={styles.mobileCard}
                onPress={() => setSelected(item)}
              >
                <View style={styles.mobileCardTop}>
                  <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>
                      {(item.usuario?.username || 'M').charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.mobileCardCopy}>
                    <AppText style={styles.primaryText}>{item.usuario?.username || `Usuario ${item.usuarioId}`}</AppText>
                    <AppText style={styles.secondaryText}>{item.usuario?.email || 'Sin correo'}</AppText>
                  </View>
                  <StatusBadge estado={item.estado} />
                </View>
                <View style={styles.mobileDivider} />
                <AppText style={styles.mobileTitle}>{item.titulo}</AppText>
                <AppText style={styles.secondaryText}>{item.hospitaltrabajo}</AppText>
                <View style={styles.mobileFooter}>
                  <AppText style={styles.tertiaryText}>{formatDate(item.fechasolicitud)}</AppText>
                  <View style={styles.viewLink}>
                    <AppText style={styles.viewLinkText}>Ver expediente</AppText>
                    <Ionicons name="chevron-forward" size={15} color={appColors.info} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <DetailModal solicitud={selected} onClose={() => setSelected(null)} />
    </ScrollView>
  );
}

function AccessState(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  button: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const accent = props.danger ? appColors.accent : appColors.info;
  return (
    <View style={styles.accessRoot}>
      <View style={styles.accessCard}>
        <View style={[styles.accessIcon, { backgroundColor: colorAlpha(accent, '18') }]}>
          <Ionicons name={props.icon} size={34} color={accent} />
        </View>
        <AppText style={styles.accessTitle}>{props.title}</AppText>
        <AppText style={styles.accessMessage}>{props.message}</AppText>
        <TouchableOpacity
          style={[styles.accessButton, { backgroundColor: accent }]}
          onPress={props.onPress}
        >
          <AppText style={styles.accessButtonText}>{props.button}</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <View>
        <AppText style={styles.statValue}>{value}</AppText>
        <AppText style={styles.statLabel}>{label}</AppText>
      </View>
    </View>
  );
}

function StatusBadge({ estado }: { estado: Estado }) {
  const color =
    estado === 'aprobado'
      ? appColors.success
      : estado === 'rechazado'
        ? appColors.accent
        : '#F5B942';
  return (
    <View style={[styles.statusBadge, { backgroundColor: colorAlpha(color, '18') }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <AppText style={[styles.statusText, { color }]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </AppText>
    </View>
  );
}

function DetailModal({
  solicitud,
  onClose,
}: {
  solicitud: SolicitudMedica | null;
  onClose: () => void;
}) {
  if (!solicitud) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <AppText style={styles.modalEyebrow}>EXPEDIENTE #{solicitud.medicoregistroId}</AppText>
              <AppText style={styles.modalTitle}>
                {solicitud.usuario?.username || `Usuario ${solicitud.usuarioId}`}
              </AppText>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={appColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalStatusRow}>
              <StatusBadge estado={solicitud.estado} />
              <AppText style={styles.modalDate}>
                Recibida el {formatDate(solicitud.fechasolicitud)}
              </AppText>
            </View>
            <DetailSection title="Datos del solicitante" icon="person-outline">
              <DetailRow label="Usuario" value={solicitud.usuario?.username} />
              <DetailRow label="Correo" value={solicitud.usuario?.email} />
              <DetailRow label="Ciudad" value={solicitud.usuario?.city} />
              <DetailRow label="País" value={solicitud.usuario?.country} />
            </DetailSection>
            <DetailSection title="Credenciales profesionales" icon="medkit-outline">
              <DetailRow label="Título" value={solicitud.titulo} />
              <DetailRow label="Especialidad" value={solicitud.especialidadprincipal} />
              <DetailRow label="Hospital" value={solicitud.hospitaltrabajo} />
              <DetailRow label="Licencia" value={solicitud.numerolicencia} />
              <DetailRow label="Código MINSA" value={solicitud.codigominsa} />
              <DetailRow label="Entidad certificadora" value={solicitud.entidadcertificadora} />
            </DetailSection>
            <DetailSection title="Documentos" icon="documents-outline">
              <DocumentState label="Fotografía del título" present={solicitud.tieneFotoTitulo} />
              <DocumentState label="Fotografía del código MINSA" present={solicitud.tieneFotoCodigoMinsa} />
              {solicitud.documentorespaldo ? (
                <DetailRow label="Documento adicional" value={solicitud.documentorespaldo} />
              ) : null}
            </DetailSection>
            {solicitud.observaciones ? (
              <DetailSection title="Observaciones" icon="chatbox-outline">
                <AppText style={styles.observationText}>{solicitud.observaciones}</AppText>
              </DetailSection>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailSectionHeader}>
        <Ionicons name={icon} size={18} color={appColors.info} />
        <AppText style={styles.detailSectionTitle}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={styles.detailLabel}>{label}</AppText>
      <AppText style={styles.detailValue}>{value || 'No indicado'}</AppText>
    </View>
  );
}

function DocumentState({ label, present }: { label: string; present: boolean }) {
  return (
    <View style={styles.documentRow}>
      <Ionicons
        name={present ? 'checkmark-circle' : 'remove-circle-outline'}
        size={18}
        color={present ? appColors.success : appColors.textMuted}
      />
      <AppText style={styles.documentLabel}>{label}</AppText>
      <AppText style={[styles.documentState, present && styles.documentStatePresent]}>
        {present ? 'Adjunto' : 'No adjunto'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: appColors.background, padding: 16, paddingBottom: 48 },
  shell: { width: '100%', maxWidth: 1280, alignSelf: 'center' },
  hero: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 20, padding: 18, marginBottom: 14 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '16'), marginRight: 15 },
  heroCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  title: { color: appColors.text, fontSize: 25, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 13, marginTop: 12 },
  refreshText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { minWidth: 140, flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 15, padding: 14 },
  statDot: { width: 9, height: 36, borderRadius: 5, marginRight: 12 },
  statValue: { color: appColors.text, fontSize: 21, fontWeight: '900' },
  statLabel: { color: appColors.textMuted, fontSize: 10, marginTop: 1 },
  toolbar: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 16, padding: 12, marginBottom: 14 },
  searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.backgroundMuted, borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 10 },
  searchInput: { flex: 1, color: appColors.text, fontSize: 13, paddingHorizontal: 9, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', gap: 7 },
  filterChip: { minHeight: 34, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: appColors.border, paddingHorizontal: 12 },
  filterChipActive: { backgroundColor: appColors.info, borderColor: appColors.info },
  filterText: { color: appColors.textMuted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: appColors.background },
  loadingBox: { minHeight: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, borderRadius: 18 },
  loadingText: { color: appColors.textMuted, marginTop: 12 },
  errorBox: { minHeight: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: colorAlpha(appColors.accent, '55'), borderRadius: 18, padding: 24 },
  errorText: { color: appColors.textSoft, textAlign: 'center', marginTop: 10 },
  retryText: { color: appColors.info, fontWeight: '800', marginTop: 14 },
  emptyBox: { minHeight: 230, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 18 },
  emptyTitle: { color: appColors.text, fontSize: 17, fontWeight: '800', marginTop: 10 },
  emptyText: { color: appColors.textMuted, fontSize: 11, marginTop: 4 },
  table: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 18, overflow: 'hidden' },
  tableRow: { minHeight: 86, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: appColors.borderStrong, paddingHorizontal: 16 },
  tableHeader: { minHeight: 46, backgroundColor: appColors.backgroundMuted },
  headerCell: { color: appColors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  applicantCell: { flex: 1.35, paddingRight: 12 },
  professionCell: { flex: 1.5, paddingRight: 12 },
  centerCell: { width: 126, alignItems: 'center', textAlign: 'center' },
  actionCell: { width: 90, alignItems: 'flex-end' },
  primaryText: { color: appColors.text, fontSize: 13, fontWeight: '800' },
  secondaryText: { color: appColors.textSoft, fontSize: 11, marginTop: 3 },
  tertiaryText: { color: appColors.textMuted, fontSize: 9, marginTop: 3 },
  detailButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: appColors.info, borderRadius: 10, paddingHorizontal: 11 },
  detailButtonText: { color: appColors.info, fontSize: 11, fontWeight: '800' },
  mobileCard: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  mobileCardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: colorAlpha(appColors.info, '20'), alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: appColors.info, fontSize: 16, fontWeight: '900' },
  mobileCardCopy: { flex: 1, minWidth: 0 },
  mobileDivider: { height: 1, backgroundColor: appColors.borderStrong, marginVertical: 12 },
  mobileTitle: { color: appColors.text, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  mobileFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewLinkText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  accessRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.background, padding: 20 },
  accessCard: { width: '100%', maxWidth: 430, alignItems: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 22, padding: 28 },
  accessIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  accessTitle: { color: appColors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  accessMessage: { color: appColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  accessButton: { minHeight: 46, minWidth: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 },
  accessButtonText: { color: appColors.background, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: colorAlpha(appColors.overlay, 'B8'), alignItems: 'center', justifyContent: 'center', padding: 14 },
  modalCard: { width: '100%', maxWidth: 680, maxHeight: '90%', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 22, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: appColors.borderStrong },
  modalEyebrow: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: appColors.text, fontSize: 20, fontWeight: '900', marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.backgroundMuted },
  modalContent: { padding: 16, paddingBottom: 26 },
  modalStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalDate: { color: appColors.textMuted, fontSize: 10 },
  detailSection: { backgroundColor: appColors.backgroundMuted, borderRadius: 14, padding: 14, marginBottom: 11 },
  detailSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: appColors.borderStrong, paddingBottom: 10, marginBottom: 4 },
  detailSectionTitle: { color: appColors.text, fontSize: 13, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colorAlpha(appColors.borderStrong, '88') },
  detailLabel: { color: appColors.textMuted, fontSize: 10, flex: 1 },
  detailValue: { color: appColors.textSoft, fontSize: 11, fontWeight: '700', flex: 1.5, textAlign: 'right' },
  documentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  documentLabel: { color: appColors.textSoft, fontSize: 11, flex: 1, marginLeft: 8 },
  documentState: { color: appColors.textMuted, fontSize: 10, fontWeight: '700' },
  documentStatePresent: { color: appColors.success },
  observationText: { color: appColors.textSoft, fontSize: 11, lineHeight: 18, paddingTop: 7 },
});
