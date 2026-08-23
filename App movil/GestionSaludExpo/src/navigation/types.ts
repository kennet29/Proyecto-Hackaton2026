/**
 * @file App movil/GestionSaludExpo/src/navigation/types.ts
 * @description TypeScript module implementation.
 */

import { NivelEducativoId } from '../data/educacion';

export type RootStackParamList = {
  IniciarSesion: undefined;
  Login: { afterLogin?: 'MedicoRegistro' | 'AdminSolicitudes' | 'AdminClinicas' } | undefined;
  CambiarContrasena: undefined;
  SobreNosotros: undefined;
  Contacto: undefined;
  Premium: undefined;
  MenuLoading: undefined;
  MenuPrincipal: undefined;
  PacienteResumen: { pacienteId?: number } | undefined;
  ExpedienteGestion: undefined;
  PacienteForm: undefined;
  PacienteEditor: { pacienteId?: number } | undefined;
  ConsultaList: undefined;
  ConsultaCreate: undefined;
  ConsultaForm: { consulta?: { consultaId: number; pacienteId: number; fechaconsulta: string; motivo: string; diagnostico?: string; tratamiento?: string; } } | undefined;
  CitaForm: undefined;
  VacunaForm: undefined;
  MedicacionForm: undefined;
  MedicacionCreate:
    | {
        medicacion?: {
          medicacionId: number;
          pacienteId: number;
          nombre: string;
          dosis?: string | null;
          via?: string | null;
          fechaInicio?: string | null;
          fechaFin?: string | null;
          horaMedicacion?: string | null;
          frecuencia?: string | null;
          horariomedicamentoId?: number | null;
          indicaciones?: string | null;
          nombreArchivoReceta?: string | null;
          mimeArchivoReceta?: string | null;
          tieneArchivoReceta?: boolean;
        };
      }
    | undefined;
  LesionForm: undefined;
  LesionCreate: undefined;
  OperacionForm: undefined;
  OperacionCreate: undefined;
  CondicionCronicaForm: undefined;
  CondicionCronicaCreate:
    | {
        selectedTipoCondicion?: {
          tipocondicionId: number;
          nombre: string;
        };
        typedConditionName?: string;
      }
    | undefined;
  CondicionTipoSelector:
    | {
        currentName?: string;
        selectedId?: number;
      }
    | undefined;
  ControlCronico: undefined;
  Desparasitacion: undefined;
  DesparasitacionCreate: undefined;
  DocumentoForm: undefined;
  CompartirHistorial: { pacienteId?: number } | undefined;
  HistorialCompartido: { token?: string } | undefined;
  Embarazo: undefined;
  RecordatorioForm: undefined;
  RegistroDentalForm: undefined;
  RegistroDentalCreate: undefined;
  RecordatorioList: undefined;
  Alergia: undefined;
  AlergiaCreate: undefined;
  Habitos: undefined;
  SeguimientoFisico: undefined;
  SeguimientoFisicoForm: { patientId?: number } | undefined;
  Periodo: undefined;
  SaludMental: undefined;
  NanoConsejero: undefined;
  NanoHistorial: undefined;
  NanoConfiguracion: undefined;
  ExamenClinico: undefined;
  SeguimientoPostevento: undefined;
  MedicoRegistro: undefined;
  AdminSolicitudes: undefined;
  AdminSolicitudDetalle: { solicitudId: number; demo?: boolean };
  AdminClinicas: undefined;
  AdminInstituciones: undefined;
  AdminPagos: undefined;
  Educacion: undefined;
  EducacionNivel: { nivelId: NivelEducativoId };
  EducacionTema: { nivelId: NivelEducativoId; temaId: string };
  Registro: undefined;
};
