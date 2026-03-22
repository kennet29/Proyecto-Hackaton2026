import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const options: { key: string; label: string; navigateTo?: keyof RootStackParamList }[] = [
  { key: 'paciente', label: 'pacientes', navigateTo: 'PacienteForm' },
  { key: 'consulta', label: 'consultas medicas', navigateTo: 'ConsultaForm' },
  { key: 'citas', label: 'citas programadas', navigateTo: 'CitaForm' },
  { key: 'vacunas', label: 'vacunas', navigateTo: 'VacunaForm' },
  { key: 'medicacion', label: 'medicacion', navigateTo: 'MedicacionForm' },
  { key: 'documentos', label: 'documentos clinicos', navigateTo: 'DocumentoForm' },
  { key: 'recordatorios', label: 'recordatorios', navigateTo: 'RecordatorioForm' },
  { key: 'recordatorios-list', label: 'ver recordatorios', navigateTo: 'RecordatorioList' },
  { key: 'registrodental', label: 'registro dental', navigateTo: 'RegistroDentalForm' },
  { key: 'contacto', label: 'contacto y soporte', navigateTo: 'Contacto' },
  { key: 'sobre', label: 'sobre nosotros', navigateTo: 'SobreNosotros' },
];

const bottomTabs = [
  { key: 'home', label: 'Home' },
  { key: 'files', label: 'Expedientes' },
  { key: 'plans', label: 'Planes' },
  { key: 'settings', label: 'Ajustes' },
];

export function MenuPrincipalScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState('home');
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>menu principal</Text>
          <Text style={styles.subtitle}>elige un modulo para continuar</Text>
        </View>
      </View>
      <FlatList
        data={options}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.navigateTo && navigation.navigate(item.navigateTo)}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.navbar}>
        {bottomTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>modulos disponibles</Text>
            {options.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.modalItem}
                onPress={() => {
                  setMenuVisible(false);
                  item.navigateTo && navigation.navigate(item.navigateTo);
                }}
              >
                <Text style={styles.modalText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5f5',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#93c5fd',
    borderRadius: 30,
    padding: 10,
    marginTop: 16,
    marginBottom: 0,
  },
  navItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  navItemActive: {
    backgroundColor: '#cfe3ff',
  },
  navText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#2563eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#0f172a',
  },
});
