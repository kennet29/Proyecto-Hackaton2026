/**
 * @file App movil/GestionSaludExpo/src/screens/ContactoScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { AppText } from '../components/AppText';
import { AppColors, useAppColors } from '../theme/useAppColors';

export function ContactoScreen() {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Contactanos</AppText>
      <AppText style={styles.text}>Soporte 24/7 para tus consultas medicas digitales.</AppText>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:soporte@gestionsalud.com')}>
        <AppText style={styles.link}>soporte@gestionsalud.com</AppText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('tel:+5058001234')}>
        <AppText style={styles.link}>+505 800 1234</AppText>
      </TouchableOpacity>
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Horario</AppText>
        <AppText style={styles.cardText}>Lunes a viernes 8:00 am a 8:00 pm (GMT-6)</AppText>
      </View>
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Direccion</AppText>
        <AppText style={styles.cardText}>Centro clinico digital, Managua, Nicaragua</AppText>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    color: colors.text,
  },
  text: {
    fontSize: 16,
    color: colors.textSoft,
    marginBottom: 20,
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    color: colors.info,
    marginBottom: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    color: colors.text,
  },
  cardText: {
    fontSize: 16,
    color: colors.textSoft,
    lineHeight: 22,
  },
});
