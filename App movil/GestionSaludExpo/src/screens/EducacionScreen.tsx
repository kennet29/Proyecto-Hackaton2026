/**
 * @file App movil/GestionSaludExpo/src/screens/EducacionScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { AppText } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { nivelesEducativos } from '../data/educacion';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Educacion'>;

export function EducacionScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <AppText style={styles.title}>Elige Un Nivel</AppText>
      <AppText style={styles.subtitle}>
        contenido educativo diseñado para niños, adolescentes y adultos
      </AppText>

      <TouchableOpacity
        style={styles.libraryCard}
        onPress={() => navigation.navigate('NanoBiblioteca')}
        accessibilityRole="button"
        accessibilityLabel="Abrir guías de salud y prevención"
      >
        <AppText style={styles.libraryTitle}>Guías de salud y prevención</AppText>
        <AppText style={styles.libraryDescription}>
          Consulta la biblioteca de documentos educativos en PDF.
        </AppText>
      </TouchableOpacity>

      <FlatList
        data={nivelesEducativos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EducacionNivel', { nivelId: item.id })}
          >
            <AppText style={styles.cardLabel}>{item.nombre}</AppText>
            <AppText style={styles.cardDescription}>{item.enfoque}</AppText>
            <View style={styles.tagRow}>
              {item.comoMostrar.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <AppText style={styles.tagText}>{tag}</AppText>
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
  libraryCard: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.info,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  libraryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  libraryDescription: {
    color: colors.textSoft,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  cardLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: colors.textSoft,
    lineHeight: 20,
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
});
