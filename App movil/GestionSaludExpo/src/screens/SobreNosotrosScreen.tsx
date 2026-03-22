import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export function SobreNosotrosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>sobre nosotros</Text>
      <Text style={styles.paragraph}>
        gestion salud nace para centralizar tus historiales clinicos, recordatorios de medicamentos y
        seguimientos cronicos. empoderamos al paciente con herramientas simples y seguras.
      </Text>
      <Text style={styles.subtitle}>nuestros pilares</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>seguridad</Text>
        <Text style={styles.cardText}>
          cifrado extremo a extremo y autenticacion moderna para proteger tus datos.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>acompanamiento</Text>
        <Text style={styles.cardText}>
          recordatorios inteligentes y tableros que muestran tus avances y controles pendientes.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>integraciones</Text>
        <Text style={styles.cardText}>
          conectamos con laboratorios, clinicas y aseguradoras para reducir el papeleo.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fefefe',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    color: '#111',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    color: '#222',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3f3f46',
  },
  card: {
    backgroundColor: '#e6f4ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 15,
    color: '#1e293b',
  },
});
