/**
 * @file App movil/GestionSaludExpo/src/screens/SobreNosotrosScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../components/AppText';
import { NanoSectionIllustration } from '../components/NanoSectionIllustration';
import { AppColors, useAppColors } from '../theme/useAppColors';

const PILLARS = [
  {
    title: 'Seguridad',
    description: 'Tus datos protegidos con acceso seguro.',
    nano: 'codigo-seguridad' as const,
  },
  {
    title: 'Acompañamiento',
    description: 'Recordatorios y avances claros cuando los necesitas.',
    nano: 'recordatorios' as const,
  },
  {
    title: 'Integraciones',
    description: 'Conecta tus servicios de salud y reduce el papeleo.',
    nano: 'compartir-historial' as const,
  },
];

export function SobreNosotrosScreen() {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <NanoSectionIllustration section="sobre-nosotros" size={92} />
        <AppText style={styles.title}>Nica Prime</AppText>
      </View>
      <AppText style={styles.paragraph}>
        Tu salud, organizada en un solo lugar. Consulta tu historial, medicamentos y seguimientos con
        herramientas simples y seguras.
      </AppText>
      <AppText style={styles.subtitle}>Nuestros Pilares</AppText>
      {PILLARS.map((pillar) => (
        <View key={pillar.title} style={styles.card}>
          <NanoSectionIllustration section={pillar.nano} size={58} />
          <View style={styles.cardCopy}>
            <AppText style={styles.cardTitle}>{pillar.title}</AppText>
            <AppText style={styles.cardText}>{pillar.description}</AppText>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardCopy: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 20,
  },
});
