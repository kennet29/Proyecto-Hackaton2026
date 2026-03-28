import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpedienteGestion'>;

type Item = {
  label: string;
  description: string;
  navigateTo?: keyof RootStackParamList;
};

type Section = {
  title: string;
  helper: string;
  items: Item[];
};

const sections: Section[] = [
  {
    title: 'datos del paciente',
    helper: 'información básica de identidad y contacto',
    items: [
      {
        label: 'perfil del paciente',
        description: 'nombres, documentos, dirección y contactos',
        navigateTo: 'PacienteForm',
      },
      {
        label: 'documentos clínicos',
        description: 'sube estudios, recetas, PDFs o imágenes',
        navigateTo: 'DocumentoForm',
      },
    ],
  },
  {
    title: 'historial clínico',
    helper: 'consultas, citas y tratamientos activos',
    items: [
      {
        label: 'consultas médicas',
        description: 'motivos, diagnósticos y tratamientos',
        navigateTo: 'ConsultaForm',
      },
      {
        label: 'citas programadas',
        description: 'agenda, estados y recordatorios',
        navigateTo: 'CitaForm',
      },
      {
        label: 'registro dental',
        description: 'procedimientos y atenciones odontológicas',
        navigateTo: 'RegistroDentalForm',
      },
      {
        label: 'vacunas aplicadas',
        description: 'dosis, lotes y próximas aplicaciones',
        navigateTo: 'VacunaForm',
      },
    ],
  },
  {
    title: 'tratamientos y recordatorios',
    helper: 'medicación, adherencia y notificaciones',
    items: [
      {
        label: 'medicación y dosis',
        description: 'horarios, duración y seguimiento',
        navigateTo: 'MedicacionForm',
      },
      {
        label: 'recordatorios personalizados',
        description: 'alertas para citas, vacunas o hábitos',
        navigateTo: 'RecordatorioForm',
      },
      {
        label: 'agenda de recordatorios',
        description: 'lista completa de próximos avisos',
        navigateTo: 'RecordatorioList',
      },
    ],
  },
  {
    title: 'hábitos y bienestar',
    helper: 'estilo de vida y antecedentes',
    items: [
      {
        label: 'hábitos diarios',
        description: 'actividad física, sueño y alimentación',
      },
      {
        label: 'antecedentes familiares',
        description: 'herencia genética y condiciones relevantes',
      },
      {
        label: 'condiciones crónicas',
        description: 'seguimiento y metas terapéuticas',
      },
    ],
  },
];

export function ExpedienteGestionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const displayName = user?.username?.split('@')[0] ?? 'paciente';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerLabel}>expediente médico</Text>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <Text style={styles.headerSubtitle}>selecciona una sección para administrar</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('PacienteResumen')}
        >
          <Text style={styles.primaryBtnText}>ver resumen</Text>
        </TouchableOpacity>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionHelper}>{section.helper}</Text>
          </View>
          <FlatList
            data={section.items}
            scrollEnabled={false}
            keyExtractor={(item) => `${section.title}-${item.label}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const actionable = Boolean(item.navigateTo);
              return (
                <TouchableOpacity
                  style={[styles.itemRow, !actionable && styles.itemDisabled]}
                  disabled={!actionable}
                  onPress={() => item.navigateTo && navigation.navigate(item.navigateTo)}
                >
                  <View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  </View>
                  {actionable ? (
                    <Text style={styles.itemAction}>gestionar</Text>
                  ) : (
                    <Text style={styles.itemActionDisabled}>próximamente</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
  },
  headerLabel: {
    color: '#bfdbfe',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 6,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    color: '#dbeafe',
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  primaryBtnText: {
    color: '#1d4ed8',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionHelper: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDisabled: {
    opacity: 0.7,
  },
  itemLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemDescription: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  itemAction: {
    color: '#60a5fa',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  itemActionDisabled: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
});
