/**
 * @file App movil/GestionSaludExpo/src/screens/EducacionNivelScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { AppText } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerNivel } from '../data/educacion';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionNivel'>;

export function EducacionNivelScreen({ route, navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const nivelId = route.params?.nivelId;
  const nivel = useMemo(
    () => (nivelId ? obtenerNivel(nivelId) : null),
    [nivelId],
  );

  if (!nivel) {
    return (
      <SafeAreaView style={styles.container}>
        <AppText style={styles.errorText}>No se pudo abrir este nivel educativo.</AppText>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AppText style={styles.backBtnText}>Volver</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppText style={styles.title}>{nivel.nombre}</AppText>
      <AppText style={styles.subtitle}>{nivel.enfoque}</AppText>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Cómo lo explicamos</AppText>
        <View style={styles.tagRow}>
          {nivel.comoMostrar.map((item) => (
            <View key={item} style={styles.tag}>
              <AppText style={styles.tagText}>{item}</AppText>
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
            <AppText style={styles.cardTitle}>{item.titulo}</AppText>
            <AppText style={styles.cardDescription}>{item.descripcion}</AppText>
            <View style={styles.tagRow}>
              {item.formato.slice(0, 2).map((fmt) => (
                <View key={fmt} style={styles.smallTag}>
                  <AppText style={styles.smallTagText}>{fmt}</AppText>
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSoft,
    marginBottom: 16,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: `${colors.info}22`,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.info,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: colors.textSoft,
    marginBottom: 10,
  },
  smallTag: {
    backgroundColor: `${colors.accent}22`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallTagText: {
    color: colors.accent,
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 30,
  },
  errorText: {
    color: colors.accent,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
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
