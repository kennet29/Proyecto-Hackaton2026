import { Module } from "@nestjs/common";
import { PacienteModule } from "./paciente/paciente.module";
import { UsuarioModule } from "./usuario/usuario.module";
import { RolModule } from "./rol/rol.module";
import { PermisoModule } from "./permiso/permiso.module";
import { RolpermisoModule } from "./rolpermiso/rolpermiso.module";
import { UsuariorolModule } from "./usuariorol/usuariorol.module";
import { EspecialidadModule } from "./especialidad/especialidad.module";
import { TipovacunaModule } from "./tipovacuna/tipovacuna.module";
import { TipolesionModule } from "./tipolesion/tipolesion.module";
import { TipooperacionModule } from "./tipooperacion/tipooperacion.module";
import { TipodocumentoclinicoModule } from "./tipodocumentoclinico/tipodocumentoclinico.module";
import { TipocondicioncronicaModule } from "./tipocondicioncronica/tipocondicioncronica.module";
import { TipohabitoModule } from "./tipohabito/tipohabito.module";
import { ConsultamedicaModule } from "./consultamedica/consultamedica.module";
import { LesionModule } from "./lesion/lesion.module";
import { EstilovidaModule } from "./estilovida/estilovida.module";
import { VacunaModule } from "./vacuna/vacuna.module";
import { CitamedicaModule } from "./citamedica/citamedica.module";
import { RegistrodentalModule } from "./registrodental/registrodental.module";
import { OperacionModule } from "./operacion/operacion.module";
import { DesparasitacionModule } from "./desparasitacion/desparasitacion.module";
import { RegistromensualModule } from "./registromensual/registromensual.module";
import { EmbarazoModule } from "./embarazo/embarazo.module";
import { ControlprenatalModule } from "./controlprenatal/controlprenatal.module";
import { DocumentoclinicoModule } from "./documentoclinico/documentoclinico.module";
import { NotificacionModule } from "./notificacion/notificacion.module";
import { RecordatoriocitaModule } from "./recordatoriocita/recordatoriocita.module";
import { MedicacionModule } from "./medicacion/medicacion.module";
import { HorariomedicamentoModule } from "./horariomedicamento/horariomedicamento.module";
import { AlergiaModule } from "./alergia/alergia.module";
import { AntecedentefamiliarModule } from "./antecedentefamiliar/antecedentefamiliar.module";
import { HabitoespecificoModule } from "./habitoespecifico/habitoespecifico.module";
import { PuntajeriesgoModule } from "./puntajeriesgo/puntajeriesgo.module";
import { CondicioncronicaModule } from "./condicioncronica/condicioncronica.module";
import { ObjetivocronicoModule } from "./objetivocronico/objetivocronico.module";
import { ControlcronicoModule } from "./controlcronico/controlcronico.module";
import { AdherenciacronicaModule } from "./adherenciacronica/adherenciacronica.module";
import { EvaluacionsaludhabitoModule } from "./evaluacionsaludhabito/evaluacionsaludhabito.module";
import { DetalleevaluacionsaludModule } from "./detalleevaluacionsalud/detalleevaluacionsalud.module";
import { PermisoaccesoModule } from "./permisoacceso/permisoacceso.module";
import { UsuarioPacienteModule } from "./usuariopaciente/usuariopaciente.module";
import { PeriodoModule } from "./periodo/periodo.module";
import { SaludmentalModule } from "./saludmental/saludmental.module";
import { MedicoregistroModule } from "./medicoregistro/medicoregistro.module";
import { InstitucionsaludModule } from "./institucionsalud/institucionsalud.module";
import { CatalogoservicioModule } from "./catalogoservicio/catalogoservicio.module";
import { MedicamentoraroModule } from "./medicamentoraro/medicamentoraro.module";
import { InstitucionservicioModule } from "./institucionservicio/institucionservicio.module";
import { InstitucionmedicamentoModule } from "./institucionmedicamento/institucionmedicamento.module";
import { InstitucionimagenModule } from "./institucionimagen/institucionimagen.module";
import { InstitucionhorarioModule } from "./institucionhorario/institucionhorario.module";
import { InstitucionespecialidadModule } from "./institucionespecialidad/institucionespecialidad.module";
import { SeguimientofisicoModule } from "./seguimientofisico/seguimientofisico.module";
import { ExamenclinicoModule } from "./examenclinico/examenclinico.module";
import { SeguimientoposteventoModule } from "./seguimientopostevento/seguimientopostevento.module";

/**
 * Agrupa controladores y proveedores del dominio gestion salud.
 */
@Module({
  imports: [
    PacienteModule,
    UsuarioModule,
    RolModule,
    PermisoModule,
    RolpermisoModule,
    UsuariorolModule,
    EspecialidadModule,
    TipovacunaModule,
    TipolesionModule,
    TipooperacionModule,
    TipodocumentoclinicoModule,
    TipocondicioncronicaModule,
    TipohabitoModule,
    ConsultamedicaModule,
    LesionModule,
    EstilovidaModule,
    VacunaModule,
    CitamedicaModule,
    RegistrodentalModule,
    OperacionModule,
    DesparasitacionModule,
    RegistromensualModule,
    EmbarazoModule,
    ControlprenatalModule,
    DocumentoclinicoModule,
    NotificacionModule,
    RecordatoriocitaModule,
    MedicacionModule,
    HorariomedicamentoModule,
    AlergiaModule,
    AntecedentefamiliarModule,
    HabitoespecificoModule,
    PuntajeriesgoModule,
    CondicioncronicaModule,
    ObjetivocronicoModule,
    ControlcronicoModule,
    AdherenciacronicaModule,
    EvaluacionsaludhabitoModule,
    DetalleevaluacionsaludModule,
    PermisoaccesoModule,
    UsuarioPacienteModule,
    PeriodoModule,
    SaludmentalModule,
    MedicoregistroModule,
    InstitucionsaludModule,
    CatalogoservicioModule,
    MedicamentoraroModule,
    InstitucionservicioModule,
    InstitucionmedicamentoModule,
    InstitucionimagenModule,
    InstitucionhorarioModule,
    InstitucionespecialidadModule,
    SeguimientofisicoModule,
    ExamenclinicoModule,
    SeguimientoposteventoModule,
  ],
  exports: [
    PacienteModule,
    UsuarioModule,
    RolModule,
    PermisoModule,
    RolpermisoModule,
    UsuariorolModule,
    EspecialidadModule,
    TipovacunaModule,
    TipolesionModule,
    TipooperacionModule,
    TipodocumentoclinicoModule,
    TipocondicioncronicaModule,
    TipohabitoModule,
    ConsultamedicaModule,
    LesionModule,
    EstilovidaModule,
    VacunaModule,
    CitamedicaModule,
    RegistrodentalModule,
    OperacionModule,
    DesparasitacionModule,
    RegistromensualModule,
    EmbarazoModule,
    ControlprenatalModule,
    DocumentoclinicoModule,
    NotificacionModule,
    RecordatoriocitaModule,
    MedicacionModule,
    HorariomedicamentoModule,
    AlergiaModule,
    AntecedentefamiliarModule,
    HabitoespecificoModule,
    PuntajeriesgoModule,
    CondicioncronicaModule,
    ObjetivocronicoModule,
    ControlcronicoModule,
    AdherenciacronicaModule,
    EvaluacionsaludhabitoModule,
    DetalleevaluacionsaludModule,
    PermisoaccesoModule,
    UsuarioPacienteModule,
    PeriodoModule,
    SaludmentalModule,
    MedicoregistroModule,
    InstitucionsaludModule,
    CatalogoservicioModule,
    MedicamentoraroModule,
    InstitucionservicioModule,
    InstitucionmedicamentoModule,
    InstitucionimagenModule,
    InstitucionhorarioModule,
    InstitucionespecialidadModule,
    SeguimientofisicoModule,
    ExamenclinicoModule,
    SeguimientoposteventoModule,
  ],
})
export class GestionSaludModule {}
