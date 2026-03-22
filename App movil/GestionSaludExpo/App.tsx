import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import { IniciarSesionScreen } from './src/screens/IniciarSesionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CambiarContrasenaScreen } from './src/screens/CambiarContrasenaScreen';
import { MenuPrincipalScreen } from './src/screens/MenuPrincipalScreen';
import { SobreNosotrosScreen } from './src/screens/SobreNosotrosScreen';
import { ContactoScreen } from './src/screens/ContactoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="IniciarSesion"
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen
          name="IniciarSesion"
          component={IniciarSesionScreen}
          options={{ title: 'inicio' }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="CambiarContrasena"
          component={CambiarContrasenaScreen}
          options={{ title: 'cambiar contraseña' }}
        />
        <Stack.Screen
          name="MenuPrincipal"
          component={MenuPrincipalScreen}
          options={{ title: 'menu principal' }}
        />
        <Stack.Screen
          name="SobreNosotros"
          component={SobreNosotrosScreen}
          options={{ title: 'sobre nosotros' }}
        />
        <Stack.Screen name="Contacto" component={ContactoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
