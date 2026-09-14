/**
 * @file App movil/GestionSaludExpo/src/screens/SobreNosotrosScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../components/AppText';
import { AppColors, useAppColors } from '../theme/useAppColors';

export function SobreNosotrosScreen() {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppText style={styles.title}>Sobre Nosotros</AppText>
      <AppText style={styles.paragraph}>
        Gestion Salud nace para centralizar tus historiales clinicos, recordatorios de medicamentos y
        seguimientos cronicos. Empoderamos al paciente con herramientas simples y seguras.
      </AppText>
      <AppText style={styles.subtitle}>Nuestros Pilares</AppText>
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Seguridad</AppText>
        <AppText style={styles.cardText}>
          Cifrado extremo a extremo y autenticacion moderna para proteger tus datos.
        </AppText>
      </View>
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Acompanamiento</AppText>
        <AppText style={styles.cardText}>
          Recordatorios inteligentes y tableros que muestran tus avances y controles pendientes.
        </AppText>
      </View>
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Integraciones</AppText>
        <AppText style={styles.cardText}>
          Conectamos con laboratorios, clinicas y aseguradoras para reducir el papeleo.
        </AppText>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    color: colors.text,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 8,
    color: colors.text,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSoft,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    color: colors.text,
  },
  cardText: {
    fontSize: 15,
    color: colors.textSoft,
    lineHeight: 22,
  },
});
