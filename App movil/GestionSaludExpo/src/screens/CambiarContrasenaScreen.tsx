import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CambiarContrasena'>;

export function CambiarContrasenaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const onSubmit = () => {
    if (!email || !newPassword) {
      Alert.alert('Faltan Datos', 'correo y nueva contraseÃ±a son requeridos');
      return;
    }
    Alert.alert('Solicitud Enviada', 'Revisa tu correo para confirmar el cambio');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>cambiar contraseÃ±a</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9FB3C8"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Codigo (Opcional)"
        placeholderTextColor="#9FB3C8"
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        style={styles.input}
        placeholder="nueva contraseÃ±a"
        placeholderTextColor="#9FB3C8"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.btnText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F4F8FF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 18,
    color: '#071120',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C9D7E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: '#071120',
  },
  primaryBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
