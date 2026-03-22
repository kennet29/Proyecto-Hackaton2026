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
      Alert.alert('faltan datos', 'correo y nueva contraseña son requeridos');
      return;
    }
    Alert.alert('solicitud enviada', 'revisa tu correo para confirmar el cambio');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>cambiar contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="correo"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="codigo (opcional)"
        placeholderTextColor="#94a3b8"
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        style={styles.input}
        placeholder="nueva contraseña"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.btnText}>guardar</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 18,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
