import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '../components/AppText';
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
        <AppText style={styles.errorText}>no encontramos este tema.</AppText>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppText style={styles.backBtnText}>volver</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText style={styles.label}>tema</AppText>
      <AppText style={styles.title}>{tema.titulo}</AppText>
      <AppText style={styles.description}>{tema.descripcion}</AppText>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>actividades</AppText>
        {tema.actividades.map((actividad) => (
          <AppText key={actividad} style={styles.sectionText}>
            • {actividad}
          </AppText>
        ))}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>recursos visuales</AppText>
        {tema.recursosVisuales.map((recurso) => (
          <AppText key={recurso} style={styles.sectionText}>
            • {recurso}
          </AppText>
        ))}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>formatos recomendados</AppText>
        {tema.formato.map((fmt) => (
          <AppText key={fmt} style={styles.sectionText}>
            • {fmt}
          </AppText>
        ))}
      </View>

      {tema.recordatorios && (
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>recordatorios / recompensas</AppText>
          {tema.recordatorios.map((rec) => (
            <AppText key={rec} style={[styles.sectionText, styles.highlight]}>
              • {rec}
            </AppText>
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
