import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

export function ContactoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>contactanos</Text>
      <Text style={styles.text}>soporte 24/7 para tus consultas medicas digitales.</Text>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:soporte@gestionsalud.com')}>
        <Text style={styles.link}>soporte@gestionsalud.com</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('tel:+5058001234')}>
        <Text style={styles.link}>+505 800 1234</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>horario</Text>
        <Text style={styles.cardText}>lunes a viernes 8:00 am a 8:00 pm (gmt-6)</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>direccion</Text>
        <Text style={styles.cardText}>centro clinico digital, managua, nicaragua</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 16,
    color: '#334155',
  },
});
