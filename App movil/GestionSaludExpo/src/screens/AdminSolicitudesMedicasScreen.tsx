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
export type Estado =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'documentos_solicitados';
type Filtro = 'todos' | Estado;

export type SolicitudMedica = {
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
  tieneDocumentoCedula: boolean;
  documentocedulaNombre?: string | null;
  documentocedulaMimeType?: string | null;
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

const getDocumentProgress = (solicitud: SolicitudMedica) => {
  const uploadedDocuments = [
    solicitud.tieneFotoTitulo,
    solicitud.tieneFotoCodigoMinsa,
    solicitud.tieneDocumentoCedula,
  ].filter(Boolean).length;

  return {
    uploadedDocuments,
    totalDocuments: 3,
    percentage: Math.round((uploadedDocuments / 3) * 100),
  };
};

const errorMessage = (body: ApiError | null) => {
  if (Array.isArray(body?.message)) return body.message.join('\n');
  return body?.message || body?.error || 'No se pudieron cargar las solicitudes.';
};

// Datos temporales para revisar la interfaz. Se usan solo cuando la API no tiene solicitudes.
export const DEMO_SOLICITUDES: SolicitudMedica[] = [
  {
    medicoregistroId: 1001,
    usuarioId: 201,
    hospitaltrabajo: 'Hospital Escuela Dr. Roberto Calderón',
    titulo: 'Doctor en Medicina y Cirugía',
    codigominsa: 'MINSA-45872',
    numerolicencia: 'LIC-MED-2026-0148',
    entidadcertificadora: 'Universidad Nacional Autónoma de Nicaragua',
    especialidadprincipal: 'Medicina interna',
    documentorespaldo: 'certificado-especialidad-medicina-interna.pdf',
    estado: 'pendiente',
    fechasolicitud: '2026-07-25T15:30:00.000Z',
    observaciones: null,
    tieneFotoCodigoMinsa: true,
    tieneFotoTitulo: true,
    tieneDocumentoCedula: true,
    documentocedulaNombre: 'cedula-maria-lopez.pdf',
    documentocedulaMimeType: 'application/pdf',
    usuario: {
      id: 201,
      username: 'dra.maria.lopez',
      email: 'maria.lopez@ejemplo.com',
      city: 'Managua',
      country: 'Nicaragua',
      role: 'paciente',
    },
  },
  {
    medicoregistroId: 1002,
    usuarioId: 202,
    hospitaltrabajo: 'Hospital Alemán Nicaragüense',
    titulo: 'Doctor en Medicina',
    codigominsa: 'MINSA-39104',
    numerolicencia: 'LIC-MED-2026-0093',
    entidadcertificadora: 'Universidad Americana',
    especialidadprincipal: 'Pediatría',
    documentorespaldo: null,
    estado: 'aprobado',
    fechasolicitud: '2026-07-20T09:15:00.000Z',
    fecharevision: '2026-07-22T14:10:00.000Z',
    observaciones: 'Credenciales verificadas y documentación completa.',
    tieneFotoCodigoMinsa: true,
    tieneFotoTitulo: true,
    tieneDocumentoCedula: false,
    usuario: {
      id: 202,
      username: 'dr.carlos.mendez',
      email: 'carlos.mendez@ejemplo.com',
      city: 'Masaya',
      country: 'Nicaragua',
      role: 'medico',
    },
  },
  {
    medicoregistroId: 1003,
    usuarioId: 203,
    hospitaltrabajo: 'Clínica Médica San Rafael',
    titulo: 'Médico general',
    codigominsa: null,
    numerolicencia: 'LIC-MED-2025-0771',
    entidadcertificadora: 'Universidad Católica Redemptoris Mater',
    especialidadprincipal: 'Medicina general',
    documentorespaldo: null,
    estado: 'rechazado',
    fechasolicitud: '2026-07-18T17:45:00.000Z',
    fecharevision: '2026-07-21T10:00:00.000Z',
    observaciones: 'Falta adjuntar evidencia legible del código MINSA.',
    tieneFotoCodigoMinsa: false,
    tieneFotoTitulo: true,
    tieneDocumentoCedula: false,
    usuario: {
      id: 203,
      username: 'dr.jose.rivas',
      email: 'jose.rivas@ejemplo.com',
      city: 'León',
      country: 'Nicaragua',
      role: 'paciente',
    },
  },
];

export const updateDemoSolicitud = (
  solicitudId: number,
  changes: Partial<SolicitudMedica>,
) => {
  const solicitud = DEMO_SOLICITUDES.find(
    (item) => item.medicoregistroId === solicitudId,
  );
  if (solicitud) Object.assign(solicitud, changes);
  return solicitud;
};

export function AdminSolicitudesMedicasScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 980;
  const { token, user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudMedica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filtro>('todos');
  const [usingDemo, setUsingDemo] = useState(false);

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
      const apiSolicitudes = Array.isArray(body) ? body : [];
      setUsingDemo(apiSolicitudes.length === 0);
      setSolicitudes(
        apiSolicitudes.length
          ? apiSolicitudes
          : DEMO_SOLICITUDES.map((item) => ({ ...item })),
      );
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
      pendiente: solicitudes.filter(
        (item) =>
          item.estado === 'pendiente' ||
          item.estado === 'documentos_solicitados',
      ).length,
      aprobado: solicitudes.filter((item) => item.estado === 'aprobado').length,
      rechazado: solicitudes.filter((item) => item.estado === 'rechazado').length,
    }),
    [solicitudes],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return solicitudes.filter((item) => {
      if (
        filter !== 'todos' &&
        item.estado !== filter &&
        !(filter === 'pendiente' && item.estado === 'documentos_solicitados')
      ) {
        return false;
      }
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
        <View style={styles.adminTabs}>
          <View style={[styles.adminTab, styles.adminTabActive]}>
            <Ionicons name="medkit-outline" size={17} color={appColors.background} />
            <AppText style={[styles.adminTabText, styles.adminTabTextActive]}>Solicitudes médicas</AppText>
          </View>
          <TouchableOpacity
            style={styles.adminTab}
            onPress={() => navigation.navigate('AdminClinicas')}
          >
            <Ionicons name="business-outline" size={17} color={appColors.textMuted} />
            <AppText style={styles.adminTabText}>Clínicas</AppText>
          </TouchableOpacity>
        </View>
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

        {usingDemo ? (
          <View style={styles.demoBanner}>
            <Ionicons name="flask-outline" size={17} color="#F5B942" />
            <View style={styles.demoBannerCopy}>
              <AppText style={styles.demoBannerTitle}>Datos de demostración</AppText>
              <AppText style={styles.demoBannerText}>
                Estas solicitudes son ficticias y no están guardadas en la base de datos.
              </AppText>
            </View>
          </View>
        ) : null}

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
              {(
                [
                  'todos',
                  'pendiente',
                  'documentos_solicitados',
                  'aprobado',
                  'rechazado',
                ] as Filtro[]
              ).map((item) => (
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
                      : item === 'documentos_solicitados'
                        ? 'Documentos solicitados'
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
              <AppText style={[styles.headerCell, styles.documentsCell]}>Documentos</AppText>
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
                <View style={styles.documentsCell}>
                  <DocumentProgress solicitud={item} />
                </View>
                <AppText style={[styles.secondaryText, styles.centerCell]}>
                  {formatDate(item.fechasolicitud)}
                </AppText>
                <View style={styles.centerCell}>
                  <StatusBadge estado={item.estado} />
                </View>
                <View style={styles.actionCell}>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() =>
                      navigation.navigate('AdminSolicitudDetalle', {
                        solicitudId: item.medicoregistroId,
                        demo: usingDemo,
                      })
                    }
                  >
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
                onPress={() =>
                  navigation.navigate('AdminSolicitudDetalle', {
                    solicitudId: item.medicoregistroId,
                    demo: usingDemo,
                  })
                }
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
                <View style={styles.mobileDocuments}>
                  <DocumentProgress solicitud={item} />
                </View>
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
        : estado === 'documentos_solicitados'
          ? '#8758C7'
          : '#F5B942';
  const label =
    estado === 'documentos_solicitados'
      ? 'Documentos solicitados'
      : estado.charAt(0).toUpperCase() + estado.slice(1);
  return (
    <View style={[styles.statusBadge, { backgroundColor: colorAlpha(color, '18') }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <AppText style={[styles.statusText, { color }]}>
        {label}
      </AppText>
    </View>
  );
}

function DocumentProgress({ solicitud }: { solicitud: SolicitudMedica }) {
  const { uploadedDocuments, totalDocuments, percentage } =
    getDocumentProgress(solicitud);
  const color =
    percentage === 100
      ? appColors.success
      : percentage === 0
        ? appColors.accent
        : appColors.info;

  return (
    <View
      style={styles.documentProgress}
      accessibilityRole="progressbar"
      accessibilityLabel={`Documentos adjuntos: ${uploadedDocuments} de ${totalDocuments}`}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
    >
      <View style={styles.documentProgressHeader}>
        <AppText style={styles.documentProgressCount}>
          {uploadedDocuments} de {totalDocuments}
        </AppText>
        <AppText style={[styles.documentProgressPercentage, { color }]}>
          {percentage}%
        </AppText>
      </View>
      <View style={styles.documentProgressTrack}>
        <View
          style={[
            styles.documentProgressFill,
            {
              backgroundColor: color,
              width: `${percentage}%` as `${number}%`,
            },
          ]}
        />
      </View>
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
  const { width } = useWindowDimensions();
  const compact = width < 720;
  if (!solicitud) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalFrame}>
          <View style={styles.modalToolbar}>
            <View style={styles.formatBadge}>
              <Ionicons name="document-text-outline" size={16} color={appColors.info} />
              <AppText style={styles.formatBadgeText}>Vista de solicitud · A4</AppText>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={appColors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.paperScroll}
            showsVerticalScrollIndicator
          >
            <View style={[styles.a4Paper, compact && styles.a4PaperCompact]}>
              <View style={[styles.paperHeader, compact && styles.paperHeaderCompact]}>
                <View style={styles.paperBrand}>
                  <View style={styles.paperLogo}>
                    <Ionicons name="medkit" size={25} color="#FFFFFF" />
                  </View>
                  <View>
                    <AppText style={styles.paperBrandName}>GESTIÓN SALUD</AppText>
                    <AppText style={styles.paperBrandSub}>Registro de profesionales médicos</AppText>
                  </View>
                </View>
                <View style={styles.folioBox}>
                  <AppText style={styles.folioLabel}>SOLICITUD N.º</AppText>
                  <AppText style={styles.folioValue}>
                    {String(solicitud.medicoregistroId).padStart(6, '0')}
                  </AppText>
                  <AppText style={styles.folioDate}>{formatDate(solicitud.fechasolicitud)}</AppText>
                </View>
              </View>

              <View style={styles.paperTitleBlock}>
                <AppText style={styles.paperTitle}>SOLICITUD DE ACREDITACIÓN MÉDICA</AppText>
                <AppText style={styles.paperSubtitle}>
                  Formulario de ingreso y verificación de credenciales profesionales
                </AppText>
              </View>

              <AppText style={styles.paperIntro}>
                Por medio del presente documento, la persona solicitante pide la habilitación de
                una cuenta profesional médica dentro de la plataforma Gestión Salud.
              </AppText>

              <A4Section number="1" title="Información del solicitante">
                <View style={styles.applicationGrid}>
                  <ApplicationField
                    label="Cuenta de usuario"
                    value={solicitud.usuario?.username || `Usuario ${solicitud.usuarioId}`}
                    compact={compact}
                  />
                  <ApplicationField
                    label="Correo electrónico"
                    value={solicitud.usuario?.email}
                    compact={compact}
                  />
                  <ApplicationField label="Ciudad" value={solicitud.usuario?.city} compact={compact} />
                  <ApplicationField label="País" value={solicitud.usuario?.country} compact={compact} />
                </View>
              </A4Section>

              <A4Section number="2" title="Información profesional">
                <View style={styles.applicationGrid}>
                  <ApplicationField label="Título profesional" value={solicitud.titulo} compact={compact} />
                  <ApplicationField label="Especialidad principal" value={solicitud.especialidadprincipal} compact={compact} />
                  <ApplicationField label="Hospital o centro de trabajo" value={solicitud.hospitaltrabajo} compact={compact} />
                  <ApplicationField label="Entidad certificadora" value={solicitud.entidadcertificadora} compact={compact} />
                  <ApplicationField label="Número de licencia" value={solicitud.numerolicencia} compact={compact} />
                  <ApplicationField label="Código MINSA" value={solicitud.codigominsa} compact={compact} />
                </View>
              </A4Section>

              <A4Section number="3" title="Documentación presentada">
                <View style={[styles.checkGrid, compact && styles.checkGridCompact]}>
                  <CheckItem label="Fotografía del título profesional" checked={solicitud.tieneFotoTitulo} />
                  <CheckItem label="Fotografía del código MINSA" checked={solicitud.tieneFotoCodigoMinsa} />
                  <CheckItem label="Cédula de identidad (imagen o PDF)" checked={solicitud.tieneDocumentoCedula} />
                  <CheckItem label="Documento adicional de respaldo" checked={Boolean(solicitud.documentorespaldo)} />
                </View>
                {solicitud.documentorespaldo ? (
                  <View style={styles.supportDocument}>
                    <AppText style={styles.supportDocumentLabel}>Referencia del documento:</AppText>
                    <AppText style={styles.supportDocumentValue}>{solicitud.documentorespaldo}</AppText>
                  </View>
                ) : null}
              </A4Section>

              <A4Section number="4" title="Declaración">
                <AppText style={styles.declarationText}>
                  Declaro que la información proporcionada en esta solicitud es verdadera y
                  autorizo su revisión con fines de validación profesional. Comprendo que cualquier
                  inconsistencia puede ocasionar el rechazo o la suspensión del permiso médico.
                </AppText>
                <View style={[styles.signatureRow, compact && styles.signatureRowCompact]}>
                  <SignatureLine label="Firma del solicitante" />
                  <SignatureLine label="Fecha" value={formatDate(solicitud.fechasolicitud)} />
                </View>
              </A4Section>

              <View style={styles.internalBlock}>
                <View style={styles.internalHeader}>
                  <AppText style={styles.internalTitle}>USO EXCLUSIVO DE ADMINISTRACIÓN</AppText>
                  <PaperStatus estado={solicitud.estado} />
                </View>
                <View style={styles.internalGrid}>
                  <View style={styles.reviewCell}>
                    <AppText style={styles.reviewLabel}>Fecha de revisión</AppText>
                    <AppText style={styles.reviewValue}>{formatDate(solicitud.fecharevision)}</AppText>
                  </View>
                  <View style={styles.reviewCell}>
                    <AppText style={styles.reviewLabel}>Revisado por</AppText>
                    <AppText style={styles.reviewValue}>____________________________</AppText>
                  </View>
                </View>
                <AppText style={styles.reviewLabel}>Observaciones</AppText>
                <View style={styles.observationBox}>
                  <AppText style={styles.observationPaperText}>
                    {solicitud.observaciones || 'Sin observaciones registradas.'}
                  </AppText>
                </View>
              </View>

              <View style={styles.paperFooter}>
                <AppText style={styles.paperFooterText}>
                  Gestión Salud · Documento generado para revisión administrativa
                </AppText>
                <AppText style={styles.paperPage}>Página 1 de 1</AppText>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function A4Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.a4Section}>
      <View style={styles.a4SectionHeader}>
        <View style={styles.a4SectionNumber}>
          <AppText style={styles.a4SectionNumberText}>{number}</AppText>
        </View>
        <AppText style={styles.a4SectionTitle}>{title.toUpperCase()}</AppText>
      </View>
      <View style={styles.a4SectionBody}>{children}</View>
    </View>
  );
}

function ApplicationField({
  label,
  value,
  compact,
}: {
  label: string;
  value?: string | null;
  compact: boolean;
}) {
  return (
    <View style={[styles.applicationField, compact && styles.applicationFieldCompact]}>
      <AppText style={styles.applicationLabel}>{label.toUpperCase()}</AppText>
      <AppText style={styles.applicationValue}>{value || 'No indicado'}</AppText>
    </View>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
      </View>
      <AppText style={styles.checkLabel}>{label}</AppText>
      <AppText style={[styles.checkState, checked && styles.checkStatePresent]}>
        {checked ? 'ADJUNTO' : 'NO ADJUNTO'}
      </AppText>
    </View>
  );
}

function SignatureLine({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.signature}>
      <View style={styles.signatureLine}>
        {value ? <AppText style={styles.signatureValue}>{value}</AppText> : null}
      </View>
      <AppText style={styles.signatureLabel}>{label}</AppText>
    </View>
  );
}

function PaperStatus({ estado }: { estado: Estado }) {
  const color =
    estado === 'aprobado'
      ? '#168A55'
      : estado === 'rechazado'
        ? '#C8324E'
        : estado === 'documentos_solicitados'
          ? '#8758C7'
          : '#A86F00';
  const label =
    estado === 'documentos_solicitados'
      ? 'DOCUMENTOS SOLICITADOS'
      : estado.toUpperCase();
  return (
    <View style={[styles.paperStatus, { borderColor: color }]}>
      <AppText style={[styles.paperStatusText, { color }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: 'transparent', padding: 16, paddingBottom: 48 },
  shell: { width: '100%', maxWidth: 1280, alignSelf: 'center' },
  adminTabs: { alignSelf: 'flex-start', flexDirection: 'row', gap: 7, padding: 5, marginBottom: 14, borderWidth: 1, borderColor: appColors.border, borderRadius: 14, backgroundColor: appColors.surface },
  adminTab: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: 10 },
  adminTabActive: { backgroundColor: appColors.info },
  adminTabText: { color: appColors.textMuted, fontSize: 11, fontWeight: '800' },
  adminTabTextActive: { color: appColors.background },
  hero: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 20, padding: 18, marginBottom: 14 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '16'), marginRight: 15 },
  heroCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  title: { color: appColors.text, fontSize: 25, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 13, marginTop: 12 },
  refreshText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorAlpha('#F5B942', '12'),
    borderWidth: 1,
    borderColor: colorAlpha('#F5B942', '55'),
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 12,
  },
  demoBannerCopy: { flex: 1, marginLeft: 9 },
  demoBannerTitle: { color: '#F5B942', fontSize: 11, fontWeight: '900' },
  demoBannerText: { color: appColors.textMuted, fontSize: 9, marginTop: 2 },
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
  documentsCell: { width: 150, paddingHorizontal: 12 },
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
  mobileDocuments: { marginTop: 12 },
  mobileFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  viewLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewLinkText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  documentProgress: { width: '100%' },
  documentProgressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  documentProgressCount: { color: appColors.textMuted, fontSize: 9, fontWeight: '700' },
  documentProgressPercentage: { fontSize: 11, fontWeight: '900' },
  documentProgressTrack: { height: 7, overflow: 'hidden', borderRadius: 4, backgroundColor: appColors.backgroundMuted },
  documentProgressFill: { height: '100%', borderRadius: 4 },
  accessRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 20 },
  accessCard: { width: '100%', maxWidth: 430, alignItems: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 22, padding: 28 },
  accessIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  accessTitle: { color: appColors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  accessMessage: { color: appColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  accessButton: { minHeight: 46, minWidth: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 },
  accessButtonText: { color: appColors.background, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colorAlpha(appColors.overlay, 'D4'),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  modalFrame: {
    width: '100%',
    maxWidth: 850,
    maxHeight: '96%',
  },
  modalToolbar: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  formatBadgeText: { color: appColors.textSoft, fontSize: 11, fontWeight: '700' },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.backgroundMuted },
  paperScroll: { alignItems: 'center', paddingBottom: 20 },
  a4Paper: {
    width: '100%',
    maxWidth: 794,
    minHeight: 1080,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 46,
    paddingTop: 40,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  a4PaperCompact: {
    minHeight: 0,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 22,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 18,
    borderBottomWidth: 3,
    borderBottomColor: '#12345A',
  },
  paperHeaderCompact: { gap: 12 },
  paperBrand: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paperLogo: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#12345A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paperBrandName: { color: '#12345A', fontSize: 18, fontWeight: '900', letterSpacing: 0.8 },
  paperBrandSub: { color: '#59697A', fontSize: 8, marginTop: 3 },
  folioBox: {
    minWidth: 128,
    borderWidth: 1,
    borderColor: '#AAB4BF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'flex-end',
  },
  folioLabel: { color: '#6B7785', fontSize: 7, fontWeight: '800', letterSpacing: 0.7 },
  folioValue: { color: '#12345A', fontSize: 16, fontWeight: '900', marginTop: 2 },
  folioDate: { color: '#59697A', fontSize: 8, marginTop: 3 },
  paperTitleBlock: { alignItems: 'center', paddingVertical: 22 },
  paperTitle: { color: '#172A3D', fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 0.6 },
  paperSubtitle: { color: '#687583', fontSize: 9, textAlign: 'center', marginTop: 5 },
  paperIntro: {
    color: '#354454',
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'justify',
    marginBottom: 16,
  },
  a4Section: {
    borderWidth: 1,
    borderColor: '#AAB4BF',
    marginBottom: 14,
  },
  a4SectionHeader: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EEF4',
    borderBottomWidth: 1,
    borderBottomColor: '#AAB4BF',
  },
  a4SectionNumber: {
    width: 31,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12345A',
  },
  a4SectionNumberText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  a4SectionTitle: { color: '#12345A', fontSize: 9, fontWeight: '900', letterSpacing: 0.7, marginLeft: 10 },
  a4SectionBody: { padding: 10 },
  applicationGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  applicationField: {
    width: '50%',
    minHeight: 48,
    paddingHorizontal: 5,
    paddingVertical: 6,
  },
  applicationFieldCompact: { width: '100%' },
  applicationLabel: { color: '#687583', fontSize: 7, fontWeight: '800', letterSpacing: 0.4, marginBottom: 5 },
  applicationValue: {
    minHeight: 21,
    color: '#172A3D',
    fontSize: 10,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#7C8996',
    paddingBottom: 4,
  },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  checkGridCompact: { flexDirection: 'column' },
  checkItem: {
    flexGrow: 1,
    minWidth: 190,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D6DC',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  checkBox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: '#7C8996',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  checkBoxChecked: { backgroundColor: '#168A55', borderColor: '#168A55' },
  checkLabel: { color: '#354454', fontSize: 8, flex: 1 },
  checkState: { color: '#87919B', fontSize: 6, fontWeight: '900', marginLeft: 5 },
  checkStatePresent: { color: '#168A55' },
  supportDocument: {
    flexDirection: 'row',
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D0D6DC',
  },
  supportDocumentLabel: { color: '#687583', fontSize: 8, marginRight: 6 },
  supportDocumentValue: { color: '#172A3D', fontSize: 8, fontWeight: '700', flex: 1 },
  declarationText: { color: '#354454', fontSize: 8, lineHeight: 14, textAlign: 'justify' },
  signatureRow: { flexDirection: 'row', gap: 30, marginTop: 28 },
  signatureRowCompact: { flexDirection: 'column', gap: 22 },
  signature: { flex: 1, alignItems: 'center' },
  signatureLine: {
    width: '100%',
    minHeight: 20,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#172A3D',
  },
  signatureValue: { color: '#172A3D', fontSize: 8, textAlign: 'center', paddingBottom: 3 },
  signatureLabel: { color: '#687583', fontSize: 7, marginTop: 4 },
  internalBlock: {
    borderWidth: 2,
    borderColor: '#12345A',
    padding: 11,
    marginTop: 2,
  },
  internalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#AAB4BF',
  },
  internalTitle: { color: '#12345A', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  paperStatus: { borderWidth: 1.5, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 4, transform: [{ rotate: '-2deg' }] },
  paperStatusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  internalGrid: { flexDirection: 'row', gap: 12, marginVertical: 10 },
  reviewCell: { flex: 1 },
  reviewLabel: { color: '#687583', fontSize: 7, fontWeight: '800', marginBottom: 4 },
  reviewValue: { color: '#172A3D', fontSize: 8, minHeight: 18 },
  observationBox: { minHeight: 44, borderWidth: 1, borderColor: '#AAB4BF', padding: 7 },
  observationPaperText: { color: '#354454', fontSize: 8, lineHeight: 13 },
  paperFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 13,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#AAB4BF',
  },
  paperFooterText: { color: '#7C8996', fontSize: 7 },
  paperPage: { color: '#7C8996', fontSize: 7 },
});
