import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { IniciarSesionScreen } from './src/screens/IniciarSesionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CambiarContrasenaScreen } from './src/screens/CambiarContrasenaScreen';
import { MenuPrincipalScreen } from './src/screens/MenuPrincipalScreen';
import { SobreNosotrosScreen } from './src/screens/SobreNosotrosScreen';
import { ContactoScreen } from './src/screens/ContactoScreen';
import { PacienteFormScreen } from './src/screens/PacienteFormScreen';
import { PacienteEditorScreen } from './src/screens/PacienteEditorScreen';
import { ConsultaFormScreen } from './src/screens/ConsultaFormScreen';
import { ConsultaListScreen } from './src/screens/ConsultaListScreen';
import { CitaFormScreen } from './src/screens/CitaFormScreen';
import { VacunaFormScreen } from './src/screens/VacunaFormScreen';
import { MedicacionFormScreen } from './src/screens/MedicacionFormScreen';
import { LesionFormScreen } from './src/screens/LesionFormScreen';
import { OperacionFormScreen } from './src/screens/OperacionFormScreen';
import { CondicionCronicaFormScreen } from './src/screens/CondicionCronicaFormScreen';
import { DocumentoFormScreen } from './src/screens/DocumentoFormScreen';
import { RecordatorioFormScreen } from './src/screens/RecordatorioFormScreen';
import { RegistroDentalFormScreen } from './src/screens/RegistroDentalFormScreen';
import { RecordatorioListScreen } from './src/screens/RecordatorioListScreen';
import { PacienteResumenScreen } from './src/screens/PacienteResumenScreen';
import { ExpedienteGestionScreen } from './src/screens/ExpedienteGestionScreen';
import { EducacionScreen } from './src/screens/EducacionScreen';
import { EducacionNivelScreen } from './src/screens/EducacionNivelScreen';
import { EducacionTemaScreen } from './src/screens/EducacionTemaScreen';
import { RegistroScreen } from './src/screens/RegistroScreen';
import { AlergiaScreen } from './src/screens/AlergiaScreen';
import { HabitosScreen } from './src/screens/HabitosScreen';
import { PeriodoScreen } from './src/screens/PeriodoScreen';
import { SaludMentalScreen } from './src/screens/SaludMentalScreen';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { token, user } = useAuth();
  usePushNotifications(token, user?.id ?? null);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen
          name="IniciarSesion"
          component={IniciarSesionScreen}
          options={{ title: 'Iniciar Sesion' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Registro' }} />
        <Stack.Screen
          name="CambiarContrasena"
          component={CambiarContrasenaScreen}
          options={{ title: 'Cambiar Contrasena' }}
        />
        <Stack.Screen
          name="MenuPrincipal"
          component={MenuPrincipalScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PacienteResumen"
          component={PacienteResumenScreen}
          options={{ title: 'Resumen del Paciente' }}
        />
        <Stack.Screen
          name="ExpedienteGestion"
          component={ExpedienteGestionScreen}
          options={{ title: 'Gestionar Expediente' }}
        />
        <Stack.Screen
          name="PacienteForm"
          component={PacienteFormScreen}
          options={{ title: 'Pacientes' }}
        />
        <Stack.Screen
          name="PacienteEditor"
          component={PacienteEditorScreen}
          options={({ route }) => ({
            title: route.params?.pacienteId ? 'Editar Paciente' : 'Nuevo Paciente',
          })}
        />
        <Stack.Screen
          name="ConsultaList"
          component={ConsultaListScreen}
          options={{ title: 'Consultas Médicas' }}
        />
        <Stack.Screen
          name="ConsultaForm"
          component={ConsultaFormScreen}
          options={{ title: 'Consultas' }}
        />
        <Stack.Screen name="CitaForm" component={CitaFormScreen} options={{ title: 'Citas' }} />
        <Stack.Screen name="VacunaForm" component={VacunaFormScreen} options={{ title: 'Vacunas' }} />
        <Stack.Screen
          name="MedicacionForm"
          component={MedicacionFormScreen}
          options={{ title: 'Medicacion' }}
        />
        <Stack.Screen
          name="LesionForm"
          component={LesionFormScreen}
          options={{ title: 'Lesiones' }}
        />
        <Stack.Screen
          name="OperacionForm"
          component={OperacionFormScreen}
          options={{ title: 'Operaciones' }}
        />
        <Stack.Screen
          name="CondicionCronicaForm"
          component={CondicionCronicaFormScreen}
          options={{ title: 'Condiciones Cronicas' }}
        />
        <Stack.Screen name="Periodo" component={PeriodoScreen} options={{ title: 'Periodo' }} />
        <Stack.Screen
          name="SaludMental"
          component={SaludMentalScreen}
          options={{ title: 'Salud Mental' }}
        />
        <Stack.Screen
          name="DocumentoForm"
          component={DocumentoFormScreen}
          options={{ title: 'Documentos' }}
        />
        <Stack.Screen
          name="RecordatorioForm"
          component={RecordatorioFormScreen}
          options={{ title: 'Recordatorios' }}
        />
        <Stack.Screen
          name="RegistroDentalForm"
          component={RegistroDentalFormScreen}
          options={{ title: 'Registro Dental' }}
        />
        <Stack.Screen
          name="Alergia"
          component={AlergiaScreen}
          options={{ title: 'Alergias' }}
        />
        <Stack.Screen
          name="Habitos"
          component={HabitosScreen}
          options={{ title: 'Habitos' }}
        />
        <Stack.Screen
          name="Educacion"
          component={EducacionScreen}
          options={{ title: 'Academia Saludable' }}
        />
        <Stack.Screen
          name="EducacionNivel"
          component={EducacionNivelScreen}
          options={{ title: 'Detalle del Nivel' }}
        />
        <Stack.Screen
          name="EducacionTema"
          component={EducacionTemaScreen}
          options={{ title: 'Detalle del Tema' }}
        />
        <Stack.Screen
          name="RecordatorioList"
          component={RecordatorioListScreen}
          options={{ title: 'Recordatorios' }}
        />
        <Stack.Screen
          name="SobreNosotros"
          component={SobreNosotrosScreen}
          options={{ title: 'Sobre Nosotros' }}
        />
        <Stack.Screen name="Contacto" component={ContactoScreen} options={{ title: 'Contacto' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
