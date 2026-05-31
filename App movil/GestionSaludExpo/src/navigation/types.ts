import { NivelEducativoId } from '../data/educacion';

export type RootStackParamList = {
  IniciarSesion: undefined;
  Login: undefined;
  CambiarContrasena: undefined;
  SobreNosotros: undefined;
  Contacto: undefined;
  MenuLoading: undefined;
  MenuPrincipal: undefined;
  PacienteResumen: undefined;
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
  CondicionCronicaCreate: undefined;
  ControlCronico: undefined;
  Desparasitacion: undefined;
  DesparasitacionCreate: undefined;
  DocumentoForm: undefined;
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
  ExamenClinico: undefined;
  SeguimientoPostevento: undefined;
  Educacion: undefined;
  EducacionNivel: { nivelId: NivelEducativoId };
  EducacionTema: { nivelId: NivelEducativoId; temaId: string };
  Registro: undefined;
};
