import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'PacienteResumen'>;

const baseHighlightCards = [
  { label: 'Consultas', value: '12', trend: '+2 este mes' },
  { label: 'citas próximas', value: '3', trend: '2 confirmadas' },
  { label: 'Vacunas', value: '8', trend: '1 pendiente' },
  { label: 'notas de hábitos', value: '5', trend: 'actualizado ayer' },
];

const clinicalData = [
  { label: 'IMC', value: '23.1', detail: 'Saludable' },
  { label: 'presión arterial', value: '118 / 76', detail: 'último control 20 mar' },
  { label: 'Alergias Activas', value: '2', detail: 'Polen, penicilina' },
  { label: 'condiciones crónicas', value: '1', detail: 'hipotiroidismo' },
];

const upcomingReminders = [
  { label: 'Control Nutricional', date: '28 mar 2026 - 09:00' },
  { label: 'Dosis Vacuna Influenza', date: '05 abr 2026 - 15:30' },
];

const medicationPlan = [
  { name: 'Metformina', dosage: '850 mg', schedule: 'Desayuno y cena' },
  { name: 'vitamina d', dosage: '1000 ui', schedule: 'cada mañana' },
];

export function PacienteResumenScreen({ navigation }: Props) {
  const { user } = useAuth();
  const pacienteNombre = useMemo(() => {
    if (user?.username) {
      return user.username.split('@')[0];
    }
    return 'Paciente';
  }, [user?.username]);
  const pacientesVinculados = user?.pacienteIds?.length ?? (user?.pacienteId ? 1 : 0);
  const highlights = useMemo(() => {
    const cards = [...baseHighlightCards];
    cards.unshift({
      label: 'Pacientes Vinculados',
      value: `${pacientesVinculados}`,
      trend: pacientesVinculados > 1 ? 'Gestion familiar activa' : 'Perfil individual',
    });
    return cards;
  }, [pacientesVinculados]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.heroLabel}>Resumen Integral</Text>
          <Text style={styles.heroTitle}>{pacienteNombre}</Text>
          <Text style={styles.heroSubtitle}>última sincronización hace 5 min</Text>
        </View>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => navigation.navigate('PacienteForm')}
        >
          <Text style={styles.heroButtonText}>Gestionar Pacientes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.highlightGrid}>
        {highlights.map((card) => (
          <View key={card.label} style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>{card.label}</Text>
            <Text style={styles.highlightValue}>{card.value}</Text>
            <Text style={styles.highlightTrend}>{card.trend}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>datos clínicos</Text>
        {clinicalData.map((item) => (
          <View key={item.label} style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>recordatorios próximos</Text>
        {upcomingReminders.map((item) => (
          <View key={item.label} style={styles.reminderCard}>
            <Text style={styles.reminderLabel}>{item.label}</Text>
            <Text style={styles.reminderDate}>{item.date}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('RecordatorioList')}
        >
          <Text style={styles.linkText}>Ver Todos Los Recordatorios</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>plan de medicación</Text>
        <FlatList
          data={medicationPlan}
          keyExtractor={(item) => item.name}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.medItem}>
              <View>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medSchedule}>{item.schedule}</Text>
              </View>
              <Text style={styles.medDose}>{item.dosage}</Text>
            </View>
          )}
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('MedicacionForm')}
        >
          <Text style={styles.secondaryButtonText}>actualizar tratamiento</Text>
        </TouchableOpacity>
      </View>
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
  heroCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  heroLabel: {
    color: '#bfdbfe',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#dbeafe',
    marginTop: 4,
  },
  heroButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12,
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  highlightCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  highlightLabel: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  highlightValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 6,
  },
  highlightTrend: {
    color: '#38bdf8',
    fontSize: 13,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
  },
  rowLabel: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  rowDetail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  rowValue: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 16,
  },
  reminderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reminderLabel: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  reminderDate: {
    color: '#cbd5f5',
    marginTop: 4,
  },
  linkButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  linkText: {
    color: '#60a5fa',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  medName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  medSchedule: {
    color: '#94a3b8',
    fontSize: 13,
  },
  medDose: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#60a5fa',
    fontWeight: '700',
  },
});
