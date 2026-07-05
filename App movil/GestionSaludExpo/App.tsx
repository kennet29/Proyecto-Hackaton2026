import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
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
import { ConsultaCreateScreen } from './src/screens/ConsultaCreateScreen';
import { ConsultaListScreen } from './src/screens/ConsultaListScreen';
import { CitaFormScreen } from './src/screens/CitaFormScreen';
import { VacunaFormScreen } from './src/screens/VacunaFormScreen';
import { MedicacionFormScreen } from './src/screens/MedicacionFormScreen';
import { MedicacionCreateScreen } from './src/screens/MedicacionCreateScreen';
import { LesionFormScreen } from './src/screens/LesionFormScreen';
import { LesionCreateScreen } from './src/screens/LesionCreateScreen';
import { OperacionFormScreen } from './src/screens/OperacionFormScreen';
import { OperacionCreateScreen } from './src/screens/OperacionCreateScreen';
import { CondicionCronicaFormScreen } from './src/screens/CondicionCronicaFormScreen';
import { CondicionCronicaCreateScreen } from './src/screens/CondicionCronicaCreateScreen';
import { CondicionTipoSelectorScreen } from './src/screens/CondicionTipoSelectorScreen';
import { ControlCronicoScreen } from './src/screens/ControlCronicoScreen';
import { DesparasitacionScreen } from './src/screens/DesparasitacionScreen';
import { DesparasitacionCreateScreen } from './src/screens/DesparasitacionCreateScreen';
import { DocumentoFormScreen } from './src/screens/DocumentoFormScreen';
import { CompartirHistorialScreen } from './src/screens/CompartirHistorialScreen';
import { HistorialCompartidoScreen } from './src/screens/HistorialCompartidoScreen';
import { EmbarazoScreen } from './src/screens/EmbarazoScreen';
import { RecordatorioFormScreen } from './src/screens/RecordatorioFormScreen';
import { RegistroDentalFormScreen } from './src/screens/RegistroDentalFormScreen';
import { RegistroDentalCreateScreen } from './src/screens/RegistroDentalCreateScreen';
import { RecordatorioListScreen } from './src/screens/RecordatorioListScreen';
import { PacienteResumenScreen } from './src/screens/PacienteResumenScreen';
import { ExpedienteGestionScreen } from './src/screens/ExpedienteGestionScreen';
import { EducacionScreen } from './src/screens/EducacionScreen';
import { EducacionNivelScreen } from './src/screens/EducacionNivelScreen';
import { EducacionTemaScreen } from './src/screens/EducacionTemaScreen';
import { RegistroScreen } from './src/screens/RegistroScreen';
import { AlergiaScreen } from './src/screens/AlergiaScreen';
import { AlergiaCreateScreen } from './src/screens/AlergiaCreateScreen';
import { HabitosScreen } from './src/screens/HabitosScreen';
import { SeguimientoFisicoScreen } from './src/screens/SeguimientoFisicoScreen';
import { SeguimientoFisicoFormScreen } from './src/screens/SeguimientoFisicoFormScreen';
import { PeriodoScreen } from './src/screens/PeriodoScreen';
import { SaludMentalScreen } from './src/screens/SaludMentalScreen';
import { NanoConsejeroScreen } from './src/screens/NanoConsejeroScreen';
import { NanoHistorialScreen } from './src/screens/NanoHistorialScreen';
import { ExamenClinicoScreen } from './src/screens/ExamenClinicoScreen';
import { SeguimientoPosteventoScreen } from './src/screens/SeguimientoPosteventoScreen';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useOfflineWriteSync } from './src/hooks/useOfflineWriteSync';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { appColors } from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const sharedScreenOptions = {
  headerStyle: { backgroundColor: appColors.background },
  headerTintColor: appColors.text,
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['/', 'gestionsalud://'],
  config: {
    screens: {
      Login: '',
      IniciarSesion: 'iniciar-sesion',
      Registro: 'registro',
      CambiarContrasena: 'cambiar-contrasena',
      MenuPrincipal: 'panel',
      PacienteResumen: 'paciente/resumen',
      ExpedienteGestion: 'expediente',
      PacienteForm: 'pacientes',
      PacienteEditor: 'pacientes/editar',
      ConsultaList: 'consultas',
      ConsultaCreate: 'consultas/nueva',
      ConsultaForm: 'consultas/editar',
      CitaForm: 'citas',
      VacunaForm: 'vacunas',
      MedicacionForm: 'medicacion',
      MedicacionCreate: 'medicacion/nueva',
      LesionForm: 'lesiones',
      LesionCreate: 'lesiones/nueva',
      OperacionForm: 'operaciones',
      OperacionCreate: 'operaciones/nueva',
      CondicionCronicaForm: 'condiciones-cronicas',
      CondicionCronicaCreate: 'condiciones-cronicas/nueva',
      CondicionTipoSelector: 'condiciones-cronicas/tipo',
      ControlCronico: 'control-cronico',
      Desparasitacion: 'desparasitacion',
      DesparasitacionCreate: 'desparasitacion/nueva',
      Periodo: 'periodo',
      Embarazo: 'embarazo',
      SaludMental: 'salud-mental',
      NanoConsejero: 'nano',
      NanoHistorial: 'nano/historial',
      ExamenClinico: 'examenes-clinicos',
      SeguimientoPostevento: 'seguimiento-caso',
      DocumentoForm: 'documentos',
      CompartirHistorial: 'compartir-historial',
      HistorialCompartido: 'historial-compartido/:token?',
      RecordatorioForm: 'recordatorios',
      RegistroDentalForm: 'registro-dental',
      RegistroDentalCreate: 'registro-dental/nuevo',
      Alergia: 'alergias',
      AlergiaCreate: 'alergias/nueva',
      Habitos: 'habitos',
      SeguimientoFisico: 'seguimiento-fisico',
      SeguimientoFisicoForm: 'seguimiento-fisico/nuevo',
      Educacion: 'educacion',
      EducacionNivel: 'educacion/nivel',
      EducacionTema: 'educacion/tema',
      RecordatorioList: 'recordatorios/listado',
      SobreNosotros: 'sobre-nosotros',
      Contacto: 'contacto',
    },
  },
};

const PrivateNavigator = () => {
  const { token, user } = useAuth();
  usePushNotifications(token, user?.id ?? null);
  useOfflineWriteSync(token);

  return (
    <Stack.Navigator initialRouteName="MenuPrincipal" screenOptions={sharedScreenOptions}>
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
        options={{ title: 'Personas Asociadas' }}
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
        options={{ title: 'Consultas Medicas' }}
      />
      <Stack.Screen
        name="ConsultaCreate"
        component={ConsultaCreateScreen}
        options={{ title: 'Nueva Consulta' }}
      />
      <Stack.Screen
        name="ConsultaForm"
        component={ConsultaFormScreen}
        options={{ title: 'Editar Consulta' }}
      />
      <Stack.Screen name="CitaForm" component={CitaFormScreen} options={{ title: 'Citas' }} />
      <Stack.Screen name="VacunaForm" component={VacunaFormScreen} options={{ title: 'Vacunas' }} />
      <Stack.Screen
        name="MedicacionForm"
        component={MedicacionFormScreen}
        options={{ title: 'Medicacion' }}
      />
      <Stack.Screen
        name="MedicacionCreate"
        component={MedicacionCreateScreen}
        options={({ route }) => ({
          title: route.params?.medicacion?.medicacionId ? 'Editar Medicacion' : 'Nueva Medicacion',
        })}
      />
      <Stack.Screen
        name="LesionForm"
        component={LesionFormScreen}
        options={{ title: 'Lesiones' }}
      />
      <Stack.Screen
        name="LesionCreate"
        component={LesionCreateScreen}
        options={{ title: 'Nueva Lesion' }}
      />
      <Stack.Screen
        name="OperacionForm"
        component={OperacionFormScreen}
        options={{ title: 'Operaciones' }}
      />
      <Stack.Screen
        name="OperacionCreate"
        component={OperacionCreateScreen}
        options={{ title: 'Nueva Operacion' }}
      />
      <Stack.Screen
        name="CondicionCronicaForm"
        component={CondicionCronicaFormScreen}
        options={{ title: 'Condiciones Cronicas' }}
      />
      <Stack.Screen
        name="CondicionCronicaCreate"
        component={CondicionCronicaCreateScreen}
        options={{ title: 'Nueva Condicion Cronica' }}
      />
      <Stack.Screen
        name="CondicionTipoSelector"
        component={CondicionTipoSelectorScreen}
        options={{ title: 'Escoger Condicion' }}
      />
      <Stack.Screen
        name="ControlCronico"
        component={ControlCronicoScreen}
        options={{ title: 'Control Cronico' }}
      />
      <Stack.Screen
        name="Desparasitacion"
        component={DesparasitacionScreen}
        options={{ title: 'Desparasitacion' }}
      />
      <Stack.Screen
        name="DesparasitacionCreate"
        component={DesparasitacionCreateScreen}
        options={{ title: 'Nueva Desparasitacion' }}
      />
      <Stack.Screen name="Periodo" component={PeriodoScreen} options={{ title: 'Periodo' }} />
      <Stack.Screen
        name="Embarazo"
        component={EmbarazoScreen}
        options={{ title: 'Embarazo' }}
      />
      <Stack.Screen
        name="SaludMental"
        component={SaludMentalScreen}
        options={{ title: 'Salud Mental' }}
      />
      <Stack.Screen
        name="NanoConsejero"
        component={NanoConsejeroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NanoHistorial"
        component={NanoHistorialScreen}
        options={{ title: 'Historial de Nano' }}
      />
      <Stack.Screen
        name="ExamenClinico"
        component={ExamenClinicoScreen}
        options={{ title: 'Examenes Clinicos' }}
      />
      <Stack.Screen
        name="SeguimientoPostevento"
        component={SeguimientoPosteventoScreen}
        options={{ title: 'Seguimiento de Caso' }}
      />
      <Stack.Screen
        name="DocumentoForm"
        component={DocumentoFormScreen}
        options={{ title: 'Documentos' }}
      />
      <Stack.Screen
        name="CompartirHistorial"
        component={CompartirHistorialScreen}
        options={{ title: 'Compartir Historial' }}
      />
      <Stack.Screen
        name="HistorialCompartido"
        component={HistorialCompartidoScreen}
        options={{ title: 'Historial Compartido' }}
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
        name="RegistroDentalCreate"
        component={RegistroDentalCreateScreen}
        options={{ title: 'Nuevo Registro Dental' }}
      />
      <Stack.Screen name="Alergia" component={AlergiaScreen} options={{ title: 'Alergias' }} />
      <Stack.Screen
        name="AlergiaCreate"
        component={AlergiaCreateScreen}
        options={{ title: 'Nueva Alergia' }}
      />
      <Stack.Screen name="Habitos" component={HabitosScreen} options={{ title: 'Habitos' }} />
      <Stack.Screen
        name="SeguimientoFisico"
        component={SeguimientoFisicoScreen}
        options={{ title: 'Seguimiento Fisico' }}
      />
      <Stack.Screen
        name="SeguimientoFisicoForm"
        component={SeguimientoFisicoFormScreen}
        options={{ title: 'Nuevo Seguimiento Fisico' }}
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
  );
};

const PublicNavigator = () => (
  <Stack.Navigator initialRouteName="Login" screenOptions={sharedScreenOptions}>
    <Stack.Screen
      name="IniciarSesion"
      component={IniciarSesionScreen}
      options={{ title: 'Iniciar Sesion' }}
    />
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Registro' }} />
    <Stack.Screen
      name="HistorialCompartido"
      component={HistorialCompartidoScreen}
      options={{ title: 'Historial Compartido' }}
    />
    <Stack.Screen
      name="CambiarContrasena"
      component={CambiarContrasenaScreen}
      options={{ title: 'Cambiar Contrasena' }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { isHydrated, token } = useAuth();

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={appColors.text} />
      </View>
    );
  }

  return (
    <View style={styles.appRoot}>
      <View style={styles.appFrame}>
        <NavigationContainer linking={linking}>
          {token ? <PrivateNavigator /> : <PublicNavigator />}
        </NavigationContainer>
      </View>
    </View>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppErrorBoundary>
        <StatusBar style="light" />
        <RootNavigator />
      </AppErrorBoundary>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    width: '100%',
    backgroundColor: appColors.background,
    alignItems: 'center',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: appColors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.background,
  },
});
