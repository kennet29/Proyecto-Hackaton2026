import React from 'react';
import { View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { AppText } from '../components/AppText';

export function ContactoScreen() {
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
