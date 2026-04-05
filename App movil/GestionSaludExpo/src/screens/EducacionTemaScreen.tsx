import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerTema } from '../data/educacion';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionTema'>;

export function EducacionTemaScreen({ route, navigation }: Props) {
  const tema = obtenerTema(route.params.nivelId, route.params.temaId);

  if (!tema) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>no encontramos este tema.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>tema</Text>
      <Text style={styles.title}>{tema.titulo}</Text>
      <Text style={styles.description}>{tema.descripcion}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>actividades</Text>
        {tema.actividades.map((actividad) => (
          <Text key={actividad} style={styles.sectionText}>
            • {actividad}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>recursos visuales</Text>
        {tema.recursosVisuales.map((recurso) => (
          <Text key={recurso} style={styles.sectionText}>
            • {recurso}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>formatos recomendados</Text>
        {tema.formato.map((fmt) => (
          <Text key={fmt} style={styles.sectionText}>
            • {fmt}
          </Text>
        ))}
      </View>

      {tema.recordatorios && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>recordatorios / recompensas</Text>
          {tema.recordatorios.map((rec) => (
            <Text key={rec} style={[styles.sectionText, styles.highlight]}>
              • {rec}
            </Text>
          ))}
        </View>
      )}
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
  label: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 8,
  },
  description: {
    color: '#cbd5f5',
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionText: {
    color: '#cbd5f5',
    marginBottom: 6,
  },
  highlight: {
    color: '#fcd34d',
  },
  errorText: {
    color: '#f87171',
    fontSize: 18,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f87171',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#f87171',
    fontWeight: '700',
  },
});
