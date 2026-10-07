import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import NanoAlimentacion from '../Nano Dashboards/Nano Alimentacion.svg';
import NanoDashboard from '../Nano Dashboards/Nano Dashboard.svg';
import NanoDashboardIndicadores from '../Nano Dashboards/Nano Dashboard Indicadores.svg';
import NanoPrime from '../Nano Dashboards/Nano Prime.svg';
import NanoSaludMental from '../Nano Dashboards/Nano Salud Mental.svg';
import NanoSeguimientoFisico from '../Nano Dashboards/Nano segumiento Fisico.svg';
import NanoHidratarse from '../Nanos Extra/Nano hidratarse.svg';
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
import NanoAlergias from '../../Nanos Medica/Nano Alergias.svg';
import NanoVacunas from '../../Nanos Medica/Nano Vacunas.svg';
import NanoMedicacion from '../../Nanos Medica/Nano Medicacion.svg';
import NanoResumenPaciente from '../../Nanos Medica/Nano Resumen del Paciente.svg';
import NanoConsultaMedica from '../../Nanos Medica/Nano Consulta Medica.svg';
import NanoCitasProgramadas from '../../Nanos Medica/Nano Citas Programadas.svg';
import NanoControlClinico from '../../Nanos Medica/Nano Control Clinico.svg';
import NanoSeguimientoCronico from '../../Nanos Medica/Nano Seguimiento Cronico.svg';
import NanoOperaciones from '../../Nanos Medica/Nano Operaciones.svg';
import NanoLesiones from '../../Nanos Medica/Nano Lesiones.svg';
import NanoRegistroDental from '../../Nanos Medica/Nano registro dental.svg';
import NanoEmbarazo from '../../Nanos Medica/Nano Embarazo.svg';
import NanoDesparasitaciones from '../../Nanos Medica/Nano Desparacitaciones.svg';
import NanoExamenesClinicos from '../../Nanos Medica/Nano Examenes Clinicos.svg';
import NanoSeguimientoCaso from '../../Nanos Medica/Nano Seguimiento de Caso.svg';
import NanoPlanGratis from '../../NANOS PARA REPARAR ERRORES Final/Nanos planes de pago/Plan de NANO Gratis.svg';
import NanoPlanFreemium from '../../NANOS PARA REPARAR ERRORES Final/Nanos planes de pago/Plan de Nano Freemium.svg';
import NanoPlanPlus from '../../NANOS PARA REPARAR ERRORES Final/Nanos planes de pago/Nano plan premium medico.svg';
import NanoPlanPublicidad from '../../NANOS PARA REPARAR ERRORES Final/Nanos planes de pago/Nano planes de pago 2.svg';

export type NanoSection =
  | 'alimentacion'
  | 'alergias'
  | 'biblioteca'
  | 'bienestar'
  | 'chef'
  | 'chef-color'
  | 'codigo-seguridad'
  | 'citas-programadas'
  | 'consulta-medica'
  | 'control-clinico'
  | 'compartir-historial'
  | 'dashboard'
  | 'dashboard-indicadores'
  | 'entrenador'
  | 'entrenador-color'
  | 'embarazo'
  | 'examenes-clinicos'
  | 'guias-medicas'
  | 'hidratarse'
  | 'modo-claro-oscuro'
  | 'medicacion'
  | 'operaciones'
  | 'planes-pago'
  | 'plan-gratis'
  | 'plan-freemium'
  | 'plan-plus'
  | 'plan-publicidad'
  | 'premium'
  | 'presupuesto'
  | 'prime'
  | 'recordatorios'
  | 'registro-dental'
  | 'resumen-paciente'
  | 'salud-mental'
  | 'seguimiento-fisico'
  | 'seguimiento-caso'
  | 'seguimiento-cronico'
  | 'sobre-nosotros'
  | 'solicitud-medica'
  | 'store'
  | 'tamano-letra'
  | 'vacunas'
  | 'desparasitaciones'
  | 'lesiones';

const illustrations: Record<NanoSection, React.ComponentType<SvgProps>> = {
  alimentacion: NanoAlimentacion,
  alergias: NanoAlergias,
  biblioteca: NanoBiblioteca,
  bienestar: NanoBienestar,
  chef: NanoChef,
  'chef-color': NanoChefColor,
  'codigo-seguridad': NanoCodigoSeguridad,
  'citas-programadas': NanoCitasProgramadas,
  'consulta-medica': NanoConsultaMedica,
  'control-clinico': NanoControlClinico,
  'compartir-historial': NanoCompartirHistorial,
  dashboard: NanoDashboard,
  'dashboard-indicadores': NanoDashboardIndicadores,
  entrenador: NanoEntrenador,
  'entrenador-color': NanoEntrenadorColor,
  embarazo: NanoEmbarazo,
  'examenes-clinicos': NanoExamenesClinicos,
  'guias-medicas': NanoGuiasMedicas,
  hidratarse: NanoHidratarse,
  'modo-claro-oscuro': NanoModo,
  medicacion: NanoMedicacion,
  operaciones: NanoOperaciones,
  'planes-pago': NanoPlanesPago,
  'plan-gratis': NanoPlanGratis,
  'plan-freemium': NanoPlanFreemium,
  'plan-plus': NanoPlanPlus,
  'plan-publicidad': NanoPlanPublicidad,
  premium: NanoPremium,
  presupuesto: NanoPresupuesto,
  prime: NanoPrime,
  recordatorios: NanoRecordatorios,
  'registro-dental': NanoRegistroDental,
  'resumen-paciente': NanoResumenPaciente,
  'salud-mental': NanoSaludMental,
  'seguimiento-fisico': NanoSeguimientoFisico,
  'seguimiento-caso': NanoSeguimientoCaso,
  'seguimiento-cronico': NanoSeguimientoCronico,
  'sobre-nosotros': NanoSobreNosotros,
  'solicitud-medica': NanoSolicitudMedica,
  store: NanoStore,
  'tamano-letra': NanoTamanoLetra,
  vacunas: NanoVacunas,
  desparasitaciones: NanoDesparasitaciones,
  lesiones: NanoLesiones,
};

const labels: Record<NanoSection, string> = {
  alimentacion: 'Nano Alimentación',
  alergias: 'Nano Alergias',
  biblioteca: 'Nano Biblioteca',
  bienestar: 'Nano Bienestar',
  chef: 'Nano Chef',
  'chef-color': 'Nano Chef Color',
  'codigo-seguridad': 'Nano Código de Seguridad',
  'citas-programadas': 'Nano Citas Programadas',
  'consulta-medica': 'Nano Consulta Médica',
  'control-clinico': 'Nano Control Clínico',
  'compartir-historial': 'Nano Compartir Historial',
  dashboard: 'Nano Dashboard',
  'dashboard-indicadores': 'Nano Dashboard Indicadores',
  entrenador: 'Nano Entrenador',
  'entrenador-color': 'Nano Entrenador Color',
  embarazo: 'Nano Embarazo',
  'examenes-clinicos': 'Nano Exámenes Clínicos',
  'guias-medicas': 'Nano Guías Médicas',
  hidratarse: 'Nano hidratándose',
  'modo-claro-oscuro': 'Nano Modo Claro y Oscuro',
  medicacion: 'Nano Medicación',
  operaciones: 'Nano Operaciones',
  'planes-pago': 'Nano Planes de Pago',
  'plan-gratis': 'Nano con regalo del plan Gratis',
  'plan-freemium': 'Nano con corona del plan Freemium',
  'plan-plus': 'Nano con diamante del plan Plus',
  'plan-publicidad': 'Nano del plan Publicidad',
  premium: 'Nano Premium',
  presupuesto: 'Nano Presupuesto',
  prime: 'Nano Prime',
  recordatorios: 'Nano Recordatorios',
  'registro-dental': 'Nano Registro Dental',
  'resumen-paciente': 'Nano Resumen del Paciente',
  'salud-mental': 'Nano Salud Mental',
  'seguimiento-fisico': 'Nano Seguimiento Físico',
  'seguimiento-caso': 'Nano Seguimiento de Caso',
  'seguimiento-cronico': 'Nano Seguimiento Crónico',
  'sobre-nosotros': 'Nano Sobre Nosotros',
  'solicitud-medica': 'Nano Solicitud Médica',
  store: 'Nano Store',
  'tamano-letra': 'Nano Tamaño de Letra',
  vacunas: 'Nano Vacunas',
  desparasitaciones: 'Nano Desparasitaciones',
  lesiones: 'Nano Lesiones',
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
