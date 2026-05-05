import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';

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
    label: 'Gestionar Expediente',
    description: 'Organiza personas vinculadas, accesos y el control central del expediente.',
    icon: 'file-tray-full-outline',
    accent: '#38bdf8',
    navigateTo: 'ExpedienteGestion',
  },
  {
    key: 'home-medico',
    label: 'Seccion Medica',
    description: 'Reune consultas, citas, vacunas, medicacion y seguimiento clinico.',
    icon: 'medkit-outline',
    accent: '#a78bfa',
    actionTab: 'medico',
  },
  {
    key: 'home-bienestar',
    label: 'Habitos, Ejercicio y Peso',
    description: 'Agrupa habitos, peso, ejercicio, salud mental y control diario.',
    icon: 'fitness-outline',
    accent: '#2dd4bf',
    actionTab: 'bienestar',
  },
  {
    key: 'home-gestion',
    label: 'Gestion y Soporte',
    description: 'Incluye pacientes, documentos, educacion, recordatorios y soporte.',
    icon: 'layers-outline',
    accent: '#facc15',
    actionTab: 'gestion',
  },
];

const medicalOptions: OptionItem[] = [
  {
    key: 'resumen',
    label: 'Resumen Del Paciente',
    description: 'Visualiza indicadores, alertas y progreso',
    icon: 'person-circle-outline',
    accent: '#f472b6',
    navigateTo: 'PacienteResumen',
  },
  {
    key: 'consulta',
    label: 'Consultas Medicas',
    description: 'Revisa y registra consultas medicas',
    icon: 'medkit-outline',
    accent: '#a78bfa',
    navigateTo: 'ConsultaList',
  },
  {
    key: 'citas',
    label: 'Citas Programadas',
    description: 'Agenda y seguimiento de citas',
    icon: 'calendar-outline',
    accent: '#fb7185',
    navigateTo: 'CitaForm',
  },
  {
    key: 'vacunas',
    label: 'Vacunas',
    description: 'Registro de dosis, lotes y proximas fechas',
    icon: 'shield-checkmark-outline',
    accent: '#60a5fa',
    navigateTo: 'VacunaForm',
  },
  {
    key: 'medicacion',
    label: 'Medicacion',
    description: 'Dosis, duracion, vias y seguimiento',
    icon: 'flask-outline',
    accent: '#f97316',
    navigateTo: 'MedicacionForm',
  },
  {
    key: 'condiciones-cronicas',
    label: 'Enfermedades Cronicas',
    description: 'Condiciones, metas y monitoreo prolongado',
    icon: 'pulse-outline',
    accent: '#22c55e',
    navigateTo: 'CondicionCronicaForm',
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    description: 'Consulta cirugias, resultados y seguimiento',
    icon: 'bandage-outline',
    accent: '#a855f7',
    navigateTo: 'OperacionForm',
  },
  {
    key: 'lesiones',
    label: 'Lesiones',
    description: 'Registra lesiones y recuperacion',
    icon: 'body-outline',
    accent: '#14b8a6',
    navigateTo: 'LesionForm',
  },
  {
    key: 'alergias',
    label: 'Alergias',
    description: 'Consulta reacciones y antecedentes',
    icon: 'warning-outline',
    accent: '#fbbf24',
    navigateTo: 'Alergia',
  },
  {
    key: 'registrodental',
    label: 'Registro Dental',
    description: 'Procedimientos y piezas tratadas',
    icon: 'color-wand-outline',
    accent: '#fb923c',
    navigateTo: 'RegistroDentalForm',
  },
  {
    key: 'examenes',
    label: 'Examenes Clinicos',
    description: 'Resultados, fotos de hojas y PDF asociado a la consulta',
    icon: 'document-text-outline',
    accent: '#38bdf8',
    navigateTo: 'ExamenClinico',
  },
];

const wellnessOptions: OptionItem[] = [
  {
    key: 'habitos',
    label: 'Habitos',
    description: 'Actividad fisica, sueno, alimentacion y riesgos',
    icon: 'walk-outline',
    accent: '#2dd4bf',
    navigateTo: 'Habitos',
  },
  {
    key: 'seguimiento-fisico',
    label: 'Seguimiento Fisico',
    description: 'Peso, ejercicio, pasos y progreso diario',
    icon: 'barbell-outline',
    accent: '#38bdf8',
    navigateTo: 'SeguimientoFisico',
  },
  {
    key: 'salud-mental',
    label: 'Salud Mental',
    description: 'Registro diario, alertas y bienestar',
    icon: 'heart-outline',
    accent: '#22c55e',
    navigateTo: 'SaludMental',
  },
  {
    key: 'periodo',
    label: 'Periodo',
    description: 'Control de ciclo, sintomas y prediccion',
    icon: 'moon-outline',
    accent: '#ec4899',
    navigateTo: 'Periodo',
  },
];

const managementOptions: OptionItem[] = [
  {
    key: 'paciente',
    label: 'Pacientes',
    description: 'Registra o actualiza perfiles',
    icon: 'people-outline',
    accent: '#34d399',
    navigateTo: 'PacienteForm',
  },
  {
    key: 'documentos',
    label: 'Documentos Clinicos',
    description: 'Adjunta estudios y reportes al expediente',
    icon: 'documents-outline',
    accent: '#c084fc',
    navigateTo: 'DocumentoForm',
  },
  {
    key: 'recordatorios',
    label: 'Recordatorios',
    description: 'Configura alertas y canales',
    icon: 'notifications-outline',
    accent: '#f472b6',
    navigateTo: 'RecordatorioForm',
  },
  {
    key: 'recordatorios-list',
    label: 'Ver Recordatorios',
    description: 'Consulta el cronograma completo',
    icon: 'timer-outline',
    accent: '#38bdf8',
    navigateTo: 'RecordatorioList',
  },
  {
    key: 'educacion',
    label: 'Educacion Saludable',
    description: 'Revisa guias, niveles y contenido educativo',
    icon: 'book-outline',
    accent: '#facc15',
    navigateTo: 'Educacion',
  },
  {
    key: 'contacto',
    label: 'Contacto y Soporte',
    description: 'Canales de ayuda y soporte general',
    icon: 'chatbubbles-outline',
    accent: '#34d399',
    navigateTo: 'Contacto',
  },
  {
    key: 'sobre',
    label: 'Sobre Nosotros',
    description: 'Conoce la mision del proyecto',
    icon: 'information-circle-outline',
    accent: '#94a3b8',
    navigateTo: 'SobreNosotros',
  },
];

const optionsByTab: Record<MenuTabKey, OptionItem[]> = {
  inicio: homeOptions,
  medico: medicalOptions,
  bienestar: wellnessOptions,
  gestion: managementOptions,
};

export function MenuPrincipalScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<MenuTabKey>('inicio');

  const activeMeta = useMemo(
    () => tabMeta.find((item) => item.key === activeTab) ?? tabMeta[0],
    [activeTab],
  );

  const activeOptions = useMemo(() => optionsByTab[activeTab] ?? [], [activeTab]);

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
          <View style={styles.heroBadge}>
            <Ionicons name={activeMeta.icon} size={16} color="#38bdf8" />
            <Text style={styles.heroBadgeText}>{activeMeta.label}</Text>
          </View>
          <Text style={styles.pageTitle}>{activeMeta.title}</Text>
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
              <Ionicons name="chevron-forward" size={18} color="#cbd5f5" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />

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
                    color={isActive ? '#1d4ed8' : '#0f172a'}
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
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
  },
  heroCard: {
    backgroundColor: '#111c34',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0b1220',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#cbd5f5',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  listContent: {
    paddingBottom: 12,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1e293b',
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
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  iconCircleActive: {
    backgroundColor: '#bfdbfe',
  },
  navLabel: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  navLabelActive: {
    color: '#1d4ed8',
  },
});
