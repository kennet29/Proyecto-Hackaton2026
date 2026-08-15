import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';
import { LocationMapPicker } from '../components/LocationMapPicker';

const enhancedStyles = StyleSheet.create({
  overview: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  statIcon: { height: 29, width: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  statValue: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  statLabel: { color: appColors.textMuted, fontSize: 10, lineHeight: 12 },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, borderWidth: 1, borderColor: appColors.borderStrong, paddingHorizontal: 13, backgroundColor: appColors.surfaceStrong },
  searchInput: { flex: 1, minHeight: 46, color: appColors.text, fontSize: 14 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 5 },
  listTitle: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  listCount: { color: appColors.textMuted, fontSize: 12 },
  cardFoot: { minHeight: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  serviceIndicatorText: { color: appColors.textMuted, fontSize: 12, fontWeight: '700' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#C084FC20', marginRight: 6 },
  tagText: { color: '#D8B4FE', fontSize: 10, fontWeight: '800' },
  locationTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  coordinateRow: { flexDirection: 'row', gap: 10, marginTop: 11 },
  coordinateField: { flex: 1 },
});

type Props = NativeStackScreenProps<RootStackParamList, 'AdminInstituciones'>;
type Tab = 'clinicas' | 'servicios';
type Clinic = { institucionSaludId: number; nombre: string; tipo: string; ciudad?: string | null; departamento?: string | null; direccion?: string | null; telefono?: string | null; correo?: string | null; horarioAtencion?: string | null; latitud?: number | null; longitud?: number | null; activo: boolean };
type Service = { catalogoServicioId: number; codigo?: string | null; nombre: string; categoria?: string | null; descripcion?: string | null; requierePreparacion: boolean; requiereReferencia: boolean; activo: boolean };
type ClinicService = { institucionServicioId: number; institucionSaludId: number; catalogoServicioId: number; disponible: boolean };
type ApiError = { message?: string | string[]; error?: string };

const isAdmin = (role?: string) => ['admin', 'superadmin'].includes(role?.trim().toLowerCase() ?? '');
const clean = (value: string) => value.trim() || null;
const messageOf = (body: ApiError | null, fallback: string) => Array.isArray(body?.message) ? body.message.join('\n') : body?.message || body?.error || fallback;

const emptyClinic = () => ({ nombre: '', tipo: 'clinica', ciudad: '', departamento: '', direccion: '', telefono: '', correo: '', horarioAtencion: '', latitud: '', longitud: '', activo: true });
const emptyService = () => ({ codigo: '', nombre: '', categoria: '', descripcion: '', requierePreparacion: false, requiereReferencia: false, activo: true });

export function AdminInstitucionesScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>('clinicas');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [links, setLinks] = useState<ClinicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicForm, setClinicForm] = useState(emptyClinic());
  const [serviceForm, setServiceForm] = useState(emptyService());
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [clinicModal, setClinicModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!token || !isAdmin(user?.role)) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [clinicsResponse, servicesResponse, linksResponse] = await Promise.all([
        apiFetch('/institucionsalud', { headers: buildJsonHeaders(token) }),
        apiFetch('/catalogoservicio', { headers: buildJsonHeaders(token) }),
        apiFetch('/institucionservicio', { headers: buildJsonHeaders(token) }),
      ]);
      const [clinicBody, serviceBody, linkBody] = await Promise.all([
        parseJsonResponse<Clinic[] & ApiError>(clinicsResponse), parseJsonResponse<Service[] & ApiError>(servicesResponse), parseJsonResponse<ClinicService[] & ApiError>(linksResponse),
      ]);
      if (!clinicsResponse.ok) throw new Error(messageOf(clinicBody, 'No se pudieron cargar las clínicas.'));
      if (!servicesResponse.ok) throw new Error(messageOf(serviceBody, 'No se pudieron cargar los servicios.'));
      if (!linksResponse.ok) throw new Error(messageOf(linkBody, 'No se pudieron cargar las asignaciones.'));
      setClinics(Array.isArray(clinicBody) ? clinicBody : []); setServices(Array.isArray(serviceBody) ? serviceBody : []); setLinks(Array.isArray(linkBody) ? linkBody : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el panel.'); }
    finally { setLoading(false); }
  }, [token, user?.role]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const assigned = useMemo(() => selectedClinic ? links.filter((item) => item.institucionSaludId === selectedClinic.institucionSaludId) : [], [links, selectedClinic]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleClinics = useMemo(() => clinics.filter((clinic) => !normalizedQuery || [clinic.nombre, clinic.tipo, clinic.ciudad, clinic.departamento, clinic.direccion].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))), [clinics, normalizedQuery]);
  const visibleServices = useMemo(() => services.filter((service) => !normalizedQuery || [service.nombre, service.codigo, service.categoria, service.descripcion].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))), [services, normalizedQuery]);
  const activeClinicCount = useMemo(() => clinics.filter((clinic) => clinic.activo).length, [clinics]);
  const activeServiceCount = useMemo(() => services.filter((service) => service.activo).length, [services]);

  const request = async (path: string, method: 'POST' | 'PATCH', payload: object) => {
    const response = await apiFetch(path, { method, headers: buildJsonHeaders(token), body: JSON.stringify(payload) });
    const body = await parseJsonResponse<ApiError>(response);
    if (!response.ok) throw new Error(messageOf(body, 'No se pudieron guardar los cambios.'));
  };

  const saveClinic = async () => {
    if (!clinicForm.nombre.trim()) { Alert.alert('Nombre requerido', 'Ingresa el nombre de la clínica o institución.'); return; }
    setSaving(true);
    try {
      const latitud = Number(clinicForm.latitud);
      const longitud = Number(clinicForm.longitud);
      if ((clinicForm.latitud && Number.isNaN(latitud)) || (clinicForm.longitud && Number.isNaN(longitud))) throw new Error('Las coordenadas deben ser números válidos.');
      await request(editingClinic ? `/institucionsalud/${editingClinic.institucionSaludId}` : '/institucionsalud', editingClinic ? 'PATCH' : 'POST', { ...clinicForm, ciudad: clean(clinicForm.ciudad), departamento: clean(clinicForm.departamento), direccion: clean(clinicForm.direccion), telefono: clean(clinicForm.telefono), correo: clean(clinicForm.correo), horarioAtencion: clean(clinicForm.horarioAtencion), latitud: clinicForm.latitud ? latitud : null, longitud: clinicForm.longitud ? longitud : null, creadoPor: user?.username, modificadoPor: user?.username });
      setClinicModal(false); await load();
    } catch (e) { Alert.alert('No se guardó', e instanceof Error ? e.message : 'Inténtalo nuevamente.'); } finally { setSaving(false); }
  };

  const saveService = async () => {
    if (!serviceForm.nombre.trim()) { Alert.alert('Nombre requerido', 'Ingresa el nombre del servicio.'); return; }
    setSaving(true);
    try {
      await request(editingService ? `/catalogoservicio/${editingService.catalogoServicioId}` : '/catalogoservicio', editingService ? 'PATCH' : 'POST', { ...serviceForm, codigo: clean(serviceForm.codigo), categoria: clean(serviceForm.categoria), descripcion: clean(serviceForm.descripcion), creadoPor: user?.username, modificadoPor: user?.username });
      setServiceModal(false); await load();
    } catch (e) { Alert.alert('No se guardó', e instanceof Error ? e.message : 'Inténtalo nuevamente.'); } finally { setSaving(false); }
  };

  const toggleAssignment = async (service: Service) => {
    if (!selectedClinic) return;
    const existing = assigned.find((item) => item.catalogoServicioId === service.catalogoServicioId);
    setSaving(true);
    try {
      if (existing) await request(`/institucionservicio/${existing.institucionServicioId}`, 'PATCH', { disponible: !existing.disponible, modificadoPor: user?.username });
      else await request('/institucionservicio', 'POST', { institucionSaludId: selectedClinic.institucionSaludId, catalogoServicioId: service.catalogoServicioId, disponible: true, creadoPor: user?.username });
      await load();
    } catch (e) { Alert.alert('No se actualizó', e instanceof Error ? e.message : 'Inténtalo nuevamente.'); } finally { setSaving(false); }
  };

  if (!token || !isAdmin(user?.role)) return <Access onPress={() => navigation.navigate(token ? 'MenuPrincipal' : 'Login')} />;

  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="business-outline" size={28} color={appColors.info} /></View><View style={styles.heroCopy}><AppText style={styles.eyebrow}>PANEL ADMINISTRATIVO</AppText><AppText style={styles.title}>Clínicas y servicios</AppText><AppText style={styles.subtitle}>Mantén actualizado el directorio de atención y los servicios disponibles.</AppText></View><TouchableOpacity onPress={() => void load()} style={styles.refresh}><Ionicons name="refresh-outline" size={20} color={appColors.info}/></TouchableOpacity></View>
    <View style={styles.tabs}><TabButton active={tab === 'clinicas'} icon="business-outline" label="Clínicas" onPress={() => setTab('clinicas')} /><TabButton active={tab === 'servicios'} icon="medical-outline" label="Servicios" onPress={() => setTab('servicios')} /></View>
    <View style={enhancedStyles.overview}>
      <Stat icon="business-outline" value={clinics.length} label="Instituciones" color={appColors.info} />
      <Stat icon="checkmark-circle-outline" value={activeClinicCount} label="Activas" color={appColors.success} />
      <Stat icon="medical-outline" value={activeServiceCount} label="Servicios activos" color="#C084FC" />
    </View>
    <View style={enhancedStyles.searchBox}>
      <Ionicons name="search-outline" size={19} color={appColors.textMuted} />
      <AppTextInput value={query} onChangeText={setQuery} placeholder={tab === 'clinicas' ? 'Buscar por nombre, ciudad o tipo' : 'Buscar por servicio o categoría'} placeholderTextColor={appColors.textMuted} style={enhancedStyles.searchInput} />
      {query ? <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={appColors.textMuted} /></TouchableOpacity> : null}
    </View>
    <View style={enhancedStyles.listHeading}><AppText style={enhancedStyles.listTitle}>{tab === 'clinicas' ? 'Directorio de instituciones' : 'Catálogo de servicios'}</AppText><AppText style={enhancedStyles.listCount}>{tab === 'clinicas' ? visibleClinics.length : visibleServices.length} resultados</AppText></View>
    {error ? <View style={styles.error}><AppText style={styles.errorText}>{error}</AppText><TouchableOpacity onPress={() => void load()}><AppText style={styles.retry}>Reintentar</AppText></TouchableOpacity></View> : null}
    {loading ? <ActivityIndicator color={appColors.info} size="large" style={styles.loader}/> : tab === 'clinicas' ? <>
      <Action label="Nueva clínica" icon="add-circle-outline" onPress={() => { setEditingClinic(null); setClinicForm(emptyClinic()); setClinicModal(true); }} />
      {visibleClinics.map((clinic) => <View key={clinic.institucionSaludId} style={styles.card}><View style={styles.cardTop}><View style={styles.cardIcon}><Ionicons name="business-outline" size={22} color={appColors.info}/></View><View style={styles.cardCopy}><AppText style={styles.cardTitle}>{clinic.nombre}</AppText><AppText style={styles.cardMeta}>{clinic.tipo} · {clinic.ciudad || 'Sin ciudad'}</AppText></View><Status active={clinic.activo}/></View>{clinic.direccion ? <AppText style={styles.detail}>{clinic.direccion}</AppText> : null}<View style={enhancedStyles.cardFoot}><View style={enhancedStyles.serviceIndicator}><Ionicons name="medical-outline" size={14} color={appColors.success}/><AppText style={enhancedStyles.serviceIndicatorText}>{links.filter((link) => link.institucionSaludId === clinic.institucionSaludId && link.disponible).length} servicios disponibles</AppText></View>{clinic.telefono ? <Ionicons name="call-outline" size={16} color={appColors.textMuted}/> : null}</View><View style={styles.actions}><SmallAction label="Editar" icon="create-outline" onPress={() => { setEditingClinic(clinic); setClinicForm({ nombre: clinic.nombre, tipo: clinic.tipo, ciudad: clinic.ciudad || '', departamento: clinic.departamento || '', direccion: clinic.direccion || '', telefono: clinic.telefono || '', correo: clinic.correo || '', horarioAtencion: clinic.horarioAtencion || '', latitud: clinic.latitud?.toString() || '', longitud: clinic.longitud?.toString() || '', activo: clinic.activo }); setClinicModal(true); }} /><SmallAction label="Gestionar servicios" icon="list-outline" onPress={() => { setSelectedClinic(clinic); setTab('servicios'); }} /></View></View>)}
      {!visibleClinics.length ? <Empty icon="business-outline" text={query ? 'No encontramos instituciones con esa búsqueda.' : 'Aún no hay clínicas registradas.'}/> : null}
    </> : <>
      <Action label="Nuevo servicio" icon="add-circle-outline" onPress={() => { setEditingService(null); setServiceForm(emptyService()); setServiceModal(true); }} />
      {selectedClinic ? <View style={styles.selection}><View><AppText style={styles.selectionLabel}>ASIGNANDO SERVICIOS A</AppText><AppText style={styles.selectionName}>{selectedClinic.nombre}</AppText></View><TouchableOpacity onPress={() => setSelectedClinic(null)}><Ionicons name="close-circle-outline" size={22} color={appColors.textMuted}/></TouchableOpacity></View> : <AppText style={styles.helper}>Selecciona “Servicios” en una clínica para asignar los servicios que ofrece.</AppText>}
      {visibleServices.map((service) => { const link = assigned.find((item) => item.catalogoServicioId === service.catalogoServicioId); return <View key={service.catalogoServicioId} style={styles.card}><View style={styles.cardTop}><View style={[styles.cardIcon, { backgroundColor: '#38E28E18' }]}><Ionicons name="medical-outline" size={22} color={appColors.success}/></View><View style={styles.cardCopy}><AppText style={styles.cardTitle}>{service.nombre}</AppText><AppText style={styles.cardMeta}>{service.categoria || 'Sin categoría'}{service.codigo ? ` · ${service.codigo}` : ''}</AppText></View><Status active={service.activo}/></View>{service.descripcion ? <AppText style={styles.detail}>{service.descripcion}</AppText> : null}<View style={enhancedStyles.cardFoot}>{service.requierePreparacion ? <Tag label="Preparación" /> : null}{service.requiereReferencia ? <Tag label="Referencia" /> : null}</View><View style={styles.actions}><SmallAction label="Editar" icon="create-outline" onPress={() => { setEditingService(service); setServiceForm({ codigo: service.codigo || '', nombre: service.nombre, categoria: service.categoria || '', descripcion: service.descripcion || '', requierePreparacion: service.requierePreparacion, requiereReferencia: service.requiereReferencia, activo: service.activo }); setServiceModal(true); }} />{selectedClinic ? <SmallAction label={link?.disponible ? 'Disponible' : link ? 'No disponible' : 'Asignar'} icon={link?.disponible ? 'checkmark-circle-outline' : 'add-circle-outline'} onPress={() => void toggleAssignment(service)} /> : null}</View></View>; })}
      {!visibleServices.length ? <Empty icon="medical-outline" text={query ? 'No encontramos servicios con esa búsqueda.' : 'Aún no hay servicios en el catálogo.'}/> : null}
    </>}
  </ScrollView><ClinicModal visible={clinicModal} form={clinicForm} setForm={setClinicForm} saving={saving} editing={!!editingClinic} onClose={() => setClinicModal(false)} onSave={() => void saveClinic()} /><ServiceModal visible={serviceModal} form={serviceForm} setForm={setServiceForm} saving={saving} editing={!!editingService} onClose={() => setServiceModal(false)} onSave={() => void saveService()} /></SafeAreaView>;
}

function Access({ onPress }: { onPress: () => void }) { return <SafeAreaView style={styles.access}><Ionicons name="shield-outline" size={42} color={appColors.accent}/><AppText style={styles.title}>Acceso restringido</AppText><AppText style={styles.subtitle}>Esta sección es exclusiva para administradores.</AppText><Action label="Volver" icon="arrow-back-outline" onPress={onPress}/></SafeAreaView>; }
function TabButton({ active, icon, label, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) { return <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Ionicons name={icon} size={18} color={active ? appColors.background : appColors.textMuted}/><AppText style={[styles.tabText, active && styles.tabTextActive]}>{label}</AppText></TouchableOpacity>; }
function Stat({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) { return <View style={enhancedStyles.stat}><View style={[enhancedStyles.statIcon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={16} color={color}/></View><View><AppText style={enhancedStyles.statValue}>{value}</AppText><AppText style={enhancedStyles.statLabel}>{label}</AppText></View></View>; }
function Tag({ label }: { label: string }) { return <View style={enhancedStyles.tag}><AppText style={enhancedStyles.tagText}>{label}</AppText></View>; }
function Action({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) { return <TouchableOpacity style={styles.primary} onPress={onPress}><Ionicons name={icon} size={19} color={appColors.background}/><AppText style={styles.primaryText}>{label}</AppText></TouchableOpacity>; }
function SmallAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) { return <TouchableOpacity style={styles.smallAction} onPress={onPress}><Ionicons name={icon} size={16} color={appColors.info}/><AppText style={styles.smallText}>{label}</AppText></TouchableOpacity>; }
function Status({ active }: { active: boolean }) { return <View style={[styles.status, { backgroundColor: active ? '#38E28E24' : '#FF4D7324' }]}><AppText style={{ color: active ? appColors.success : appColors.accent, fontSize: 11, fontWeight: '800' }}>{active ? 'ACTIVA' : 'INACTIVA'}</AppText></View>; }
function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.empty}><Ionicons name={icon} size={34} color={appColors.textMuted}/><AppText style={styles.helper}>{text}</AppText></View>; }

function Field({ label, value, onChangeText, keyboardType = 'default', multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad'; multiline?: boolean }) { return <View style={styles.field}><AppText style={styles.fieldLabel}>{label}</AppText><AppTextInput style={[styles.input, multiline && styles.textarea]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize="sentences" multiline={multiline} /></View>; }
function BooleanRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <TouchableOpacity style={styles.booleanRow} onPress={() => onChange(!value)}><View style={[styles.checkbox, value && styles.checkboxActive]}>{value ? <Ionicons name="checkmark" size={15} color={appColors.background}/> : null}</View><AppText style={styles.booleanText}>{label}</AppText></TouchableOpacity>; }
function FormModal({ visible, title, children, saving, onClose, onSave }: { visible: boolean; title: string; children: React.ReactNode; saving: boolean; onClose: () => void; onSave: () => void }) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.modal}><View style={styles.modalHeader}><AppText style={styles.modalTitle}>{title}</AppText><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={appColors.text}/></TouchableOpacity></View><ScrollView showsVerticalScrollIndicator={false}>{children}<TouchableOpacity style={[styles.primary, saving && styles.disabled]} disabled={saving} onPress={onSave}>{saving ? <ActivityIndicator color={appColors.background}/> : <><Ionicons name="save-outline" size={19} color={appColors.background}/><AppText style={styles.primaryText}>Guardar cambios</AppText></>}</TouchableOpacity></ScrollView></View></View></Modal>; }
function ClinicModal({ visible, form, setForm, saving, editing, onClose, onSave }: { visible: boolean; form: ReturnType<typeof emptyClinic>; setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyClinic>>>; saving: boolean; editing: boolean; onClose: () => void; onSave: () => void }) { const latitude = Number(form.latitud); const longitude = Number(form.longitud); const hasCoordinates = Boolean(form.latitud && form.longitud && !Number.isNaN(latitude) && !Number.isNaN(longitude)); return <FormModal visible={visible} title={editing ? 'Editar clínica' : 'Nueva clínica'} saving={saving} onClose={onClose} onSave={onSave}><Field label="Nombre *" value={form.nombre} onChangeText={(nombre) => setForm((old) => ({ ...old, nombre }))}/><AppText style={styles.fieldLabel}>Tipo</AppText><View style={styles.pills}>{['clinica', 'hospital', 'laboratorio'].map((tipo) => <TouchableOpacity key={tipo} style={[styles.pill, form.tipo === tipo && styles.pillActive]} onPress={() => setForm((old) => ({ ...old, tipo }))}><AppText style={[styles.pillText, form.tipo === tipo && styles.pillTextActive]}>{tipo}</AppText></TouchableOpacity>)}</View><Field label="Ciudad" value={form.ciudad} onChangeText={(ciudad) => setForm((old) => ({ ...old, ciudad }))}/><Field label="Departamento" value={form.departamento} onChangeText={(departamento) => setForm((old) => ({ ...old, departamento }))}/><Field label="Dirección" value={form.direccion} onChangeText={(direccion) => setForm((old) => ({ ...old, direccion }))} multiline/><View style={enhancedStyles.locationTitle}><Ionicons name="location-outline" size={17} color={appColors.info}/><AppText style={styles.fieldLabel}>Ubicación en el mapa</AppText></View><LocationMapPicker latitude={hasCoordinates ? latitude : null} longitude={hasCoordinates ? longitude : null} onLocationChange={(latitud: number, longitud: number) => setForm((old) => ({ ...old, latitud: latitud.toFixed(6), longitud: longitud.toFixed(6) }))}/><View style={enhancedStyles.coordinateRow}><View style={enhancedStyles.coordinateField}><Field label="Latitud" value={form.latitud} onChangeText={(latitud) => setForm((old) => ({ ...old, latitud }))} keyboardType="default"/></View><View style={enhancedStyles.coordinateField}><Field label="Longitud" value={form.longitud} onChangeText={(longitud) => setForm((old) => ({ ...old, longitud }))} keyboardType="default"/></View></View><Field label="Teléfono" value={form.telefono} onChangeText={(telefono) => setForm((old) => ({ ...old, telefono }))} keyboardType="phone-pad"/><Field label="Correo" value={form.correo} onChangeText={(correo) => setForm((old) => ({ ...old, correo }))} keyboardType="email-address"/><Field label="Horario de atención" value={form.horarioAtencion} onChangeText={(horarioAtencion) => setForm((old) => ({ ...old, horarioAtencion }))}/><BooleanRow label="Institución activa" value={form.activo} onChange={(activo) => setForm((old) => ({ ...old, activo }))}/></FormModal>; }
function ServiceModal({ visible, form, setForm, saving, editing, onClose, onSave }: { visible: boolean; form: ReturnType<typeof emptyService>; setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyService>>>; saving: boolean; editing: boolean; onClose: () => void; onSave: () => void }) { return <FormModal visible={visible} title={editing ? 'Editar servicio' : 'Nuevo servicio'} saving={saving} onClose={onClose} onSave={onSave}><Field label="Nombre *" value={form.nombre} onChangeText={(nombre) => setForm((old) => ({ ...old, nombre }))}/><Field label="Código" value={form.codigo} onChangeText={(codigo) => setForm((old) => ({ ...old, codigo }))}/><Field label="Categoría" value={form.categoria} onChangeText={(categoria) => setForm((old) => ({ ...old, categoria }))}/><Field label="Descripción" value={form.descripcion} onChangeText={(descripcion) => setForm((old) => ({ ...old, descripcion }))} multiline/><BooleanRow label="Requiere preparación" value={form.requierePreparacion} onChange={(requierePreparacion) => setForm((old) => ({ ...old, requierePreparacion }))}/><BooleanRow label="Requiere referencia" value={form.requiereReferencia} onChange={(requiereReferencia) => setForm((old) => ({ ...old, requiereReferencia }))}/><BooleanRow label="Servicio activo" value={form.activo} onChange={(activo) => setForm((old) => ({ ...old, activo }))}/></FormModal>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: appColors.background }, container: { padding: 18, gap: 12 }, access: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30, backgroundColor: appColors.background }, hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18, backgroundColor: appColors.surfaceStrong, borderColor: appColors.borderStrong, borderWidth: 1, borderRadius: 20 }, heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29B6FF1A' }, heroCopy: { flex: 1 }, eyebrow: { fontSize: 11, color: appColors.info, fontWeight: '800', letterSpacing: 1 }, title: { color: appColors.text, fontSize: 23, fontWeight: '900', marginTop: 2 }, subtitle: { color: appColors.textSoft, fontSize: 13, lineHeight: 19, marginTop: 4 }, refresh: { padding: 8 }, tabs: { flexDirection: 'row', gap: 8 }, tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderRadius: 12, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface }, tabActive: { backgroundColor: appColors.info, borderColor: appColors.info }, tabText: { color: appColors.textMuted, fontWeight: '800' }, tabTextActive: { color: appColors.background }, primary: { minHeight: 48, borderRadius: 13, backgroundColor: appColors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 15 }, primaryText: { color: appColors.background, fontWeight: '900' }, card: { padding: 15, gap: 11, borderRadius: 16, backgroundColor: appColors.surface, borderWidth: 1, borderColor: appColors.border }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, cardIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#29B6FF18' }, cardCopy: { flex: 1 }, cardTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' }, cardMeta: { color: appColors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }, detail: { color: appColors.textSoft, fontSize: 13 }, status: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 99 }, actions: { flexDirection: 'row', gap: 9 }, smallAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#29B6FF14' }, smallText: { color: appColors.info, fontSize: 12, fontWeight: '800' }, helper: { color: appColors.textMuted, textAlign: 'center', lineHeight: 19, padding: 10 }, empty: { padding: 32, alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: appColors.border, borderRadius: 16 }, selection: { backgroundColor: '#29B6FF14', borderColor: '#29B6FF50', borderWidth: 1, padding: 13, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, selectionLabel: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, selectionName: { color: appColors.text, fontWeight: '900', marginTop: 2 }, loader: { marginVertical: 36 }, error: { padding: 12, borderRadius: 12, backgroundColor: '#FF4D7318', borderWidth: 1, borderColor: '#FF4D7350', gap: 7 }, errorText: { color: appColors.textSoft }, retry: { color: appColors.info, fontWeight: '800' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000A8' }, modal: { maxHeight: '92%', padding: 20, backgroundColor: appColors.surfaceStrong, borderTopLeftRadius: 25, borderTopRightRadius: 25, gap: 12 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, modalTitle: { color: appColors.text, fontSize: 20, fontWeight: '900' }, field: { gap: 6, marginBottom: 12 }, fieldLabel: { color: appColors.textSoft, fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { minHeight: 46, borderRadius: 11, paddingHorizontal: 13, color: appColors.text, backgroundColor: appColors.backgroundMuted, borderWidth: 1, borderColor: appColors.border }, textarea: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' }, pills: { flexDirection: 'row', gap: 7, marginBottom: 14 }, pill: { borderWidth: 1, borderColor: appColors.border, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7 }, pillActive: { backgroundColor: appColors.info, borderColor: appColors.info }, pillText: { color: appColors.textMuted, fontSize: 12, textTransform: 'capitalize' }, pillTextActive: { color: appColors.background, fontWeight: '900' }, booleanRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 }, checkbox: { height: 21, width: 21, borderWidth: 1, borderColor: appColors.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, checkboxActive: { backgroundColor: appColors.success, borderColor: appColors.success }, booleanText: { color: appColors.textSoft, fontSize: 13, fontWeight: '700' }, disabled: { opacity: .6 } });
