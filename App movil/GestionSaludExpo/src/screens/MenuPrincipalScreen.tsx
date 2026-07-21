import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';
import {
  getNanoAppearance,
  loadNanoAppearanceId,
  NanoAppearance,
  NanoAppearancePreview,
} from '../components/NanoAppearancePreview';

type MenuTabKey = 'inicio' | 'medico' | 'bienestar' | 'gestion';

type OptionItem = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  navigateTo?: keyof RootStackParamList;
  actionTab?: MenuTabKey;
};

type TabMeta = {
  key: MenuTabKey;
  label: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const tabMeta: TabMeta[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    title: 'Menu Principal',
    subtitle: 'Entra por bloques para moverte mas rapido entre salud, bienestar y gestion.',
    icon: 'home-outline',
  },
  {
    key: 'medico',
    label: 'Medico',
    title: 'Seccion Medica',
    subtitle: 'Concentra consultas, citas, tratamientos y registros clinicos en un solo flujo.',
    icon: 'medkit-outline',
  },
  {
    key: 'bienestar',
    label: 'Bienestar',
    title: 'Bienestar Diario',
    subtitle: 'Sigue habitos, ejercicio, peso y bienestar emocional desde una misma vista.',
    icon: 'barbell-outline',
  },
  {
    key: 'gestion',
    label: 'Gestion',
    title: 'Gestion y Soporte',
    subtitle: 'Administra expediente, perfiles, educacion y acceso a soporte general.',
    icon: 'folder-open-outline',
  },
];

const homeOptions: OptionItem[] = [
  {
    key: 'home-expediente',
    label: 'Personas Asociadas',
    description: 'Administra familiares vinculados y sus datos de salud desde un solo lugar.',
    icon: 'file-tray-full-outline',
    accent: appColors.info,
    navigateTo: 'ExpedienteGestion',
  },
  {
    key: 'home-medico',
    label: 'Seccion Medica',
    description: 'Reune consultas, citas, vacunas, medicacion y seguimiento clinico.',
    icon: 'medkit-outline',
    accent: appColors.info,
    actionTab: 'medico',
  },
  {
    key: 'home-bienestar',
    label: 'Habitos, Ejercicio y Peso',
    description: 'Agrupa habitos, peso, ejercicio, salud mental y control diario.',
    icon: 'fitness-outline',
    accent: appColors.success,
    actionTab: 'bienestar',
  },
  {
    key: 'home-gestion',
    label: 'Gestion y Soporte',
    description: 'Incluye pacientes, documentos, educacion, recordatorios y soporte.',
    icon: 'layers-outline',
    accent: appColors.accent,
    actionTab: 'gestion',
  },
];

const medicalOptions: OptionItem[] = [
  {
    key: 'resumen',
    label: 'Resumen Del Paciente',
    description: 'Visualiza indicadores, alertas y progreso',
    icon: 'person-circle-outline',
    accent: appColors.accent,
    navigateTo: 'PacienteResumen',
  },
  {
    key: 'consulta',
    label: 'Consultas Medicas',
    description: 'Revisa y registra consultas medicas',
    icon: 'medkit-outline',
    accent: appColors.info,
    navigateTo: 'ConsultaList',
  },
  {
    key: 'citas',
    label: 'Citas Programadas',
    description: 'Agenda y seguimiento de citas',
    icon: 'calendar-outline',
    accent: appColors.accent,
    navigateTo: 'CitaForm',
  },
  {
    key: 'vacunas',
    label: 'Vacunas',
    description: 'Registro de dosis, lotes y proximas fechas',
    icon: 'shield-checkmark-outline',
    accent: appColors.info,
    navigateTo: 'VacunaForm',
  },
  {
    key: 'medicacion',
    label: 'Medicacion',
    description: 'Dosis, duracion, vias y seguimiento',
    icon: 'flask-outline',
    accent: appColors.accent,
    navigateTo: 'MedicacionForm',
  },
  {
    key: 'condiciones-cronicas',
    label: 'Enfermedades Cronicas',
    description: 'Condiciones, metas y monitoreo prolongado',
    icon: 'pulse-outline',
    accent: appColors.success,
    navigateTo: 'CondicionCronicaForm',
  },
  {
    key: 'control-cronico',
    label: 'Control Cronico',
    description: 'Registra mediciones y seguimiento de condiciones ya abiertas',
    icon: 'stats-chart-outline',
    accent: appColors.success,
    navigateTo: 'ControlCronico',
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    description: 'Consulta cirugias, resultados y seguimiento',
    icon: 'bandage-outline',
    accent: appColors.info,
    navigateTo: 'OperacionForm',
  },
  {
    key: 'lesiones',
    label: 'Lesiones',
    description: 'Registra lesiones y recuperacion',
    icon: 'body-outline',
    accent: appColors.success,
    navigateTo: 'LesionForm',
  },
  {
    key: 'alergias',
    label: 'Alergias',
    description: 'Consulta reacciones y antecedentes',
    icon: 'warning-outline',
    accent: appColors.accent,
    navigateTo: 'Alergia',
  },
  {
    key: 'registrodental',
    label: 'Registro Dental',
    description: 'Procedimientos y piezas tratadas',
    icon: 'color-wand-outline',
    accent: appColors.accent,
    navigateTo: 'RegistroDentalForm',
  },
  {
    key: 'embarazo',
    label: 'Embarazo',
    description: 'Seguimiento de inicio, controles y fecha probable de parto',
    icon: 'flower-outline',
    accent: appColors.accent,
    navigateTo: 'Embarazo',
  },
  {
    key: 'desparasitacion',
    label: 'Desparasitacion',
    description: 'Registro de producto, dosis y proxima aplicacion',
    icon: 'leaf-outline',
    accent: appColors.info,
    navigateTo: 'Desparasitacion',
  },
  {
    key: 'examenes',
    label: 'Examenes Clinicos',
    description: 'Resultados, fotos de hojas y PDF asociado a la consulta',
    icon: 'document-text-outline',
    accent: appColors.info,
    navigateTo: 'ExamenClinico',
  },
  {
    key: 'seguimiento-postevento',
    label: 'Seguimiento De Caso',
    description: 'Evolucion despues de operacion, lesion o emergencia',
    icon: 'clipboard-outline',
    accent: appColors.success,
    navigateTo: 'SeguimientoPostevento',
  },
];

const wellnessOptions: OptionItem[] = [
  {
    key: 'seguimiento-fisico',
    label: 'Seguimiento Fisico',
    description: 'Peso, ejercicio, pasos y progreso diario',
    icon: 'barbell-outline',
    accent: appColors.info,
    navigateTo: 'SeguimientoFisico',
  },
  {
    key: 'salud-mental',
    label: 'Salud Mental',
    description: 'Registro diario, alertas y bienestar',
    icon: 'heart-outline',
    accent: appColors.success,
    navigateTo: 'SaludMental',
  },
  {
    key: 'periodo',
    label: 'Periodo',
    description: 'Control de ciclo, sintomas y prediccion',
    icon: 'moon-outline',
    accent: appColors.accent,
    navigateTo: 'Periodo',
  },
];

const managementOptions: OptionItem[] = [
  {
    key: 'configurar-nano',
    label: 'Configurar Nano',
    description: 'Elige la apariencia del asistente desde una galería de diseños',
    icon: 'color-palette-outline',
    accent: '#C084FC',
    navigateTo: 'NanoConfiguracion',
  },
  {
    key: 'paciente',
    label: 'Pacientes',
    description: 'Registra o actualiza perfiles',
    icon: 'people-outline',
    accent: '#38F28E',
    navigateTo: 'PacienteForm',
  },
  {
    key: 'documentos',
    label: 'Documentos Clinicos',
    description: 'Adjunta estudios y reportes al expediente',
    icon: 'documents-outline',
    accent: '#29B6FF',
    navigateTo: 'DocumentoForm',
  },
  {
    key: 'compartir-historial',
    label: 'Compartir Historial',
    description: 'Genera un enlace para que un medico vea el expediente autorizado',
    icon: 'share-social-outline',
    accent: '#38F28E',
    navigateTo: 'CompartirHistorial',
  },
  {
    key: 'abrir-historial-compartido',
    label: 'Abrir Historial Compartido',
    description: 'Pega un enlace o codigo recibido para verlo dentro de la app',
    icon: 'open-outline',
    accent: '#29B6FF',
    navigateTo: 'HistorialCompartido',
  },
  {
    key: 'recordatorios',
    label: 'Recordatorios',
    description: 'Consulta el listado completo de avisos programados',
    icon: 'notifications-outline',
    accent: '#FF4D73',
    navigateTo: 'RecordatorioList',
  },
  {
    key: 'educacion',
    label: 'Educacion Saludable',
    description: 'Revisa guias, niveles y contenido educativo',
    icon: 'book-outline',
    accent: '#FF4D73',
    navigateTo: 'Educacion',
  },
  {
    key: 'contacto',
    label: 'Contacto y Soporte',
    description: 'Canales de ayuda y soporte general',
    icon: 'chatbubbles-outline',
    accent: '#38F28E',
    navigateTo: 'Contacto',
  },
  {
    key: 'sobre',
    label: 'Sobre Nosotros',
    description: 'Conoce la mision del proyecto',
    icon: 'information-circle-outline',
    accent: '#9FB3C8',
    navigateTo: 'SobreNosotros',
  },
];

const optionsByTab: Record<MenuTabKey, OptionItem[]> = {
  inicio: homeOptions,
  medico: medicalOptions,
  bienestar: wellnessOptions,
  gestion: managementOptions,
};

const WEB_SCROLL_STYLE_ID = 'menu-principal-scrollbar-style';
const WEB_SCROLLBAR_CSS = `
  * {
    scrollbar-width: thin;
    scrollbar-color: #29B6FF #071120;
  }

  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  *::-webkit-scrollbar-track {
    background: #071120;
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #29B6FF 0%, #1B78D8 100%);
    border: 3px solid #071120;
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #38F28E 0%, #29B6FF 100%);
  }
`;

function WellnessAssistantIcon({ appearance }: { appearance: NanoAppearance }) {
  return (
    <NanoAppearancePreview appearance={appearance} size={58} />
  );
}

export function MenuPrincipalScreen({ navigation }: Props) {
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTabKey>('inicio');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [nanoAppearanceId, setNanoAppearanceId] = useState('base');
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 760;
  const isWebWide = Platform.OS === 'web' && width >= 1040;
  const gridColumns = isWebWide ? 3 : isWideLayout ? 2 : 1;

  const activeMeta = useMemo(
    () => tabMeta.find((item) => item.key === activeTab) ?? tabMeta[0],
    [activeTab],
  );

  const activeOptions = useMemo(() => optionsByTab[activeTab] ?? [], [activeTab]);
  const activeNanoAppearance = useMemo(() => getNanoAppearance(nanoAppearanceId), [nanoAppearanceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNanoAppearanceId()
        .then((appearanceId) => {
          if (active) setNanoAppearanceId(appearanceId);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    if (!document.getElementById(WEB_SCROLL_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = WEB_SCROLL_STYLE_ID;
      style.textContent = WEB_SCROLLBAR_CSS;
      document.head.appendChild(style);
    }

    return () => {
      document.getElementById(WEB_SCROLL_STYLE_ID)?.remove();
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('No se pudo notificar el cierre de sesion al backend', error);
    } finally {
      logout();
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      setLogoutModalVisible(true);
      return;
    }

    Alert.alert('Cerrar sesion', 'Deseas salir de esta cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => void handleLogout() },
    ]);
  };

  const cancelWebLogout = () => {
    setLogoutModalVisible(false);
  };

  const acceptWebLogout = () => {
    setLogoutModalVisible(false);
    void handleLogout();
  };

  const handleOptionPress = (item: OptionItem) => {
    if (item.actionTab) {
      setActiveTab(item.actionTab);
      return;
    }
    if (!item.navigateTo) {
      return;
    }
    navigation.navigate(item.navigateTo as never);
  };

  const heroContent = (
    <View style={[styles.heroCard, isWebWide && styles.webHeroCard]}>
      <View style={[styles.heroTopRow, isWebWide && styles.webHeroTopRow]}>
        <View style={[styles.heroBadge, isWebWide && styles.webHeroBadge]}>
          <Ionicons name={activeMeta.icon} size={16} color="#29B6FF" />
          <Text style={styles.heroBadgeText}>{activeMeta.label}</Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, isWebWide && styles.webLogoutButton]}
          onPress={confirmLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#F4F8FF" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.pageTitle, isWebWide && styles.webPageTitle]}>{activeMeta.title}</Text>
      <Text style={[styles.userLabel, isWebWide && styles.webUserLabel]}>
        Sesion activa: {user?.username ?? 'usuario'}{user?.role ? ` - ${user.role}` : ''}
      </Text>
      <Text style={[styles.pageSubtitle, isWebWide && styles.webPageSubtitle]}>{activeMeta.subtitle}</Text>
    </View>
  );

  const listHeader = (
    <>
      {isWebWide ? heroContent : null}
      {isWebWide ? (
        <View style={styles.webSectionHeader}>
          <Text style={styles.webSectionTitle}>Accesos del modulo</Text>
          <Text style={styles.webSectionMeta}>{activeOptions.length} opciones disponibles</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, isWebWide && styles.webContainer]}>
        <View style={[styles.contentShell, isWideLayout && styles.contentShellWide, isWebWide && styles.webContentShell]}>
        {isWebWide ? (
          <View style={[styles.navbar, styles.webNavbar]}>
            {tabMeta.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.navItem, styles.webNavItem, isActive && styles.webNavItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                >
                  <View style={[styles.iconCircle, styles.webIconCircle, isActive && styles.iconCircleActive]}>
                    <Ionicons
                      name={tab.icon}
                      size={22}
                      color={isActive ? appColors.info : appColors.background}
                    />
                  </View>
                  <Text style={[styles.navLabel, styles.webNavLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        {!isWebWide ? heroContent : null}

        <FlatList
          data={activeOptions}
          key={`${activeTab}-${gridColumns}-list`}
          keyExtractor={(item) => item.key}
          style={styles.list}
          numColumns={gridColumns}
          columnWrapperStyle={gridColumns > 1 ? styles.cardRow : undefined}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                gridColumns > 1 && styles.gridCard,
                isWebWide && styles.webCard,
                { borderColor: item.accent },
              ]}
              onPress={() => handleOptionPress(item)}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${item.accent}22` }]}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={appColors.textSoft} />
            </TouchableOpacity>
          )}
          contentContainerStyle={[
            styles.listContent,
            isWideLayout && styles.listContentWide,
            isWebWide && styles.webListContent,
          ]}
        />

        {activeTab === 'bienestar' ? (
          <TouchableOpacity
            style={styles.assistantFab}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NanoConsejero')}
          >
            <WellnessAssistantIcon appearance={activeNanoAppearance} />
          </TouchableOpacity>
        ) : null}

        {!isWebWide ? (
        <View style={styles.navbar}>
          {tabMeta.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navItem, isWebWide && styles.webNavItem, isActive && isWebWide && styles.webNavItemActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <View style={[styles.iconCircle, isWebWide && styles.webIconCircle, isActive && styles.iconCircleActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={isActive ? appColors.info : appColors.background}
                  />
                </View>
                <Text style={[styles.navLabel, isWebWide && styles.webNavLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        ) : null}
        </View>
      </View>
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={cancelWebLogout}
      >
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={30} color={appColors.accent} />
            </View>
            <Text style={styles.logoutTitle}>Cerrar sesion</Text>
            <Text style={styles.logoutMessage}>
              Vas a salir de la cuenta {user?.username ?? 'actual'}. Podras volver a entrar cuando
              quieras con tus credenciales.
            </Text>
            <View style={styles.logoutActions}>
              <TouchableOpacity style={styles.logoutSecondaryButton} onPress={cancelWebLogout}>
                <Text style={styles.logoutSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutPrimaryButton} onPress={acceptWebLogout}>
                <Text style={styles.logoutPrimaryText}>Salir</Text>
                <Ionicons name="arrow-forward" size={18} color={appColors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: appColors.background,
    alignItems: 'center',
  },
  webContainer: {
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 24,
  },
  contentShell: {
    flex: 1,
    width: '100%',
  },
  contentShellWide: {
    maxWidth: 1120,
  },
  webContentShell: {
    maxWidth: 1360,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  webHeroCard: {
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#10203A',
    borderColor: '#2E5F8A',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webHeroTopRow: {
    marginBottom: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: appColors.backgroundMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  webHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 0,
  },
  heroBadgeText: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
  },
  webLogoutButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  logoutOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colorAlpha(appColors.overlay, 'B8'),
  },
  logoutCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
    shadowColor: appColors.overlay,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  logoutIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.accent, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '55'),
    marginBottom: 18,
  },
  logoutTitle: {
    color: appColors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  logoutMessage: {
    color: appColors.textSoft,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  logoutSecondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  logoutSecondaryText: {
    color: appColors.textSoft,
    fontSize: 15,
    fontWeight: '800',
  },
  logoutPrimaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appColors.accent,
  },
  logoutPrimaryText: {
    color: appColors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  pageTitle: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  webPageTitle: {
    fontSize: 28,
  },
  userLabel: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  webUserLabel: {
    marginTop: 4,
  },
  pageSubtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  webPageSubtitle: {
    maxWidth: 680,
    fontSize: 14,
    lineHeight: 20,
  },
  webSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  webSectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  webSectionMeta: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 120,
  },
  listContentWide: {
    paddingBottom: 28,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  webListContent: {
    paddingBottom: 48,
    paddingRight: 10,
  },
  cardRow: {
    gap: 14,
  },
  card: {
    backgroundColor: appColors.surface,
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webCard: {
    minHeight: 118,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#102039',
  },
  gridCard: {
    flex: 1,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  assistantFab: {
    position: 'absolute',
    right: 24,
    bottom: 116,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    shadowColor: appColors.overlay,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  webNavbar: {
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 0,
    marginBottom: 18,
    gap: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  webNavItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  webNavItemActive: {
    backgroundColor: colorAlpha(appColors.info, '18'),
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appColors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: appColors.overlay,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  webIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  iconCircleActive: {
    backgroundColor: colorAlpha(appColors.info, '30'),
  },
  navLabel: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  webNavLabel: {
    fontSize: 13,
  },
  navLabelActive: {
    color: appColors.info,
  },
});
