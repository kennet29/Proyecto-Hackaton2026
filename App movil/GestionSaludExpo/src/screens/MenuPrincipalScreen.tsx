import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBackendVersion } from '../hooks/useBackendVersion';

const resolveAppVersion = () => {
  const expoConfigVersion = Constants.expoConfig?.version;
  const legacyManifestVersion = (Constants as any)?.manifest?.version;
  const manifest2Version = (Constants as any)?.manifest2?.extra?.expoClient?.version;
  return expoConfigVersion ?? manifest2Version ?? legacyManifestVersion ?? '0.0.0';
};

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
    description: 'Registra atenciones y tratamientos',
    icon: 'medkit-outline',
    accent: '#a78bfa',
    navigateTo: 'ConsultaForm',
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
  const { backendVersion, isLoading, error, refresh } = useBackendVersion();
  const appVersion = resolveAppVersion();

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
      <View style={styles.versionPanel}>
        <View style={styles.versionColumn}>
          <Text style={styles.versionLabel}>App</Text>
          <Text style={styles.versionValue}>v{appVersion}</Text>
        </View>
        <View style={styles.versionColumn}>
          <Text style={styles.versionLabel}>Backend</Text>
          <Text style={styles.versionValue}>
            {backendVersion ? `v${backendVersion.version}` : isLoading ? 'Cargando...' : 'No disponible'}
          </Text>
          {!!backendVersion && (
            <Text style={styles.versionMeta}>
              API {backendVersion.apiVersion} - SemVer{' '}
              {backendVersion.semver.major}.{backendVersion.semver.minor}.{backendVersion.semver.patch}
              {backendVersion.semver.prerelease ? `-${backendVersion.semver.prerelease}` : ''}
            </Text>
          )}
          {error && <Text style={styles.versionError}>{error}</Text>}
        </View>
        <TouchableOpacity style={styles.versionRefresh} onPress={refresh}>
          <Ionicons name="refresh" size={18} color="#0f172a" />
        </TouchableOpacity>
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
  versionPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  versionColumn: {
    flex: 1,
  },
  versionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  versionValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  versionMeta: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  versionError: {
    color: '#fecdd3',
    fontSize: 12,
  },
  versionRefresh: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fafdff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

