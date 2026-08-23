/**
 * @file App movil/GestionSaludExpo/src/screens/SobreNosotrosScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../components/AppText';

export function SobreNosotrosScreen() {
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

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#071120',
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    color: '#F4F8FF',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 8,
    color: '#F4F8FF',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#C9D7E8',
  },
  card: {
    backgroundColor: '#132238',
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    color: '#F4F8FF',
  },
  cardText: {
    fontSize: 15,
    color: '#C9D7E8',
    lineHeight: 22,
  },
});
