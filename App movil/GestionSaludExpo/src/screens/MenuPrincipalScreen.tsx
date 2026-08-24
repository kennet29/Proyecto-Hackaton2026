/**
 * @file App movil/GestionSaludExpo/src/screens/MenuPrincipalScreen.tsx
 * @description Implementa los elementos TypeScript de este módulo.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';
import { useBackgroundMode } from '../context/BackgroundModeContext';
import { DashboardBienestar } from '../components/DashboardBienestar';
import NanoMenu from '../svg/Nano Menu.svg';
import NanoMedico from '../svg/Nano verde 75px.svg';
import NanoBienestar from '../svg/Nano Bienestar.svg';
import NanoGestion from '../svg/Nano Gestion.svg';
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
  action?: 'toggle-background';
  nano?: boolean;
  nanoAppearance?: NanoAppearance;
};

type TabMeta = {
  key: MenuTabKey;
  label: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  cardColor: string;
  nanoAppearance?: NanoAppearance;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const tabMeta: TabMeta[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    title: 'Dashboard de salud',
    subtitle: 'Consulta en una sola vista tu estado fisico, salud mental, actividad, alimentacion y peso.',
    icon: 'grid-outline',
    cardColor: '#0B6FE9',
    nanoAppearance: {
      id: 'menu',
      label: 'Nano Menu',
      description: 'Nano del menú principal',
      format: 'svg',
      svgComponent: NanoMenu,
    },
  },
  {
    key: 'medico',
    label: 'Medico',
    title: 'Seccion Medica',
    subtitle: 'Concentra consultas, citas, tratamientos y registros clinicos en un solo flujo.',
    icon: 'medkit-outline',
    cardColor: '#0B6FE9',
    nanoAppearance: {
      id: 'medico-menu',
      label: 'Nano Medico',
      description: 'Nano de la sección médica',
      format: 'svg',
      svgComponent: NanoMedico,
    },
  },
  {
    key: 'bienestar',
    label: 'Bienestar',
    title: 'Bienestar Diario',
    subtitle: 'Sigue habitos, ejercicio, peso y bienestar emocional desde una misma vista.',
    icon: 'barbell-outline',
    cardColor: '#4DAF51',
    nanoAppearance: {
      id: 'bienestar',
      label: 'Nano Bienestar',
      description: 'Nano de bienestar',
      format: 'svg',
      svgComponent: NanoBienestar,
    },
  },
  {
    key: 'gestion',
    label: 'Gestion',
    title: 'Gestion y Soporte',
    subtitle: 'Administra expediente, perfiles, educacion y acceso a soporte general.',
    icon: 'folder-open-outline',
    cardColor: '#EA5074',
    nanoAppearance: {
      id: 'gestion',
      label: 'Nano Gestion',
      description: 'Nano de gestión',
      format: 'svg',
      svgComponent: NanoGestion,
    },
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
    key: 'nano-bienestar',
    label: 'Nano Bienestar',
    description: 'Tu asistente para analizar comidas y recibir recomendaciones saludables.',
    icon: 'sparkles-outline',
    accent: '#38E28E',
    navigateTo: 'NanoConsejero',
    nano: true,
    nanoAppearance: {
      id: 'bienestar-menu',
      label: 'Nano Bienestar',
      description: 'Nano de bienestar',
      format: 'svg',
      svgComponent: NanoBienestar,
    },
  },
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
    key: 'admin-solicitudes',
    label: 'Revisar solicitudes médicas',
    description: 'Revisa y decide las solicitudes de acceso profesional.',
    icon: 'shield-checkmark-outline',
    accent: '#F5B942',
    navigateTo: 'AdminSolicitudes',
  },
  {
    key: 'admin-clinicas',
    label: 'Administrar clínicas',
    description: 'Crea, edita y controla las clínicas de la plataforma',
    icon: 'business-outline',
    accent: '#29B6FF',
    navigateTo: 'AdminClinicas',
  },
  {
    key: 'registro-medico',
    label: 'Enviar solicitud médica',
    description: 'Envía tus credenciales profesionales para solicitar acceso médico',
    icon: 'medkit-outline',
    accent: appColors.info,
    navigateTo: 'MedicoRegistro',
  },
  {
    key: 'nano-gestion',
    label: 'Nano Gestion',
    description: 'Elige la apariencia del asistente desde una galería de diseños',
    icon: 'color-palette-outline',
    accent: '#C084FC',
    navigateTo: 'NanoConfiguracion',
    nano: true,
    nanoAppearance: {
      id: 'gestion-menu',
      label: 'Nano Gestion',
      description: 'Nano de gestión',
      format: 'svg',
      svgComponent: NanoGestion,
    },
  },
  {
    key: 'premium',
    label: 'Gestión Salud Premium',
    description: 'Conoce los planes Premium y sus beneficios para tu cuidado.',
    icon: 'diamond-outline',
    accent: '#F5B942',
    navigateTo: 'Premium',
  },
  {
    key: 'paciente',
    label: 'Pacientes',
    description: 'Registra o actualiza perfiles',
    icon: 'people-outline',
    accent: '#38E28E',
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
    description: 'Genera un código único de 6 números válido por una hora',
    icon: 'share-social-outline',
    accent: '#38E28E',
    navigateTo: 'CompartirHistorial',
  },
  {
    key: 'abrir-historial-compartido',
    label: 'Acceso Médico por Código',
    description: 'Ingresa el código del paciente para consultar y editar su historial',
    icon: 'keypad-outline',
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
    accent: '#38E28E',
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
    background: linear-gradient(180deg, #38E28E 0%, #29B6FF 100%);
  }
`;

export function MenuPrincipalScreen({ navigation }: Props) {
  const { token, logout, user } = useAuth();
  const { mode, toggleBackground } = useBackgroundMode();
  const [activeTab, setActiveTab] = useState<MenuTabKey>('inicio');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [nanoAppearanceId, setNanoAppearanceId] = useState('base');
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 760;
  const isWebWide = Platform.OS === 'web' && width >= 1040;
  const gridColumns = isWebWide ? 3 : isWideLayout ? 2 : 1;
  const isLightMode = mode === 'light';
  const theme = isLightMode
    ? {
        background: '#F4F8FC',
        surface: '#FFFFFF',
        surfaceStrong: '#EAF2FA',
        webSurface: '#FFFFFF',
        text: '#10203A',
        textSoft: '#45627E',
        textMuted: '#6D8195',
        border: '#C8D8E8',
        borderStrong: '#A9C6DF',
        icon: '#10203A',
      }
    : {
        background: appColors.background,
        surface: appColors.surface,
        surfaceStrong: appColors.surfaceStrong,
        webSurface: '#102039',
        text: appColors.text,
        textSoft: appColors.textSoft,
        textMuted: appColors.textMuted,
        border: appColors.border,
        borderStrong: appColors.borderStrong,
        icon: appColors.background,
      };

  const activeMeta = useMemo(
    () => tabMeta.find((item) => item.key === activeTab) ?? tabMeta[0],
    [activeTab],
  );

  const activeOptions = useMemo<OptionItem[]>(() => {
    const options = optionsByTab[activeTab] ?? [];
    const role = user?.role?.trim().toLowerCase();
    const isAdmin = role === 'admin' || role === 'superadmin';
    const permittedOptions = options.filter((item) => {
      if (item.key.startsWith('admin-')) return isAdmin;
      if (item.key === 'registro-medico') return !isAdmin;
      if (item.key === 'abrir-historial-compartido') return role === 'medico';
      return true;
    });

    if (activeTab !== 'gestion') return permittedOptions;

    return [
      {
        key: 'modo-claro',
        label: isLightMode ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro',
        description: isLightMode
          ? 'Reduce el brillo con azul nocturno y contraste suave.'
          : 'Usa fondos blancos, azul intenso y mayor luminosidad.',
        icon: isLightMode ? 'moon-outline' : 'sunny-outline',
        accent: '#0B6FEA',
        action: 'toggle-background' as const,
      },
      ...(isAdmin
        ? [{
            key: 'administrar-pagos',
            label: 'Pagos Premium',
            description: 'Configura cuentas bancarias y tipos de cambio.',
            icon: 'card-outline' as const,
            accent: '#F5B942',
            navigateTo: 'AdminPagos' as const,
          }, {
            key: 'administrar-clinicas',
            label: 'Clínicas y Servicios',
            description: 'Administra instituciones de salud, su catálogo y los servicios disponibles.',
            icon: 'business-outline' as const,
            accent: appColors.success,
            navigateTo: 'AdminInstituciones' as const,
          }]
        : []),
      ...permittedOptions,
    ];
  }, [activeTab, isLightMode, user?.role]);
  const activeNanoAppearance = useMemo(() => getNanoAppearance(nanoAppearanceId), [nanoAppearanceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNanoAppearanceId(user?.id, token)
        .then((appearanceId) => {
          if (active) setNanoAppearanceId(appearanceId);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [token, user?.id]),
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
    if (item.action === 'toggle-background') {
      toggleBackground();
      return;
    }
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
          <Ionicons name={activeMeta.icon} size={16} color="#0B6FEA" />
          <AppText style={styles.heroBadgeText}>{activeMeta.label}</AppText>
        </View>
        <View style={styles.heroActions}>
          {activeMeta.nanoAppearance ? (
            <NanoAppearancePreview appearance={activeMeta.nanoAppearance} size={58} />
          ) : null}
          <TouchableOpacity
            style={[styles.logoutButton, isWebWide && styles.webLogoutButton]}
            onPress={confirmLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <AppText style={[styles.pageTitle, styles.heroTitle, isWebWide && styles.webPageTitle]}>{activeMeta.title}</AppText>
      <AppText style={[styles.userLabel, styles.heroUserLabel, isWebWide && styles.webUserLabel]}>
        Sesion activa: {user?.username ?? 'usuario'}{user?.role ? ` - ${user.role}` : ''}
      </AppText>
      <AppText style={[styles.pageSubtitle, styles.heroSubtitle, isWebWide && styles.webPageSubtitle]}>{activeMeta.subtitle}</AppText>
    </View>
  );

  const listHeader = (
    <>
      {isWebWide ? heroContent : null}
      {isWebWide ? (
        <View style={styles.webSectionHeader}>
          <AppText style={[styles.webSectionTitle, { color: theme.text }]}>Accesos del modulo</AppText>
          <AppText style={[styles.webSectionMeta, { color: theme.textMuted }]}>{activeOptions.length} opciones disponibles</AppText>
        </View>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }, isWebWide && styles.webContainer]}>
        <View style={[styles.contentShell, isWideLayout && styles.contentShellWide, isWebWide && styles.webContentShell]}>
        {isWebWide ? (
          <View style={[styles.navbar, { backgroundColor: theme.surfaceStrong }, styles.webNavbar]}>
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
                    {tab.nanoAppearance ? (
                      <NanoAppearancePreview appearance={tab.nanoAppearance} size={38} />
                    ) : (
                      <Ionicons name={tab.icon} size={27} color={isActive ? appColors.info : theme.icon} />
                    )}
                  </View>
                  <AppText style={[styles.navLabel, { color: theme.textMuted }, styles.webNavLabel, isActive && styles.navLabelActive]}>{tab.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        {!isWebWide ? heroContent : null}

        {activeTab === 'inicio' ? (
          <DashboardBienestar navigation={navigation} />
        ) : (
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
                { borderColor: activeMeta.cardColor, backgroundColor: isWebWide ? theme.webSurface : theme.surface },
                isLightMode && item.action !== 'toggle-background' && styles.lightModeCard,
                isLightMode && item.action !== 'toggle-background' && { borderLeftColor: activeMeta.cardColor },
                item.action === 'toggle-background' && styles.themeCard,
                item.action === 'toggle-background' && {
                  backgroundColor: isLightMode ? '#EAF3FF' : '#0D2B55',
                },
                { borderColor: activeMeta.cardColor },
              ]}
              onPress={() => handleOptionPress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={item.action === 'toggle-background' ? 'Alterna entre modo claro y modo oscuro' : `Abre ${item.label}`}
            >
              <View style={[styles.cardIcon, { backgroundColor: `${activeMeta.cardColor}22` }, item.action === 'toggle-background' && styles.themeIcon]}>
                {item.nano ? (
                  <NanoAppearancePreview appearance={item.nanoAppearance ?? activeNanoAppearance} size={54} />
                ) : (
                  <Ionicons name={item.icon} size={26} color={activeMeta.cardColor} />
                )}
              </View>
              <View style={styles.cardInfo}>
                <AppText style={[styles.cardLabel, { color: theme.text }]}>{item.label}</AppText>
                <AppText style={[styles.cardDescription, { color: theme.textSoft }]}>{item.description}</AppText>
              </View>
              {item.action === 'toggle-background' ? (
                <View style={[styles.themeToggle, { backgroundColor: isLightMode ? '#0B6FEA' : '#5D87BE' }]}>
                  <View style={[styles.themeToggleThumb, isLightMode ? styles.themeToggleThumbLight : styles.themeToggleThumbDark]}>
                    <Ionicons name={isLightMode ? 'sunny' : 'moon'} size={14} color="#0B6FEA" />
                  </View>
                </View>
              ) : <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={[
            styles.listContent,
            isWideLayout && styles.listContentWide,
            isWebWide && styles.webListContent,
          ]}
        />
        )}

        {!isWebWide ? (
        <View style={[styles.navbar, { backgroundColor: theme.surfaceStrong }]}>
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
                  {tab.nanoAppearance ? (
                    <NanoAppearancePreview appearance={tab.nanoAppearance} size={46} />
                  ) : (
                    <Ionicons name={tab.icon} size={29} color={isActive ? appColors.info : theme.icon} />
                  )}
                </View>
                <AppText style={[styles.navLabel, { color: theme.textMuted }, isWebWide && styles.webNavLabel, isActive && styles.navLabelActive]}>{tab.label}</AppText>
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
            <AppText style={styles.logoutTitle}>Cerrar sesion</AppText>
            <AppText style={styles.logoutMessage}>
              Vas a salir de la cuenta {user?.username ?? 'actual'}. Podras volver a entrar cuando
              quieras con tus credenciales.
            </AppText>
            <View style={styles.logoutActions}>
              <TouchableOpacity style={styles.logoutSecondaryButton} onPress={cancelWebLogout}>
                <AppText style={styles.logoutSecondaryText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutPrimaryButton} onPress={acceptWebLogout}>
                <AppText style={styles.logoutPrimaryText}>Salir</AppText>
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
    backgroundColor: '#0B6FEA',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2C8CFA',
    shadowColor: '#0B6FEA',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  webHeroCard: {
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#0B6FEA',
    borderColor: '#2C8CFA',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webHeroTopRow: {
    marginBottom: 4,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
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
    color: '#0B6FEA',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF66',
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
  heroTitle: {
    color: '#FFFFFF',
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
  heroUserLabel: {
    color: '#DCEEFF',
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
  heroSubtitle: {
    color: '#EAF3FF',
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
  lightModeCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1EAF4',
    borderLeftColor: '#0B6FEA',
    borderLeftWidth: 8,
    shadowColor: '#163B68',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  themeCard: {
    borderWidth: 2,
    shadowColor: '#0B6FEA',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B8D7FF',
  },
  themeToggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  themeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleThumbLight: {
    alignSelf: 'flex-end',
  },
  themeToggleThumbDark: {
    alignSelf: 'flex-start',
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
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A9D2FB',
    shadowColor: '#0B6FEA',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  webNavItemActive: {
    backgroundColor: '#DCEEFF',
    borderColor: '#75B8F8',
    shadowColor: '#0B6FEA',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appColors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: appColors.overlay,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  webIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
