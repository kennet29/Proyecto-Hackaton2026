import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import NanoAlimentacion from '../Nano Dashboards/Nano Alimentacion.svg';
import NanoDashboard from '../Nano Dashboards/Nano Dashboard.svg';
import NanoDashboardIndicadores from '../Nano Dashboards/Nano Dashboard Indicadores.svg';
import NanoPrime from '../Nano Dashboards/Nano Prime.svg';
import NanoSaludMental from '../Nano Dashboards/Nano Salud Mental.svg';
import NanoSeguimientoFisico from '../Nano Dashboards/Nano segumiento Fisico.svg';
import NanoBienestar from '../Nanos IA/Nano Bienestar.svg';
import NanoChef from '../Nanos IA/Nano Chef.svg';
import NanoChefColor from '../Nanos IA/Nano Chef Color.svg';
import NanoEntrenador from '../Nanos IA/Nano Entrenador.svg';
import NanoEntrenadorColor from '../Nanos IA/Nano Entrenador Color.svg';
import NanoBiblioteca from '../Nanos/NANO BIBLIOTECA.svg';
import NanoPresupuesto from '../Nanos/NANO PRESUPUESTO.svg';
import NanoStore from '../Nanos/NANO STORE.svg';
import NanoCodigoSeguridad from '../Nanos/nano codigo de seguridad.svg';
import NanoCompartirHistorial from '../Nanos/nano compartir historial.svg';
import NanoSolicitudMedica from '../Nanos/nano enviar solicitud medica.svg';
import NanoGuiasMedicas from '../Nanos/nano guias medicas.svg';
import NanoModo from '../Nanos/nano modo claro y oscuro.svg';
import NanoPlanesPago from '../Nanos/nano planes de pago.svg';
import NanoPremium from '../Nanos/nano premium.svg';
import NanoRecordatorios from '../Nanos/nano recordatorios.svg';
import NanoSobreNosotros from '../Nanos/nano sobre nosotros.svg';
import NanoTamanoLetra from '../Nanos/nano tamaño de letra.svg';

export type NanoSection =
  | 'alimentacion'
  | 'biblioteca'
  | 'bienestar'
  | 'chef'
  | 'chef-color'
  | 'codigo-seguridad'
  | 'compartir-historial'
  | 'dashboard'
  | 'dashboard-indicadores'
  | 'entrenador'
  | 'entrenador-color'
  | 'guias-medicas'
  | 'modo-claro-oscuro'
  | 'planes-pago'
  | 'premium'
  | 'presupuesto'
  | 'prime'
  | 'recordatorios'
  | 'salud-mental'
  | 'seguimiento-fisico'
  | 'sobre-nosotros'
  | 'solicitud-medica'
  | 'store'
  | 'tamano-letra';

const illustrations: Record<NanoSection, React.ComponentType<SvgProps>> = {
  alimentacion: NanoAlimentacion,
  biblioteca: NanoBiblioteca,
  bienestar: NanoBienestar,
  chef: NanoChef,
  'chef-color': NanoChefColor,
  'codigo-seguridad': NanoCodigoSeguridad,
  'compartir-historial': NanoCompartirHistorial,
  dashboard: NanoDashboard,
  'dashboard-indicadores': NanoDashboardIndicadores,
  entrenador: NanoEntrenador,
  'entrenador-color': NanoEntrenadorColor,
  'guias-medicas': NanoGuiasMedicas,
  'modo-claro-oscuro': NanoModo,
  'planes-pago': NanoPlanesPago,
  premium: NanoPremium,
  presupuesto: NanoPresupuesto,
  prime: NanoPrime,
  recordatorios: NanoRecordatorios,
  'salud-mental': NanoSaludMental,
  'seguimiento-fisico': NanoSeguimientoFisico,
  'sobre-nosotros': NanoSobreNosotros,
  'solicitud-medica': NanoSolicitudMedica,
  store: NanoStore,
  'tamano-letra': NanoTamanoLetra,
};

const labels: Record<NanoSection, string> = {
  alimentacion: 'Nano Alimentación',
  biblioteca: 'Nano Biblioteca',
  bienestar: 'Nano Bienestar',
  chef: 'Nano Chef',
  'chef-color': 'Nano Chef Color',
  'codigo-seguridad': 'Nano Código de Seguridad',
  'compartir-historial': 'Nano Compartir Historial',
  dashboard: 'Nano Dashboard',
  'dashboard-indicadores': 'Nano Dashboard Indicadores',
  entrenador: 'Nano Entrenador',
  'entrenador-color': 'Nano Entrenador Color',
  'guias-medicas': 'Nano Guías Médicas',
  'modo-claro-oscuro': 'Nano Modo Claro y Oscuro',
  'planes-pago': 'Nano Planes de Pago',
  premium: 'Nano Premium',
  presupuesto: 'Nano Presupuesto',
  prime: 'Nano Prime',
  recordatorios: 'Nano Recordatorios',
  'salud-mental': 'Nano Salud Mental',
  'seguimiento-fisico': 'Nano Seguimiento Físico',
  'sobre-nosotros': 'Nano Sobre Nosotros',
  'solicitud-medica': 'Nano Solicitud Médica',
  store: 'Nano Store',
  'tamano-letra': 'Nano Tamaño de Letra',
};

type Props = Omit<SvgProps, 'width' | 'height'> & {
  section: NanoSection;
  size?: number;
};

export function NanoSectionIllustration({ section, size = 72, ...props }: Props) {
  const Illustration = illustrations[section];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Illustration
        width={size * 0.88}
        height={size * 0.88}
        accessibilityLabel={labels[section]}
        accessibilityRole="image"
        {...props}
      />
    </View>
  );
}
