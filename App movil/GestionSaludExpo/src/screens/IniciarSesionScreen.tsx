/**
 * @file App movil/GestionSaludExpo/src/screens/IniciarSesionScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../components/AppText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IniciarSesion'>;

export function IniciarSesionScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Bienvenido a Gestión Salud</AppText>
      <AppText style={styles.subtitle}>
        Organiza tus citas, tratamientos y recordatorios desde un solo lugar.
      </AppText>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <AppText style={styles.btnText}>Ir a login</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('Registro')}
      >
        <AppText style={styles.secondaryText}>Crear cuenta</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0D1B2A',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    color: '#F4F8FF',
  },
  subtitle: {
    fontSize: 16,
    color: '#C9D7E8',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#29B6FF',
  },
  secondaryText: {
    color: '#29B6FF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
