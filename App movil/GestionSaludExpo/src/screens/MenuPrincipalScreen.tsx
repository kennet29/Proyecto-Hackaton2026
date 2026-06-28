import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { appColors, colorAlpha } from '../theme/colors';

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
    key: 'habitos',
    label: 'Habitos',
    description: 'Actividad fisica, sueno, alimentacion y riesgos',
    icon: 'walk-outline',
    accent: appColors.success,
    navigateTo: 'Habitos',
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
    key: 'recordatorios',
    label: 'Recordatorios',
    description: 'Configura alertas y canales',
    icon: 'notifications-outline',
    accent: '#FF4D73',
    navigateTo: 'RecordatorioForm',
  },
  {
    key: 'recordatorios-list',
    label: 'Ver Recordatorios',
    description: 'Consulta el cronograma completo',
    icon: 'timer-outline',
    accent: '#29B6FF',
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

function WellnessAssistantIcon() {
  return (
    <View style={styles.assistantIconShell}>
      <View style={styles.assistantIconFlame} />
      <View style={styles.assistantIconHead}>
        <View style={styles.assistantIconFace}>
          <View style={styles.assistantIconEye} />
          <View style={styles.assistantIconMouth} />
          <View style={styles.assistantIconEye} />
        </View>
      </View>
      <View style={styles.assistantIconEarLeft} />
      <View style={styles.assistantIconEarRight} />
      <View style={styles.assistantIconBody} />
      <View style={styles.assistantIconFootLeft} />
      <View style={styles.assistantIconFootRight} />
    </View>
  );
}

export function MenuPrincipalScreen({ navigation }: Props) {
  const { token, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTabKey>('inicio');

  const activeMeta = useMemo(
    () => tabMeta.find((item) => item.key === activeTab) ?? tabMeta[0],
    [activeTab],
  );

  const activeOptions = useMemo(() => optionsByTab[activeTab] ?? [], [activeTab]);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name={activeMeta.icon} size={16} color="#29B6FF" />
              <Text style={styles.heroBadgeText}>{activeMeta.label}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() =>
                Alert.alert('Cerrar sesion', 'Â¿Deseas salir de esta cuenta?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: () => void handleLogout() },
                ])
              }
            >
              <Ionicons name="log-out-outline" size={18} color="#F4F8FF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.pageTitle}>{activeMeta.title}</Text>
          <Text style={styles.userLabel}>
            Sesion activa: {user?.username ?? 'usuario'}{user?.role ? ` Â· ${user.role}` : ''}
          </Text>
          <Text style={styles.pageSubtitle}>{activeMeta.subtitle}</Text>
        </View>

        <FlatList
          data={activeOptions}
          key={`${activeTab}-list`}
          keyExtractor={(item) => item.key}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderColor: item.accent }]}
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
          contentContainerStyle={styles.listContent}
        />

        {activeTab === 'bienestar' ? (
          <TouchableOpacity
            style={styles.assistantFab}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NanoConsejero')}
          >
            <WellnessAssistantIcon />
          </TouchableOpacity>
        ) : null}

        <View style={styles.navbar}>
          {tabMeta.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.navItem}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={isActive ? appColors.info : appColors.background}
                  />
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  pageTitle: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  userLabel: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  pageSubtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  listContent: {
    paddingBottom: 120,
  },
  list: {
    flex: 1,
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
    backgroundColor: appColors.surfaceStrong,
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
  },
  assistantIconShell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  assistantIconFlame: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 11,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  assistantIconHead: {
    width: 29,
    height: 23,
    marginTop: 4,
    borderRadius: 11,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantIconFace: {
    width: 23,
    height: 18,
    borderRadius: 8,
    backgroundColor: appColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  assistantIconEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: appColors.text,
  },
  assistantIconMouth: {
    width: 4,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: appColors.text,
    marginTop: 4,
  },
  assistantIconEarLeft: {
    position: 'absolute',
    top: 14,
    left: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  assistantIconEarRight: {
    position: 'absolute',
    top: 14,
    right: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  assistantIconBody: {
    width: 14,
    height: 9,
    marginTop: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: appColors.accent,
  },
  assistantIconFootLeft: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  assistantIconFootRight: {
    position: 'absolute',
    bottom: 2,
    right: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '-22deg' }],
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
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
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
  iconCircleActive: {
    backgroundColor: colorAlpha(appColors.info, '30'),
  },
  navLabel: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  navLabelActive: {
    color: appColors.info,
  },
});
