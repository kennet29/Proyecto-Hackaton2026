import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type OptionItem = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  navigateTo?: keyof RootStackParamList;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const options: OptionItem[] = [
  {
    key: 'expediente',
    label: 'Gestionar Expediente',
    description: 'Administra datos clinicos y accesos',
    icon: 'file-tray-full-outline',
    accent: '#38bdf8',
    navigateTo: 'ExpedienteGestion',
  },
  {
    key: 'resumen',
    label: 'Resumen Del Paciente',
    description: 'Visualiza indicadores y progreso',
    icon: 'person-circle-outline',
    accent: '#f472b6',
    navigateTo: 'PacienteResumen',
  },
  {
    key: 'educacion',
    label: 'Educacion Saludable',
    description: 'Revisa guias y niveles educativos',
    icon: 'book-outline',
    accent: '#facc15',
    navigateTo: 'Educacion',
  },
  {
    key: 'paciente',
    label: 'Pacientes',
    description: 'Registra o actualiza perfiles',
    icon: 'people-outline',
    accent: '#34d399',
    navigateTo: 'PacienteForm',
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
    description: 'Registro de dosis y lotes',
    icon: 'shield-checkmark-outline',
    accent: '#60a5fa',
    navigateTo: 'VacunaForm',
  },
  {
    key: 'medicacion',
    label: 'Medicacion',
    description: 'Dosis, duracion y vias',
    icon: 'flask-outline',
    accent: '#f97316',
    navigateTo: 'MedicacionForm',
  },
  {
    key: 'condiciones-cronicas',
    label: 'Enfermedades Cronicas',
    description: 'Revisa condiciones y seguimiento',
    icon: 'pulse-outline',
    accent: '#22c55e',
    navigateTo: 'CondicionCronicaForm',
  },
  {
    key: 'periodo',
    label: 'Periodo',
    description: 'Control de ciclo, sintomas y prediccion',
    icon: 'moon-outline',
    accent: '#ec4899',
    navigateTo: 'Periodo',
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
    key: 'habitos',
    label: 'Habitos',
    description: 'Actividad fisica, sueno y alimentacion',
    icon: 'walk-outline',
    accent: '#2dd4bf',
    navigateTo: 'Habitos',
  },
  {
    key: 'operaciones',
    label: 'Operaciones',
    description: 'Consulta cirugias y resultados',
    icon: 'bandage-outline',
    accent: '#a855f7',
    navigateTo: 'OperacionForm',
  },
  {
    key: 'lesiones',
    label: 'Lesiones',
    description: 'Registra lesiones y su recuperación',
    icon: 'body-outline',
    accent: '#14b8a6',
    navigateTo: 'LesionForm',
  },
  {
    key: 'alergias',
    label: 'Alergias',
    description: 'Consulta reacciones y registralas',
    icon: 'warning-outline',
    accent: '#fbbf24',
    navigateTo: 'Alergia',
  },
  {
    key: 'documentos',
    label: 'Documentos Clinicos',
    description: 'Adjunta estudios y reportes',
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
    description: 'Consulta cronograma completo',
    icon: 'timer-outline',
    accent: '#38bdf8',
    navigateTo: 'RecordatorioList',
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
    key: 'contacto',
    label: 'Contacto Y Soporte',
    description: 'Canales de ayuda 24/7',
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

const bottomTabs = [
  { key: 'home', icon: 'home-outline', label: 'Home' },
  { key: 'files', icon: 'folder-open-outline', label: 'Expedientes' },
  { key: 'plans', icon: 'layers-outline', label: 'Planes' },
  { key: 'settings', icon: 'settings-outline', label: 'Ajustes' },
];

export function MenuPrincipalScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState('home');

  const handleNavigate = (route?: keyof RootStackParamList) => {
    if (!route) return;
    navigation.navigate(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Menu Principal</Text>
        <Text style={styles.pageSubtitle}>Selecciona un modulo para continuar</Text>
      </View>
      <FlatList
        data={options}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { borderColor: item.accent }]}
            onPress={() => handleNavigate(item.navigateTo)}
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
        {bottomTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                <Ionicons
                  name={tab.icon as any}
                  size={22}
                  color={isActive ? '#1d4ed8' : '#0f172a'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
  },
  pageHeader: {
    marginBottom: 12,
  },
  pageTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#cbd5f5',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 12,
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
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    borderRadius: 28,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navItemActive: {},
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
});

