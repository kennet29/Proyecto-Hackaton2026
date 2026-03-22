import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('campos incompletos', 'por favor llena usuario y password');
      return;
    }
    Alert.alert('login demo', `bienvenido ${username}`);
    navigation.navigate('MenuPrincipal');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>login</Text>
      <TextInput
        style={styles.input}
        placeholder="usuario o correo"
        placeholderTextColor="#657786"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="contraseña"
        placeholderTextColor="#657786"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
        <Text style={styles.btnText}>iniciar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate('CambiarContrasena')}
      >
        <Text style={styles.linkText}>olvide mi contraseña</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#111',
  },
  primaryBtn: {
    backgroundColor: '#0077b6',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 16,
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  linkBtn: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#0077b6',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
