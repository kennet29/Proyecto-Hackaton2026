import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IniciarSesion'>;

export function IniciarSesionScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido A Gestion Salud</Text>
      <Text style={styles.subtitle}>
        Organiza tus citas, tratamientos y recordatorios desde un solo lugar.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.btnText}>Ir A Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('MenuPrincipal')}
      >
        <Text style={styles.secondaryText}>Ver Menu Principal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0d1321',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fefefe',
  },
  subtitle: {
    fontSize: 16,
    color: '#d2d5dd',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#00a6fb',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00a6fb',
  },
  secondaryText: {
    color: '#00a6fb',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
