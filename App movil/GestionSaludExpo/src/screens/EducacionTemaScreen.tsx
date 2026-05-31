import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerTema } from '../data/educacion';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionTema'>;

export function EducacionTemaScreen({ route, navigation }: Props) {
  const nivelId = route.params?.nivelId;
  const temaId = route.params?.temaId;
  const tema = nivelId && temaId ? obtenerTema(nivelId, temaId) : null;

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
            â€¢ {actividad}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>recursos visuales</Text>
        {tema.recursosVisuales.map((recurso) => (
          <Text key={recurso} style={styles.sectionText}>
            â€¢ {recurso}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>formatos recomendados</Text>
        {tema.formato.map((fmt) => (
          <Text key={fmt} style={styles.sectionText}>
            â€¢ {fmt}
          </Text>
        ))}
      </View>

      {tema.recordatorios && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>recordatorios / recompensas</Text>
          {tema.recordatorios.map((rec) => (
            <Text key={rec} style={[styles.sectionText, styles.highlight]}>
              â€¢ {rec}
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
    backgroundColor: '#071120',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    color: '#9FB3C8',
    fontWeight: '700',
  },
  title: {
    color: '#F4F8FF',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 8,
  },
  description: {
    color: '#C9D7E8',
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionText: {
    color: '#C9D7E8',
    marginBottom: 6,
  },
  highlight: {
    color: '#FF4D73',
  },
  errorText: {
    color: '#FF4D73',
    fontSize: 18,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FF4D73',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#FF4D73',
    fontWeight: '700',
  },
});
