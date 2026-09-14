/**
 * @file App movil/GestionSaludExpo/src/screens/EducacionTemaScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerTema } from '../data/educacion';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionTema'>;

export function EducacionTemaScreen({ route, navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 8,
  },
  description: {
    color: colors.textSoft,
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionText: {
    color: colors.textSoft,
    marginBottom: 6,
  },
  highlight: {
    color: colors.accent,
  },
  errorText: {
    color: colors.accent,
    fontSize: 18,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: colors.accent,
    fontWeight: '700',
  },
});
