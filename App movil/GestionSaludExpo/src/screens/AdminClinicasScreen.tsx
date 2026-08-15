import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';
import { LocationMapPicker } from '../components/LocationMapPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminClinicas'>;
type ClinicFilter = 'todas' | 'activas' | 'inactivas';
type EditorTab = 'datos' | 'servicios' | 'medicamentos';
type ApiError = { message?: string | string[]; error?: string };

type Clinica = {
  institucionSaludId: number;
  nombre: string;
  tipo: 'clinica' | string;
  descripcion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  sitioWeb?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  departamento?: string | null;
  horarioAtencion?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  activo: boolean;
};

type ClinicForm = {
  nombre: string;
  descripcion: string;
  telefono: string;
  correo: string;
  sitioWeb: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  horarioAtencion: string;
  latitud: string;
  longitud: string;
  activo: boolean;
};

type CatalogService = {
  catalogoServicioId: number;
  nombre: string;
  categoria?: string | null;
  descripcion?: string | null;
  activo: boolean;
};

type ClinicService = {
  institucionServicioId: number;
  institucionSaludId: number;
  catalogoServicioId: number;
  precioReferencia?: number | string | null;
  moneda?: string | null;
  tiempoEntrega?: string | null;
  disponible: boolean;
  observaciones?: string | null;
};

type RareMedicine = {
  medicamentoRaroId: number;
  nombreGenerico: string;
  nombreComercial?: string | null;
  presentacion?: string | null;
  concentracion?: string | null;
  fabricante?: string | null;
  requiereReceta: boolean;
  controlado: boolean;
  activo: boolean;
};

type ClinicMedicine = {
  institucionMedicamentoId: number;
  institucionSaludId: number;
  medicamentoRaroId: number;
  disponibilidad: 'disponible' | 'limitado' | 'agotado' | 'por_encargo';
  cantidadEstimada?: number | null;
  precioReferencia?: number | string | null;
  moneda?: string | null;
  contactoAbastecimiento?: string | null;
  observaciones?: string | null;
};

const EMPTY_FORM: ClinicForm = {
  nombre: '',
  descripcion: '',
  telefono: '',
  correo: '',
  sitioWeb: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  horarioAtencion: '',
  latitud: '',
  longitud: '',
  activo: true,
};

const DEMO_CLINICAS: Clinica[] = [
  {
    institucionSaludId: 2001,
    nombre: 'Clínica Médica San Rafael',
    tipo: 'clinica',
    descripcion: 'Atención médica general, pediatría y medicina interna.',
    telefono: '+505 2255 0148',
    correo: 'contacto@clinicasanrafael.example',
    sitioWeb: 'https://clinicasanrafael.example',
    direccion: 'Residencial Los Robles, calle principal',
    ciudad: 'Managua',
    departamento: 'Managua',
    horarioAtencion: 'Lunes a sábado, 7:00 a. m. - 7:00 p. m.',
    latitud: 12.1206,
    longitud: -86.2644,
    activo: true,
  },
  {
    institucionSaludId: 2002,
    nombre: 'Clínica Familiar Masaya',
    tipo: 'clinica',
    descripcion: 'Consulta familiar, control prenatal y vacunación.',
    telefono: '+505 2522 3093',
    correo: 'citas@clinicafamiliarmasaya.example',
    direccion: 'De la rotonda San Jerónimo, 2 cuadras al este',
    ciudad: 'Masaya',
    departamento: 'Masaya',
    horarioAtencion: 'Lunes a viernes, 8:00 a. m. - 5:00 p. m.',
    latitud: 11.9744,
    longitud: -86.0942,
    activo: true,
  },
  {
    institucionSaludId: 2003,
    nombre: 'Centro Clínico Metropolitano',
    tipo: 'clinica',
    descripcion: 'Especialidades médicas y diagnóstico ambulatorio.',
    telefono: '+505 2278 4410',
    correo: 'info@clinicometropolitano.example',
    direccion: 'Carretera a Masaya, km 8.5',
    ciudad: 'Managua',
    departamento: 'Managua',
    horarioAtencion: 'Todos los días, 6:00 a. m. - 9:00 p. m.',
    latitud: 12.0889,
    longitud: -86.2328,
    activo: true,
  },
  {
    institucionSaludId: 2004,
    nombre: 'Clínica León Norte',
    tipo: 'clinica',
    descripcion: 'Consulta general y seguimiento de enfermedades crónicas.',
    telefono: '+505 2311 7725',
    correo: null,
    direccion: 'Barrio El Sagrario, avenida central',
    ciudad: 'León',
    departamento: 'León',
    horarioAtencion: 'Lunes a viernes, 8:00 a. m. - 4:00 p. m.',
    latitud: null,
    longitud: null,
    activo: false,
  },
];

const DEMO_SERVICES: CatalogService[] = [
  { catalogoServicioId: 3001, nombre: 'Consulta de medicina general', categoria: 'Consulta', activo: true },
  { catalogoServicioId: 3002, nombre: 'Consulta pediátrica', categoria: 'Consulta', activo: true },
  { catalogoServicioId: 3003, nombre: 'Ultrasonido diagnóstico', categoria: 'Diagnóstico', activo: true },
  { catalogoServicioId: 3004, nombre: 'Control prenatal', categoria: 'Salud materna', activo: true },
];

const DEMO_MEDICINES: RareMedicine[] = [
  {
    medicamentoRaroId: 5001,
    nombreGenerico: 'Inmunoglobulina humana',
    nombreComercial: 'Presentación hospitalaria',
    presentacion: 'Frasco ampolla',
    concentracion: '5 g / 100 ml',
    fabricante: 'Importado',
    requiereReceta: true,
    controlado: false,
    activo: true,
  },
  {
    medicamentoRaroId: 5002,
    nombreGenerico: 'Factor VIII de coagulación',
    nombreComercial: null,
    presentacion: 'Vial inyectable',
    concentracion: '500 UI',
    fabricante: 'Importado',
    requiereReceta: true,
    controlado: true,
    activo: true,
  },
  {
    medicamentoRaroId: 5003,
    nombreGenerico: 'Nitisinona',
    nombreComercial: null,
    presentacion: 'Cápsulas',
    concentracion: '10 mg',
    fabricante: 'Especializado',
    requiereReceta: true,
    controlado: false,
    activo: true,
  },
];

const isAdminRole = (role?: string) =>
  ['admin', 'superadmin'].includes(role?.trim().toLowerCase() || '');

const getErrorMessage = (body: ApiError | null, fallback: string) => {
  if (Array.isArray(body?.message)) return body.message.join('\n');
  return body?.message || body?.error || fallback;
};

const nullableText = (value: string) => value.trim() || null;

const clinicToForm = (clinic: Clinica): ClinicForm => ({
  nombre: clinic.nombre,
  descripcion: clinic.descripcion || '',
  telefono: clinic.telefono || '',
  correo: clinic.correo || '',
  sitioWeb: clinic.sitioWeb || '',
  direccion: clinic.direccion || '',
  ciudad: clinic.ciudad || '',
  departamento: clinic.departamento || '',
  horarioAtencion: clinic.horarioAtencion || '',
  latitud: clinic.latitud == null ? '' : String(clinic.latitud),
  longitud: clinic.longitud == null ? '' : String(clinic.longitud),
  activo: clinic.activo,
});

export function AdminClinicasScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1000;
  const { token, user } = useAuth();
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClinicFilter>('todas');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClinicForm>(EMPTY_FORM);
  const [usingDemo, setUsingDemo] = useState(false);

  const loadClinicas = useCallback(async () => {
    if (!token || !isAdminRole(user?.role)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/institucionsalud?tipo=clinica', {
        headers: buildJsonHeaders(token),
      });
      const body = await parseJsonResponse<Clinica[] & ApiError>(response);
      if (!response.ok) {
        throw new Error(getErrorMessage(body, 'No se pudieron cargar las clínicas.'));
      }
      const apiClinicas = Array.isArray(body) ? body : [];
      setUsingDemo(apiClinicas.length === 0);
      setClinicas(
        apiClinicas.length ? apiClinicas : DEMO_CLINICAS.map((clinic) => ({ ...clinic })),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las clínicas.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useFocusEffect(
    useCallback(() => {
      void loadClinicas();
    }, [loadClinicas]),
  );

  const counts = useMemo(
    () => ({
      total: clinicas.length,
      activas: clinicas.filter((clinic) => clinic.activo).length,
      inactivas: clinicas.filter((clinic) => !clinic.activo).length,
      ubicadas: clinicas.filter(
        (clinic) => clinic.latitud != null && clinic.longitud != null,
      ).length,
    }),
    [clinicas],
  );

  const filteredClinicas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clinicas.filter((clinic) => {
      if (filter === 'activas' && !clinic.activo) return false;
      if (filter === 'inactivas' && clinic.activo) return false;
      if (!normalizedQuery) return true;
      return [
        clinic.nombre,
        clinic.ciudad,
        clinic.departamento,
        clinic.direccion,
        clinic.telefono,
        clinic.correo,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [clinicas, filter, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setEditorVisible(true);
  };

  const openEdit = (clinic: Clinica) => {
    setEditingId(clinic.institucionSaludId);
    setForm(clinicToForm(clinic));
    setError(null);
    setSuccess(null);
    setEditorVisible(true);
  };

  const updateForm = <K extends keyof ClinicForm>(key: K, value: ClinicForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveClinic = async () => {
    if (!token || saving) return;
    setError(null);
    setSuccess(null);
    if (!form.nombre.trim()) {
      setError('El nombre de la clínica es obligatorio.');
      return;
    }

    const latitud = form.latitud.trim() ? Number(form.latitud) : null;
    const longitud = form.longitud.trim() ? Number(form.longitud) : null;
    if (latitud != null && (!Number.isFinite(latitud) || latitud < -90 || latitud > 90)) {
      setError('La latitud debe ser un número entre -90 y 90.');
      return;
    }
    if (
      longitud != null &&
      (!Number.isFinite(longitud) || longitud < -180 || longitud > 180)
    ) {
      setError('La longitud debe ser un número entre -180 y 180.');
      return;
    }

    if (editingId && usingDemo) {
      setClinicas((current) =>
        current.map((clinic) =>
          clinic.institucionSaludId === editingId
            ? {
                ...clinic,
                nombre: form.nombre.trim(),
                descripcion: nullableText(form.descripcion),
                telefono: nullableText(form.telefono),
                correo: nullableText(form.correo),
                sitioWeb: nullableText(form.sitioWeb),
                direccion: nullableText(form.direccion),
                ciudad: nullableText(form.ciudad),
                departamento: nullableText(form.departamento),
                horarioAtencion: nullableText(form.horarioAtencion),
                latitud,
                longitud,
                activo: form.activo,
              }
            : clinic,
        ),
      );
      setEditorVisible(false);
      setSuccess('Ejemplo de clínica actualizado localmente.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(
        editingId ? `/institucionsalud/${editingId}` : '/institucionsalud',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: buildJsonHeaders(token),
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            tipo: 'clinica',
            descripcion: nullableText(form.descripcion),
            telefono: nullableText(form.telefono),
            correo: nullableText(form.correo),
            sitioWeb: nullableText(form.sitioWeb),
            direccion: nullableText(form.direccion),
            ciudad: nullableText(form.ciudad),
            departamento: nullableText(form.departamento),
            horarioAtencion: nullableText(form.horarioAtencion),
            latitud,
            longitud,
            activo: form.activo,
            ...(editingId
              ? { modificadoPor: user?.username || null }
              : { creadoPor: user?.username || null }),
          }),
        },
      );
      const body = await parseJsonResponse<Clinica & ApiError>(response);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            body,
            editingId ? 'No se pudo actualizar la clínica.' : 'No se pudo crear la clínica.',
          ),
        );
      }
      setEditorVisible(false);
      setSuccess(editingId ? 'Clínica actualizada correctamente.' : 'Clínica creada correctamente.');
      await loadClinicas();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'No se pudo guardar la clínica.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <AccessState
        icon="lock-closed-outline"
        title="Acceso administrativo"
        message="Inicia sesión con una cuenta administradora para gestionar las clínicas."
        button="Iniciar sesión"
        onPress={() => navigation.navigate('Login', { afterLogin: 'AdminClinicas' })}
      />
    );
  }

  if (!isAdminRole(user?.role)) {
    return (
      <AccessState
        icon="shield-outline"
        title="Acceso restringido"
        message="Tu cuenta no tiene permisos para crear o editar clínicas."
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
          <TouchableOpacity
            style={styles.adminTab}
            onPress={() => navigation.navigate('AdminSolicitudes')}
          >
            <Ionicons name="medkit-outline" size={17} color={appColors.textMuted} />
            <AppText style={styles.adminTabText}>Solicitudes médicas</AppText>
          </TouchableOpacity>
          <View style={[styles.adminTab, styles.adminTabActive]}>
            <Ionicons name="business-outline" size={17} color={appColors.background} />
            <AppText style={[styles.adminTabText, styles.adminTabTextActive]}>Clínicas</AppText>
          </View>
        </View>

        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={styles.heroIcon}>
            <Ionicons name="business-outline" size={28} color={appColors.info} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.eyebrow}>PANEL ADMINISTRATIVO</AppText>
            <AppText style={styles.title}>Administración de clínicas</AppText>
            <AppText style={styles.subtitle}>
              Crea, actualiza y controla las clínicas disponibles en la plataforma.
            </AppText>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={openCreate}>
            <Ionicons name="add" size={19} color={appColors.background} />
            <AppText style={styles.createButtonText}>Nueva clínica</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={counts.total} color={appColors.info} />
          <StatCard label="Activas" value={counts.activas} color={appColors.success} />
          <StatCard label="Inactivas" value={counts.inactivas} color={appColors.accent} />
          <StatCard label="Con ubicación" value={counts.ubicadas} color="#C084FC" />
        </View>

        {usingDemo ? (
          <View style={styles.demoBanner}>
            <Ionicons name="flask-outline" size={17} color="#F5B942" />
            <View style={styles.demoBannerCopy}>
              <AppText style={styles.demoBannerTitle}>Datos de demostración</AppText>
              <AppText style={styles.demoBannerText}>
                Estas clínicas son ficticias. Puedes editarlas para probar la interfaz, pero los cambios no se guardan en la base de datos.
              </AppText>
            </View>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={19} color={appColors.success} />
            <AppText style={styles.successText}>{success}</AppText>
          </View>
        ) : null}

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={appColors.textMuted} />
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por clínica, ciudad, teléfono o correo"
              placeholderTextColor={appColors.textMuted}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.filterRow}>
            {(['todas', 'activas', 'inactivas'] as ClinicFilter[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.filterChip, filter === item && styles.filterChipActive]}
                onPress={() => setFilter(item)}
              >
                <AppText style={[styles.filterText, filter === item && styles.filterTextActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={appColors.info} />
            <AppText style={styles.stateText}>Cargando clínicas...</AppText>
          </View>
        ) : error && !editorVisible ? (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={30} color={appColors.accent} />
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity onPress={() => void loadClinicas()}>
              <AppText style={styles.retryText}>Intentar nuevamente</AppText>
            </TouchableOpacity>
          </View>
        ) : filteredClinicas.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="business-outline" size={34} color={appColors.textMuted} />
            <AppText style={styles.emptyTitle}>No hay clínicas registradas</AppText>
            <AppText style={styles.stateText}>Crea la primera clínica o cambia los filtros.</AppText>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreate}>
              <AppText style={styles.emptyButtonText}>Crear clínica</AppText>
            </TouchableOpacity>
          </View>
        ) : isDesktop ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <AppText style={[styles.headerCell, styles.nameCell]}>Clínica</AppText>
              <AppText style={[styles.headerCell, styles.contactCell]}>Contacto</AppText>
              <AppText style={[styles.headerCell, styles.locationCell]}>Ubicación</AppText>
              <AppText style={[styles.headerCell, styles.statusCell]}>Estado</AppText>
              <AppText style={[styles.headerCell, styles.actionCell]}>Acción</AppText>
            </View>
            {filteredClinicas.map((clinic) => (
              <View key={clinic.institucionSaludId} style={styles.tableRow}>
                <View style={styles.nameCell}>
                  <AppText style={styles.primaryText}>{clinic.nombre}</AppText>
                  <AppText style={styles.secondaryText} numberOfLines={2}>
                    {clinic.descripcion || 'Sin descripción'}
                  </AppText>
                </View>
                <View style={styles.contactCell}>
                  <AppText style={styles.secondaryText}>{clinic.telefono || 'Sin teléfono'}</AppText>
                  <AppText style={styles.tertiaryText}>{clinic.correo || 'Sin correo'}</AppText>
                </View>
                <View style={styles.locationCell}>
                  <AppText style={styles.secondaryText}>
                    {[clinic.ciudad, clinic.departamento].filter(Boolean).join(', ') || 'Sin ubicación'}
                  </AppText>
                  <AppText style={styles.tertiaryText} numberOfLines={2}>
                    {clinic.direccion || 'Dirección no indicada'}
                  </AppText>
                </View>
                <View style={styles.statusCell}>
                  <StatusBadge active={clinic.activo} />
                </View>
                <View style={styles.actionCell}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEdit(clinic)}>
                    <Ionicons name="create-outline" size={17} color={appColors.info} />
                    <AppText style={styles.editButtonText}>Editar</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {filteredClinicas.map((clinic) => (
              <TouchableOpacity
                key={clinic.institucionSaludId}
                style={styles.mobileCard}
                onPress={() => openEdit(clinic)}
              >
                <View style={styles.mobileHeader}>
                  <View style={styles.clinicIcon}>
                    <Ionicons name="business" size={20} color={appColors.info} />
                  </View>
                  <View style={styles.mobileCopy}>
                    <AppText style={styles.primaryText}>{clinic.nombre}</AppText>
                    <AppText style={styles.secondaryText}>
                      {[clinic.ciudad, clinic.departamento].filter(Boolean).join(', ') || 'Sin ubicación'}
                    </AppText>
                  </View>
                  <StatusBadge active={clinic.activo} />
                </View>
                <View style={styles.mobileFooter}>
                  <AppText style={styles.tertiaryText}>{clinic.telefono || 'Sin teléfono'}</AppText>
                  <View style={styles.editLink}>
                    <AppText style={styles.editButtonText}>Editar</AppText>
                    <Ionicons name="chevron-forward" size={15} color={appColors.info} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ClinicEditor
        visible={editorVisible}
        editing={editingId != null}
        clinicId={editingId}
        demo={usingDemo}
        token={token}
        userName={user?.username || null}
        form={form}
        saving={saving}
        error={editorVisible ? error : null}
        desktop={isDesktop}
        onChange={updateForm}
        onClose={() => !saving && setEditorVisible(false)}
        onSave={() => void saveClinic()}
      />
    </ScrollView>
  );
}

function ClinicEditor(props: {
  visible: boolean;
  editing: boolean;
  clinicId: number | null;
  demo: boolean;
  token: string;
  userName: string | null;
  form: ClinicForm;
  saving: boolean;
  error: string | null;
  desktop: boolean;
  onChange: <K extends keyof ClinicForm>(key: K, value: ClinicForm[K]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>('datos');
  const latitude = Number(props.form.latitud);
  const longitude = Number(props.form.longitud);
  const hasMapCoordinates = Boolean(
    props.form.latitud.trim() &&
      props.form.longitud.trim() &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude),
  );

  useEffect(() => {
    if (props.visible) setActiveTab('datos');
  }, [props.visible, props.clinicId]);

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <AppText style={styles.modalEyebrow}>ADMINISTRACIÓN DE CLÍNICAS</AppText>
              <AppText style={styles.modalTitle}>
                {props.editing ? 'Editar clínica' : 'Nueva clínica'}
              </AppText>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={props.onClose} disabled={props.saving}>
              <Ionicons name="close" size={22} color={appColors.text} />
            </TouchableOpacity>
          </View>
          {props.editing ? (
            <View style={styles.editorTabs}>
              {(
                [
                  { id: 'datos', label: 'Datos', icon: 'business-outline' },
                  { id: 'servicios', label: 'Servicios', icon: 'medkit-outline' },
                  { id: 'medicamentos', label: 'Medicamentos', icon: 'medical-outline' },
                ] as Array<{ id: EditorTab; label: string; icon: keyof typeof Ionicons.glyphMap }>
              ).map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.editorTab, activeTab === tab.id && styles.editorTabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.id ? appColors.background : appColors.textMuted}
                  />
                  <AppText style={[styles.editorTabText, activeTab === tab.id && styles.editorTabTextActive]}>
                    {tab.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {activeTab === 'datos' ? (
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              <View style={props.desktop ? styles.formGrid : undefined}>
              <FormField label="Nombre de la clínica *" value={props.form.nombre} onChangeText={(value) => props.onChange('nombre', value)} wide={props.desktop} />
              <FormField label="Teléfono" value={props.form.telefono} onChangeText={(value) => props.onChange('telefono', value)} wide={props.desktop} />
              <FormField label="Correo" value={props.form.correo} onChangeText={(value) => props.onChange('correo', value)} wide={props.desktop} autoCapitalize="none" />
              <FormField label="Sitio web" value={props.form.sitioWeb} onChangeText={(value) => props.onChange('sitioWeb', value)} wide={props.desktop} placeholder="https://..." autoCapitalize="none" />
              <FormField label="Ciudad" value={props.form.ciudad} onChangeText={(value) => props.onChange('ciudad', value)} wide={props.desktop} />
              <FormField label="Departamento" value={props.form.departamento} onChangeText={(value) => props.onChange('departamento', value)} wide={props.desktop} />
              <FormField label="Dirección" value={props.form.direccion} onChangeText={(value) => props.onChange('direccion', value)} wide={props.desktop} />
              <FormField label="Horario de atención" value={props.form.horarioAtencion} onChangeText={(value) => props.onChange('horarioAtencion', value)} wide={props.desktop} />
              <FormField label="Latitud" value={props.form.latitud} onChangeText={(value) => props.onChange('latitud', value)} wide={props.desktop} placeholder="12.1364" />
              <FormField label="Longitud" value={props.form.longitud} onChangeText={(value) => props.onChange('longitud', value)} wide={props.desktop} placeholder="-86.2514" />
              </View>
              <LocationMapPicker
                latitude={hasMapCoordinates ? latitude : null}
                longitude={hasMapCoordinates ? longitude : null}
                onLocationChange={(nextLatitude, nextLongitude) => {
                  props.onChange('latitud', nextLatitude.toFixed(6));
                  props.onChange('longitud', nextLongitude.toFixed(6));
                }}
              />
              <AppText style={styles.formLabel}>Descripción</AppText>
              <AppTextInput
                multiline
                value={props.form.descripcion}
                onChangeText={(value) => props.onChange('descripcion', value)}
                placeholder="Servicios, especialidades o información relevante"
                placeholderTextColor={appColors.textMuted}
                style={[styles.formInput, styles.descriptionInput]}
              />
              <TouchableOpacity
                style={styles.activeToggle}
                onPress={() => props.onChange('activo', !props.form.activo)}
              >
                <View style={[styles.toggleTrack, props.form.activo && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, props.form.activo && styles.toggleThumbActive]} />
                </View>
                <View style={styles.toggleCopy}>
                  <AppText style={styles.toggleTitle}>Clínica activa</AppText>
                  <AppText style={styles.toggleText}>
                    {props.form.activo
                      ? 'Visible y disponible dentro de la plataforma.'
                      : 'Oculta temporalmente sin eliminar su información.'}
                  </AppText>
                </View>
              </TouchableOpacity>
              {props.error ? <AppText style={styles.modalError}>{props.error}</AppText> : null}
            </ScrollView>
          ) : props.clinicId ? (
            <ClinicCatalogPanel
              clinicId={props.clinicId}
              kind={activeTab}
              demo={props.demo}
              token={props.token}
              userName={props.userName}
            />
          ) : null}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={props.onClose} disabled={props.saving}>
              <AppText style={styles.cancelButtonText}>{activeTab === 'datos' ? 'Cancelar' : 'Cerrar'}</AppText>
            </TouchableOpacity>
            {activeTab === 'datos' ? (
              <TouchableOpacity
                style={[styles.saveButton, props.saving && styles.disabledButton]}
                onPress={props.onSave}
                disabled={props.saving}
              >
                {props.saving ? (
                  <ActivityIndicator color={appColors.background} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color={appColors.background} />
                    <AppText style={styles.saveButtonText}>
                      {props.editing ? 'Guardar cambios' : 'Crear clínica'}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ClinicCatalogPanel(props: {
  clinicId: number;
  kind: Exclude<EditorTab, 'datos'>;
  demo: boolean;
  token: string;
  userName: string | null;
}) {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [clinicServices, setClinicServices] = useState<ClinicService[]>([]);
  const [medicines, setMedicines] = useState<RareMedicine[]>([]);
  const [clinicMedicines, setClinicMedicines] = useState<ClinicMedicine[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState(0);
  const [servicePrice, setServicePrice] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [selectedMedicineId, setSelectedMedicineId] = useState(0);
  const [medicineAvailability, setMedicineAvailability] = useState<ClinicMedicine['disponibilidad']>('limitado');
  const [medicineQuantity, setMedicineQuantity] = useState('');
  const [medicinePrice, setMedicinePrice] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDetail, setNewItemDetail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (props.demo) {
      if (props.kind === 'servicios') {
        setServices(DEMO_SERVICES.map((item) => ({ ...item })));
        const assignedIds =
          props.clinicId === 2001
            ? [3001, 3002, 3003]
            : props.clinicId === 2002
              ? [3001, 3004]
              : props.clinicId === 2003
                ? [3001, 3002, 3003]
                : [3001];
        setClinicServices(
          assignedIds.map((catalogoServicioId, index) => ({
            institucionServicioId: props.clinicId * 10 + index,
            institucionSaludId: props.clinicId,
            catalogoServicioId,
            precioReferencia: 600 + index * 350,
            moneda: 'NIO',
            tiempoEntrega: index === 2 ? 'Resultado en 24 horas' : 'Atención el mismo día',
            disponible: props.clinicId !== 2004,
          })),
        );
      } else {
        setMedicines(DEMO_MEDICINES.map((item) => ({ ...item })));
        const assignedIds =
          props.clinicId === 2001
            ? [5001, 5002]
            : props.clinicId === 2002
              ? [5001]
              : props.clinicId === 2003
                ? [5001, 5002, 5003]
                : [5003];
        setClinicMedicines(
          assignedIds.map((medicamentoRaroId, index) => ({
            institucionMedicamentoId: props.clinicId * 10 + index,
            institucionSaludId: props.clinicId,
            medicamentoRaroId,
            disponibilidad: index === 1 ? 'por_encargo' : props.clinicId === 2004 ? 'agotado' : 'limitado',
            cantidadEstimada: index === 1 ? 0 : 3 + index,
            precioReferencia: 3200 + index * 1850,
            moneda: 'NIO',
            contactoAbastecimiento: 'Farmacia interna',
          })),
        );
      }
      setLoading(false);
      return;
    }

    try {
      const urls =
        props.kind === 'servicios'
          ? [
              '/catalogoservicio?activo=true',
              `/institucionservicio?institucionSaludId=${props.clinicId}`,
            ]
          : [
              '/medicamentoraro?activo=true',
              `/institucionmedicamento?institucionSaludId=${props.clinicId}`,
            ];
      const responses = await Promise.all(
        urls.map((url) => apiFetch(url, { headers: buildJsonHeaders(props.token) })),
      );
      const bodies = await Promise.all(responses.map((response) => parseJsonResponse<any>(response)));
      const failedIndex = responses.findIndex((response) => !response.ok);
      if (failedIndex >= 0) {
        throw new Error(getErrorMessage(bodies[failedIndex], 'No se pudo cargar el catálogo.'));
      }
      if (props.kind === 'servicios') {
        setServices(Array.isArray(bodies[0]) ? bodies[0] : []);
        setClinicServices(Array.isArray(bodies[1]) ? bodies[1] : []);
      } else {
        setMedicines(Array.isArray(bodies[0]) ? bodies[0] : []);
        setClinicMedicines(Array.isArray(bodies[1]) ? bodies[1] : []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, [props.clinicId, props.demo, props.kind, props.token]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const availableServices = services.filter(
    (service) => !clinicServices.some((item) => item.catalogoServicioId === service.catalogoServicioId),
  );
  const availableMedicines = medicines.filter(
    (medicine) => !clinicMedicines.some((item) => item.medicamentoRaroId === medicine.medicamentoRaroId),
  );

  const addService = async () => {
    if (!selectedServiceId || saving) {
      setError('Selecciona un servicio para agregar.');
      return;
    }
    const price = servicePrice.trim() ? Number(servicePrice) : null;
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError('El precio debe ser un número igual o mayor que cero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        institucionSaludId: props.clinicId,
        catalogoServicioId: selectedServiceId,
        precioReferencia: price,
        moneda: 'NIO',
        tiempoEntrega: nullableText(serviceTime),
        disponible: true,
        creadoPor: props.userName,
      };
      if (props.demo) {
        setClinicServices((current) => [
          ...current,
          { ...payload, institucionServicioId: Date.now() },
        ]);
      } else {
        const response = await apiFetch('/institucionservicio', {
          method: 'POST',
          headers: buildJsonHeaders(props.token),
          body: JSON.stringify(payload),
        });
        const body = await parseJsonResponse<ClinicService & ApiError>(response);
        if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo agregar el servicio.'));
        setClinicServices((current) => [...current, body]);
      }
      setSelectedServiceId(0);
      setServicePrice('');
      setServiceTime('');
      setSuccess('Servicio agregado a la clínica.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo agregar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const addMedicine = async () => {
    if (!selectedMedicineId || saving) {
      setError('Selecciona un medicamento para agregar.');
      return;
    }
    const quantity = medicineQuantity.trim() ? Number(medicineQuantity) : null;
    const price = medicinePrice.trim() ? Number(medicinePrice) : null;
    if (quantity != null && (!Number.isInteger(quantity) || quantity < 0)) {
      setError('La cantidad debe ser un número entero igual o mayor que cero.');
      return;
    }
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      setError('El precio debe ser un número igual o mayor que cero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        institucionSaludId: props.clinicId,
        medicamentoRaroId: selectedMedicineId,
        disponibilidad: medicineAvailability,
        cantidadEstimada: quantity,
        precioReferencia: price,
        moneda: 'NIO',
        contactoAbastecimiento: 'Farmacia interna',
        creadoPor: props.userName,
      };
      if (props.demo) {
        setClinicMedicines((current) => [
          ...current,
          { ...payload, institucionMedicamentoId: Date.now() },
        ]);
      } else {
        const response = await apiFetch('/institucionmedicamento', {
          method: 'POST',
          headers: buildJsonHeaders(props.token),
          body: JSON.stringify(payload),
        });
        const body = await parseJsonResponse<ClinicMedicine & ApiError>(response);
        if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo agregar el medicamento.'));
        setClinicMedicines((current) => [...current, body]);
      }
      setSelectedMedicineId(0);
      setMedicineQuantity('');
      setMedicinePrice('');
      setSuccess('Medicamento agregado a la clínica.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo agregar el medicamento.');
    } finally {
      setSaving(false);
    }
  };

  const createCatalogItem = async () => {
    if (!newItemName.trim() || saving) {
      setError(`Escribe el nombre del ${props.kind === 'servicios' ? 'servicio' : 'medicamento'}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (props.kind === 'servicios') {
        const payload = {
          nombre: newItemName.trim(),
          categoria: nullableText(newItemDetail),
          activo: true,
          creadoPor: props.userName,
        };
        if (props.demo) {
          const created = { ...payload, catalogoServicioId: Date.now() } as CatalogService;
          setServices((current) => [...current, created]);
          setSelectedServiceId(created.catalogoServicioId);
        } else {
          const response = await apiFetch('/catalogoservicio', {
            method: 'POST', headers: buildJsonHeaders(props.token), body: JSON.stringify(payload),
          });
          const body = await parseJsonResponse<CatalogService & ApiError>(response);
          if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo crear el servicio.'));
          setServices((current) => [...current, body]);
          setSelectedServiceId(body.catalogoServicioId);
        }
      } else {
        const payload = {
          nombreGenerico: newItemName.trim(),
          presentacion: nullableText(newItemDetail),
          requiereReceta: true,
          controlado: false,
          activo: true,
          creadoPor: props.userName,
        };
        if (props.demo) {
          const created = { ...payload, medicamentoRaroId: Date.now() } as RareMedicine;
          setMedicines((current) => [...current, created]);
          setSelectedMedicineId(created.medicamentoRaroId);
        } else {
          const response = await apiFetch('/medicamentoraro', {
            method: 'POST', headers: buildJsonHeaders(props.token), body: JSON.stringify(payload),
          });
          const body = await parseJsonResponse<RareMedicine & ApiError>(response);
          if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo crear el medicamento.'));
          setMedicines((current) => [...current, body]);
          setSelectedMedicineId(body.medicamentoRaroId);
        }
      }
      setNewItemName('');
      setNewItemDetail('');
      setSuccess('Elemento creado en el catálogo maestro. Ahora puedes asignarlo a la clínica.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el elemento.');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = async (item: ClinicService) => {
    const nextAvailable = !item.disponible;
    if (props.demo) {
      setClinicServices((current) => current.map((entry) => entry.institucionServicioId === item.institucionServicioId ? { ...entry, disponible: nextAvailable } : entry));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/institucionservicio/${item.institucionServicioId}`, {
        method: 'PATCH',
        headers: buildJsonHeaders(props.token),
        body: JSON.stringify({ disponible: nextAvailable, modificadoPor: props.userName }),
      });
      const body = await parseJsonResponse<ClinicService & ApiError>(response);
      if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo actualizar el servicio.'));
      setClinicServices((current) => current.map((entry) => entry.institucionServicioId === item.institucionServicioId ? body : entry));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const toggleMedicine = async (item: ClinicMedicine) => {
    const nextAvailability = item.disponibilidad === 'agotado' ? 'disponible' : 'agotado';
    if (props.demo) {
      setClinicMedicines((current) => current.map((entry) => entry.institucionMedicamentoId === item.institucionMedicamentoId ? { ...entry, disponibilidad: nextAvailability } : entry));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/institucionmedicamento/${item.institucionMedicamentoId}`, {
        method: 'PATCH',
        headers: buildJsonHeaders(props.token),
        body: JSON.stringify({ disponibilidad: nextAvailability, modificadoPor: props.userName }),
      });
      const body = await parseJsonResponse<ClinicMedicine & ApiError>(response);
      if (!response.ok || !body) throw new Error(getErrorMessage(body, 'No se pudo actualizar el medicamento.'));
      setClinicMedicines((current) => current.map((entry) => entry.institucionMedicamentoId === item.institucionMedicamentoId ? body : entry));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el medicamento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.catalogLoading}>
        <ActivityIndicator color={appColors.info} />
        <AppText style={styles.stateText}>Cargando catálogo...</AppText>
      </View>
    );
  }

  const isService = props.kind === 'servicios';
  return (
    <ScrollView contentContainerStyle={styles.catalogScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.catalogHeading}>
        <View style={styles.catalogHeadingIcon}>
          <Ionicons name={isService ? 'medkit-outline' : 'medical-outline'} size={22} color={appColors.info} />
        </View>
        <View style={styles.catalogHeadingCopy}>
          <AppText style={styles.catalogTitle}>{isService ? 'Servicios de la clínica' : 'Medicamentos específicos o difíciles de encontrar'}</AppText>
          <AppText style={styles.catalogSubtitle}>{isService ? 'Define precio, tiempo de atención y disponibilidad.' : 'Controla existencia, precio y disponibilidad en esta sede.'}</AppText>
        </View>
      </View>

      <View style={styles.assignedList}>
        {(isService ? clinicServices : clinicMedicines).length === 0 ? (
          <AppText style={styles.catalogEmpty}>Todavía no hay elementos asignados.</AppText>
        ) : isService ? (
          clinicServices.map((item) => {
            const service = services.find((entry) => entry.catalogoServicioId === item.catalogoServicioId);
            return (
              <View key={item.institucionServicioId} style={styles.catalogItem}>
                <View style={styles.catalogItemCopy}>
                  <AppText style={styles.catalogItemTitle}>{service?.nombre || `Servicio ${item.catalogoServicioId}`}</AppText>
                  <AppText style={styles.catalogItemMeta}>{service?.categoria || 'Sin categoría'} · {item.precioReferencia == null ? 'Sin precio' : `C$ ${Number(item.precioReferencia).toLocaleString('es-NI')}`} · {item.tiempoEntrega || 'Tiempo no indicado'}</AppText>
                </View>
                <TouchableOpacity style={[styles.availabilityButton, !item.disponible && styles.availabilityButtonOff]} onPress={() => void toggleService(item)} disabled={saving}>
                  <AppText style={[styles.availabilityText, !item.disponible && styles.availabilityTextOff]}>{item.disponible ? 'Disponible' : 'No disponible'}</AppText>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          clinicMedicines.map((item) => {
            const medicine = medicines.find((entry) => entry.medicamentoRaroId === item.medicamentoRaroId);
            return (
              <View key={item.institucionMedicamentoId} style={styles.catalogItem}>
                <View style={styles.catalogItemCopy}>
                  <AppText style={styles.catalogItemTitle}>{medicine?.nombreGenerico || `Medicamento ${item.medicamentoRaroId}`}</AppText>
                  <AppText style={styles.catalogItemMeta}>{[medicine?.concentracion, medicine?.presentacion].filter(Boolean).join(' · ') || 'Presentación no indicada'} · {item.cantidadEstimada == null ? 'Cantidad no indicada' : `${item.cantidadEstimada} unidades`} · {item.precioReferencia == null ? 'Sin precio' : `C$ ${Number(item.precioReferencia).toLocaleString('es-NI')}`}</AppText>
                </View>
                <TouchableOpacity style={[styles.availabilityButton, item.disponibilidad === 'agotado' && styles.availabilityButtonOff]} onPress={() => void toggleMedicine(item)} disabled={saving}>
                  <AppText style={[styles.availabilityText, item.disponibilidad === 'agotado' && styles.availabilityTextOff]}>{item.disponibilidad.replace('_', ' ')}</AppText>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.catalogFormCard}>
        <AppText style={styles.catalogFormTitle}>Agregar {isService ? 'servicio' : 'medicamento'} a esta clínica</AppText>
        <View style={styles.pickerFrame}>
          <Picker
            selectedValue={isService ? selectedServiceId : selectedMedicineId}
            onValueChange={(value) => isService ? setSelectedServiceId(Number(value)) : setSelectedMedicineId(Number(value))}
            style={styles.picker}
          >
            <Picker.Item label={`Selecciona ${isService ? 'un servicio' : 'un medicamento'}`} value={0} />
            {(isService ? availableServices : availableMedicines).map((item) => (
              <Picker.Item
                key={isService ? (item as CatalogService).catalogoServicioId : (item as RareMedicine).medicamentoRaroId}
                label={isService ? (item as CatalogService).nombre : (item as RareMedicine).nombreGenerico}
                value={isService ? (item as CatalogService).catalogoServicioId : (item as RareMedicine).medicamentoRaroId}
              />
            ))}
          </Picker>
        </View>
        <View style={styles.catalogFieldsRow}>
          <CatalogInput label="Precio de referencia (C$)" value={isService ? servicePrice : medicinePrice} onChangeText={isService ? setServicePrice : setMedicinePrice} placeholder="0.00" />
          {isService ? (
            <CatalogInput label="Tiempo de atención/entrega" value={serviceTime} onChangeText={setServiceTime} placeholder="Ej. 24 horas" />
          ) : (
            <CatalogInput label="Cantidad estimada" value={medicineQuantity} onChangeText={setMedicineQuantity} placeholder="0" />
          )}
        </View>
        {!isService ? (
          <View style={styles.pickerFrame}>
            <Picker selectedValue={medicineAvailability} onValueChange={(value) => setMedicineAvailability(value)} style={styles.picker}>
              <Picker.Item label="Disponible" value="disponible" />
              <Picker.Item label="Stock limitado" value="limitado" />
              <Picker.Item label="Agotado" value="agotado" />
              <Picker.Item label="Por encargo" value="por_encargo" />
            </Picker>
          </View>
        ) : null}
        <TouchableOpacity style={[styles.catalogPrimaryButton, saving && styles.disabledButton]} onPress={() => void (isService ? addService() : addMedicine())} disabled={saving}>
          <Ionicons name="add-circle-outline" size={18} color={appColors.background} />
          <AppText style={styles.catalogPrimaryButtonText}>Agregar a la clínica</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.masterCatalogCard}>
        <AppText style={styles.catalogFormTitle}>¿No aparece en el catálogo maestro?</AppText>
        <CatalogInput label={isService ? 'Nombre del nuevo servicio' : 'Nombre genérico del medicamento'} value={newItemName} onChangeText={setNewItemName} placeholder={isService ? 'Ej. Resonancia magnética' : 'Ej. Nitisinona'} />
        <CatalogInput label={isService ? 'Categoría' : 'Presentación'} value={newItemDetail} onChangeText={setNewItemDetail} placeholder={isService ? 'Consulta, diagnóstico...' : 'Cápsulas, vial...'} />
        <TouchableOpacity style={styles.catalogSecondaryButton} onPress={() => void createCatalogItem()} disabled={saving}>
          <Ionicons name="library-outline" size={17} color={appColors.info} />
          <AppText style={styles.catalogSecondaryButtonText}>Crear en catálogo maestro</AppText>
        </TouchableOpacity>
      </View>

      {error ? <AppText style={styles.modalError}>{error}</AppText> : null}
      {success ? <AppText style={styles.catalogSuccess}>{success}</AppText> : null}
    </ScrollView>
  );
}

function CatalogInput(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.catalogField}>
      <AppText style={styles.formLabel}>{props.label}</AppText>
      <AppTextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={appColors.textMuted} style={styles.formInput} />
    </View>
  );
}

function FormField(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  wide?: boolean;
  placeholder?: string;
  autoCapitalize?: 'none';
}) {
  return (
    <View style={[styles.formField, props.wide && styles.formFieldWide]}>
      <AppText style={styles.formLabel}>{props.label}</AppText>
      <AppTextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder || props.label.replace(' *', '')}
        placeholderTextColor={appColors.textMuted}
        autoCapitalize={props.autoCapitalize}
        style={styles.formInput}
      />
    </View>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const color = active ? appColors.success : appColors.accent;
  return (
    <View style={[styles.statusBadge, { backgroundColor: colorAlpha(color, '18') }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <AppText style={[styles.statusText, { color }]}>{active ? 'Activa' : 'Inactiva'}</AppText>
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
        <TouchableOpacity style={[styles.accessButton, { backgroundColor: accent }]} onPress={props.onPress}>
          <AppText style={styles.accessButtonText}>{props.button}</AppText>
        </TouchableOpacity>
      </View>
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
  createButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, backgroundColor: appColors.info, paddingHorizontal: 15, marginTop: 12 },
  createButtonText: { color: appColors.background, fontSize: 12, fontWeight: '900' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { minWidth: 140, flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 15, padding: 14 },
  statDot: { width: 9, height: 36, borderRadius: 5, marginRight: 12 },
  statValue: { color: appColors.text, fontSize: 21, fontWeight: '900' },
  statLabel: { color: appColors.textMuted, fontSize: 10, marginTop: 1 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colorAlpha('#F5B942', '12'), borderWidth: 1, borderColor: colorAlpha('#F5B942', '55'), borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 12 },
  demoBannerCopy: { flex: 1, marginLeft: 9 },
  demoBannerTitle: { color: '#F5B942', fontSize: 11, fontWeight: '900' },
  demoBannerText: { color: appColors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 2 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderWidth: 1, borderColor: colorAlpha(appColors.success, '55'), borderRadius: 12, backgroundColor: colorAlpha(appColors.success, '10'), padding: 11 },
  successText: { color: appColors.success, fontSize: 11, fontWeight: '800' },
  toolbar: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 16, padding: 12, marginBottom: 14 },
  searchBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: appColors.backgroundMuted, borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 12, marginBottom: 10 },
  searchInput: { flex: 1, color: appColors.text, fontSize: 13, paddingHorizontal: 9, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterChip: { minHeight: 34, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: appColors.border, paddingHorizontal: 12 },
  filterChipActive: { backgroundColor: appColors.info, borderColor: appColors.info },
  filterText: { color: appColors.textMuted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: appColors.background },
  stateBox: { minHeight: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 18, padding: 24 },
  stateText: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 9 },
  errorText: { color: appColors.accent, textAlign: 'center', marginTop: 9 },
  retryText: { color: appColors.info, fontWeight: '800', marginTop: 14 },
  emptyTitle: { color: appColors.text, fontSize: 17, fontWeight: '800', marginTop: 10 },
  emptyButton: { minHeight: 38, justifyContent: 'center', borderRadius: 10, backgroundColor: appColors.info, paddingHorizontal: 14, marginTop: 14 },
  emptyButtonText: { color: appColors.background, fontSize: 11, fontWeight: '900' },
  table: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 18, overflow: 'hidden' },
  tableRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: appColors.borderStrong, paddingHorizontal: 16 },
  tableHeader: { minHeight: 46, backgroundColor: appColors.backgroundMuted },
  headerCell: { color: appColors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  nameCell: { flex: 1.4, paddingRight: 14 },
  contactCell: { flex: 1, paddingRight: 14 },
  locationCell: { flex: 1.15, paddingRight: 14 },
  statusCell: { width: 105, alignItems: 'center' },
  actionCell: { width: 92, alignItems: 'flex-end' },
  primaryText: { color: appColors.text, fontSize: 13, fontWeight: '800' },
  secondaryText: { color: appColors.textSoft, fontSize: 11, lineHeight: 16, marginTop: 3 },
  tertiaryText: { color: appColors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: 9, fontWeight: '900' },
  editButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: appColors.info, borderRadius: 10, paddingHorizontal: 10 },
  editButtonText: { color: appColors.info, fontSize: 10, fontWeight: '800' },
  mobileCard: { backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  mobileHeader: { flexDirection: 'row', alignItems: 'center' },
  clinicIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '18'), marginRight: 10 },
  mobileCopy: { flex: 1, minWidth: 0 },
  mobileFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, marginTop: 11, borderTopWidth: 1, borderTopColor: appColors.borderStrong },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.overlay, 'D8'), padding: 12 },
  modalCard: { width: '100%', maxWidth: 780, maxHeight: '94%', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: appColors.borderStrong },
  modalEyebrow: { color: appColors.info, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: appColors.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: appColors.backgroundMuted },
  editorTabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: appColors.borderStrong, backgroundColor: appColors.backgroundMuted },
  editorTab: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 8 },
  editorTabActive: { backgroundColor: appColors.info },
  editorTabText: { color: appColors.textMuted, fontSize: 10, fontWeight: '800' },
  editorTabTextActive: { color: appColors.background },
  formScroll: { padding: 18 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  formField: { marginBottom: 13 },
  formFieldWide: { width: '50%', paddingHorizontal: 6 },
  formLabel: { color: appColors.textSoft, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  formInput: { minHeight: 44, color: appColors.text, backgroundColor: appColors.backgroundMuted, borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 12, outlineStyle: 'none' } as any,
  descriptionInput: { minHeight: 88, paddingTop: 11, textAlignVertical: 'top' },
  activeToggle: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: appColors.border, borderRadius: 13, backgroundColor: appColors.backgroundMuted, padding: 12, marginTop: 14 },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: appColors.borderStrong, paddingHorizontal: 3 },
  toggleTrackActive: { backgroundColor: appColors.success },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: appColors.textMuted },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: appColors.background },
  toggleCopy: { flex: 1, marginLeft: 11 },
  toggleTitle: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  toggleText: { color: appColors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 2 },
  modalError: { color: appColors.accent, fontSize: 11, lineHeight: 16, marginTop: 12 },
  catalogLoading: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
  catalogScroll: { padding: 18, paddingBottom: 28 },
  catalogHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  catalogHeadingIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '16'), marginRight: 11 },
  catalogHeadingCopy: { flex: 1 },
  catalogTitle: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  catalogSubtitle: { color: appColors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  assignedList: { gap: 8, marginBottom: 15 },
  catalogEmpty: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: appColors.border, borderRadius: 12, padding: 18 },
  catalogItem: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: appColors.border, borderRadius: 12, backgroundColor: appColors.backgroundMuted, padding: 11 },
  catalogItemCopy: { flex: 1, minWidth: 0 },
  catalogItemTitle: { color: appColors.text, fontSize: 11, fontWeight: '900' },
  catalogItemMeta: { color: appColors.textMuted, fontSize: 8, lineHeight: 13, marginTop: 3 },
  availabilityButton: { minHeight: 31, justifyContent: 'center', borderRadius: 9, backgroundColor: colorAlpha(appColors.success, '18'), paddingHorizontal: 9 },
  availabilityButtonOff: { backgroundColor: colorAlpha(appColors.accent, '18') },
  availabilityText: { color: appColors.success, fontSize: 8, fontWeight: '900', textTransform: 'capitalize' },
  availabilityTextOff: { color: appColors.accent },
  catalogFormCard: { borderWidth: 1, borderColor: colorAlpha(appColors.info, '55'), borderRadius: 14, backgroundColor: colorAlpha(appColors.info, '0C'), padding: 13, marginBottom: 12 },
  masterCatalogCard: { borderWidth: 1, borderColor: appColors.border, borderRadius: 14, backgroundColor: appColors.backgroundMuted, padding: 13 },
  catalogFormTitle: { color: appColors.text, fontSize: 12, fontWeight: '900', marginBottom: 10 },
  pickerFrame: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: appColors.border, borderRadius: 11, backgroundColor: appColors.backgroundMuted, overflow: 'hidden', marginBottom: 10 },
  picker: { color: appColors.text, backgroundColor: appColors.backgroundMuted },
  catalogFieldsRow: { flexDirection: 'row', gap: 10 },
  catalogField: { flex: 1, minWidth: 0, marginBottom: 10 },
  catalogPrimaryButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, backgroundColor: appColors.success, paddingHorizontal: 13 },
  catalogPrimaryButtonText: { color: appColors.background, fontSize: 10, fontWeight: '900' },
  catalogSecondaryButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: appColors.info, borderRadius: 10, paddingHorizontal: 13 },
  catalogSecondaryButtonText: { color: appColors.info, fontSize: 10, fontWeight: '900' },
  catalogSuccess: { color: appColors.success, fontSize: 10, lineHeight: 15, marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', padding: 15, borderTopWidth: 1, borderTopColor: appColors.borderStrong },
  cancelButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: appColors.border, borderRadius: 11, paddingHorizontal: 17 },
  cancelButtonText: { color: appColors.textSoft, fontSize: 11, fontWeight: '800' },
  saveButton: { minHeight: 43, minWidth: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, backgroundColor: appColors.success, paddingHorizontal: 17 },
  saveButtonText: { color: appColors.background, fontSize: 11, fontWeight: '900' },
  disabledButton: { opacity: 0.65 },
  accessRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 20 },
  accessCard: { width: '100%', maxWidth: 430, alignItems: 'center', backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border, borderRadius: 22, padding: 28 },
  accessIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  accessTitle: { color: appColors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  accessMessage: { color: appColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  accessButton: { minHeight: 46, minWidth: 180, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 20 },
  accessButtonText: { color: appColors.background, fontWeight: '900' },
});
