import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerNivel } from '../data/educacion';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionNivel'>;

export function EducacionNivelScreen({ route, navigation }: Props) {
  const nivel = useMemo(() => obtenerNivel(route.params.nivelId), [route.params.nivelId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{nivel.nombre}</Text>
      <Text style={styles.subtitle}>{nivel.enfoque}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cómo lo explicamos</Text>
        <View style={styles.tagRow}>
          {nivel.comoMostrar.map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={nivel.temas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EducacionTema', { nivelId: nivel.id, temaId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardDescription}>{item.descripcion}</Text>
            <View style={styles.tagRow}>
              {item.formato.slice(0, 2).map((fmt) => (
                <View key={fmt} style={styles.smallTag}>
                  <Text style={styles.smallTagText}>{fmt}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#cbd5f5',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2563eb22',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#93c5fd',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#cbd5f5',
    marginBottom: 10,
  },
  smallTag: {
    backgroundColor: '#fbbf2422',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallTagText: {
    color: '#fde68a',
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 30,
  },
});
