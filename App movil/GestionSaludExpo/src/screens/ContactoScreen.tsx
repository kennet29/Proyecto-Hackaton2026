import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

export function ContactoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contactanos</Text>
      <Text style={styles.text}>Soporte 24/7 para tus consultas medicas digitales.</Text>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:soporte@gestionsalud.com')}>
        <Text style={styles.link}>soporte@gestionsalud.com</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('tel:+5058001234')}>
        <Text style={styles.link}>+505 800 1234</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Horario</Text>
        <Text style={styles.cardText}>Lunes a viernes 8:00 am a 8:00 pm (GMT-6)</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Direccion</Text>
        <Text style={styles.cardText}>Centro clinico digital, Managua, Nicaragua</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#071120',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    color: '#F4F8FF',
  },
  text: {
    fontSize: 16,
    color: '#C9D7E8',
    marginBottom: 20,
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    color: '#29B6FF',
    marginBottom: 10,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#132238',
    padding: 18,
    borderRadius: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    color: '#F4F8FF',
  },
  cardText: {
    fontSize: 16,
    color: '#C9D7E8',
    lineHeight: 22,
  },
});
