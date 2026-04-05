import { NivelEducativoId } from '../data/educacion';

export type RootStackParamList = {
  IniciarSesion: undefined;
  Login: undefined;
  CambiarContrasena: undefined;
  SobreNosotros: undefined;
  Contacto: undefined;
  MenuPrincipal: undefined;
  PacienteResumen: undefined;
  ExpedienteGestion: undefined;
  PacienteForm: undefined;
  ConsultaForm: undefined;
  CitaForm: undefined;
  VacunaForm: undefined;
  MedicacionForm: undefined;
  DocumentoForm: undefined;
  RecordatorioForm: undefined;
  RegistroDentalForm: undefined;
  RecordatorioList: undefined;
  Alergia: undefined;
  Educacion: undefined;
  EducacionNivel: { nivelId: NivelEducativoId };
  EducacionTema: { nivelId: NivelEducativoId; temaId: string };
  Registro: undefined;
};
