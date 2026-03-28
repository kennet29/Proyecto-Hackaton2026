import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider } from './src/context/AuthContext';
import { IniciarSesionScreen } from './src/screens/IniciarSesionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CambiarContrasenaScreen } from './src/screens/CambiarContrasenaScreen';
import { MenuPrincipalScreen } from './src/screens/MenuPrincipalScreen';
import { SobreNosotrosScreen } from './src/screens/SobreNosotrosScreen';
import { ContactoScreen } from './src/screens/ContactoScreen';
import { PacienteFormScreen } from './src/screens/PacienteFormScreen';
import { ConsultaFormScreen } from './src/screens/ConsultaFormScreen';
import { CitaFormScreen } from './src/screens/CitaFormScreen';
import { VacunaFormScreen } from './src/screens/VacunaFormScreen';
import { MedicacionFormScreen } from './src/screens/MedicacionFormScreen';
import { DocumentoFormScreen } from './src/screens/DocumentoFormScreen';
import { RecordatorioFormScreen } from './src/screens/RecordatorioFormScreen';
import { RegistroDentalFormScreen } from './src/screens/RegistroDentalFormScreen';
import { RecordatorioListScreen } from './src/screens/RecordatorioListScreen';
import { PacienteResumenScreen } from './src/screens/PacienteResumenScreen';
import { ExpedienteGestionScreen } from './src/screens/ExpedienteGestionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
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
            options={{ title: 'cambiar contrasena' }}
          />
          <Stack.Screen
            name="MenuPrincipal"
            component={MenuPrincipalScreen}
            options={{ title: 'menu principal' }}
          />
          <Stack.Screen
            name="PacienteResumen"
            component={PacienteResumenScreen}
            options={{ title: 'resumen del paciente' }}
          />
          <Stack.Screen
            name="ExpedienteGestion"
            component={ExpedienteGestionScreen}
            options={{ title: 'gestionar expediente' }}
          />
          <Stack.Screen
            name="PacienteForm"
            component={PacienteFormScreen}
            options={{ title: 'pacientes' }}
          />
          <Stack.Screen
            name="ConsultaForm"
            component={ConsultaFormScreen}
            options={{ title: 'consultas' }}
          />
          <Stack.Screen name="CitaForm" component={CitaFormScreen} options={{ title: 'citas' }} />
          <Stack.Screen name="VacunaForm" component={VacunaFormScreen} options={{ title: 'vacunas' }} />
          <Stack.Screen
            name="MedicacionForm"
            component={MedicacionFormScreen}
            options={{ title: 'medicacion' }}
          />
          <Stack.Screen
            name="DocumentoForm"
            component={DocumentoFormScreen}
            options={{ title: 'documentos' }}
          />
          <Stack.Screen
            name="RecordatorioForm"
            component={RecordatorioFormScreen}
            options={{ title: 'recordatorios' }}
          />
          <Stack.Screen
            name="RegistroDentalForm"
            component={RegistroDentalFormScreen}
            options={{ title: 'registro dental' }}
          />
          <Stack.Screen
            name="RecordatorioList"
            component={RecordatorioListScreen}
            options={{ title: 'recordatorios' }}
          />
          <Stack.Screen
            name="SobreNosotros"
            component={SobreNosotrosScreen}
            options={{ title: 'sobre nosotros' }}
          />
          <Stack.Screen name="Contacto" component={ContactoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
