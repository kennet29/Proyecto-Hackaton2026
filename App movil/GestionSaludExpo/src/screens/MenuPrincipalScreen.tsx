import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuPrincipal'>;

const options = [
  { key: 'citas', label: 'citas medicas' },
  { key: 'vacunas', label: 'vacunas y recordatorios' },
  { key: 'cronicos', label: 'plan de cuidados cronicos' },
  { key: 'documentos', label: 'documentos clinicos' },
  { key: 'contacto', label: 'contacto y soporte', navigateTo: 'Contacto' },
  { key: 'sobre', label: 'sobre nosotros', navigateTo: 'SobreNosotros' },
];

export function MenuPrincipalScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>menu principal</Text>
      <Text style={styles.subtitle}>elige un modulo para continuar</Text>
      <FlatList
        data={options}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.navigateTo && navigation.navigate(item.navigateTo as keyof RootStackParamList)}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5f5',
    marginVertical: 12,
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
});
