create database gestionsalud;
go
use gestionsalud;
go


create table paciente (
    pacienteid int identity primary key,
    nombres nvarchar(100) not null,
    apellidos nvarchar(100) not null,
    fechanacimiento date null,
    sexo char(1) check (sexo in ('m','f')),
    tipodocumento nvarchar(30) null,
    numerodocumento nvarchar(50) null,
    telefono nvarchar(30) null,
    email nvarchar(120) null,
    direccion nvarchar(200) null,
    fecharegistro datetime2 not null default sysdatetime(),
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table usuario (
    usuarioid int identity primary key,
    pacienteid int null,
    nombreusuario nvarchar(60) not null unique,
    hashpassword varbinary(256) not null,
    huelladigitalhash varbinary(64) null,
    rolprincipal nvarchar(40) not null default 'paciente',
    activo bit not null default 1,
    ultimoingreso datetime2 null,
    fechacreacion datetime2 not null default sysdatetime(),
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table usuariopaciente (
    usuariopacienteid int identity primary key,
    usuarioid int not null,
    pacienteid int not null,
    parentesco nvarchar(80) null,
    esprincipal bit not null default 0,
    notas nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    foreign key (usuarioid) references usuario(usuarioid),
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ux_usuario_paciente unique (usuarioid, pacienteid)
);

create table passwordresettoken (
    tokenid int identity primary key,
    usuarioid int not null,
    token nvarchar(100) not null unique,
    expiracion datetime2 not null,
    usado bit not null default 0,
    usadooen datetime2 null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (usuarioid) references usuario(usuarioid)
);

create table tokenrevocado (
    tokenrevocadoid int identity primary key,
    jti nvarchar(128) not null unique,
    usuarioid int not null,
    expira datetime2 not null,
    motivo nvarchar(120) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    foreign key (usuarioid) references usuario(usuarioid)
);

create table permisoacceso (
    permisoid int identity primary key,
    pacienteid int not null,
    medicoid int not null,
    tipo nvarchar(20) not null check (tipo in ('temporal','permanente')),
    duracion nvarchar(5) null,
    fechainicio datetime2 not null default sysdatetime(),
    fechafin datetime2 null,
    estado nvarchar(20) not null default 'activo' check (estado in ('activo','revocado','expirado')),
    notas nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (medicoid) references usuario(usuarioid)
);

create unique index ux_permisoacceso_activo on permisoacceso(pacienteid, medicoid, estado) where estado = 'activo';


-- ========================
-- seguridad y permisos
-- ========================
create table rol (
    rolid int identity primary key,
    nombre nvarchar(80) not null unique,
    descripcion nvarchar(200) null,
    activo bit not null default 1,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table permiso (
    permisoid int identity primary key,
    codigo nvarchar(80) not null unique,
    descripcion nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table rolpermiso (
    rolid int not null,
    permisoid int not null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    primary key (rolid, permisoid),
    foreign key (rolid) references rol(rolid),
    foreign key (permisoid) references permiso(permisoid)
);

create table usuariorol (
    usuariorolid int identity primary key,
    usuarioid int not null,
    rolid int not null,
    fechaasignacion datetime2 not null default sysdatetime(),
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (usuarioid) references usuario(usuarioid),
    foreign key (rolid) references rol(rolid),
    constraint ux_usuariorol unique (usuarioid, rolid)
);

-- ========================
-- catalogos clinicos
-- ========================
create table especialidad (
    especialidadid int identity primary key,
    nombre nvarchar(120) not null unique,
    descripcion nvarchar(200) null,
    activo bit not null default 1,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipovacuna (
    tipovacunaid int identity primary key,
    nombre nvarchar(150) not null unique,
    dosisrequeridas int null,
    intervalodias int null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipolesion (
    tipolesionid int identity primary key,
    nombre nvarchar(150) not null unique,
    descripcion nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipooperacion (
    tipooperacionid int identity primary key,
    nombre nvarchar(150) not null unique,
    area nvarchar(120) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipodocumentoclinico (
    tipodocumentoid int identity primary key,
    nombre nvarchar(120) not null unique,
    descripcion nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipocondicioncronica (
    tipocondicionid int identity primary key,
    nombre nvarchar(120) not null unique,
    descripcion nvarchar(200) null,
    categoria nvarchar(80) null,
    activo bit not null default 1,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

create table tipohabito (
    tipohabitoid int identity primary key,
    nombre nvarchar(120) not null unique,
    categoria nvarchar(80) null,
    descripcion nvarchar(200) null,
    activo bit not null default 1,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null
);

-- ========================
-- modulos clinicos

create table consultamedica (
    consultaid int identity primary key,
    pacienteid int not null,
    fechaconsulta datetime2 not null,
    motivo nvarchar(200) not null,
    diagnostico nvarchar(max) null,
    tratamiento nvarchar(max) null,
    medico nvarchar(120) null,
    estado nvarchar(40) not null default 'firmada',
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ck_consulta_estado check (estado in ('borrador','firmada','anulada'))
);

create table lesion (
    lesionid int identity primary key,
    pacienteid int not null,
    tipolesionid int null,
    fechalesion date not null,
    tipo nvarchar(120) not null,
    partecuerpo nvarchar(120) null,
    severidad nvarchar(50) null,
    tratamiento nvarchar(max) null,
    recuperado bit not null default 0,
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipolesionid) references tipolesion(tipolesionid)
);

create table estilovida (
    estilovidaid int identity primary key,
    pacienteid int not null,
    fecharegistro date not null default cast(getdate() as date),
    alimentacion nvarchar(200) null,
    actividadfisica nvarchar(200) null,
    consumoalcohol nvarchar(100) null,
    consumotabaco nvarchar(100) null,
    horassueno decimal(4,2) null,
    estres nvarchar(100) null,
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table vacuna (
    vacunaid int identity primary key,
    pacienteid int not null,
    tipovacunaid int null,
    nombre nvarchar(150) not null,
    fechaaplicacion date not null,
    lote nvarchar(60) null,
    proximadosis date null,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipovacunaid) references tipovacuna(tipovacunaid)
);

create table citamedica (
    citaid int identity primary key,
    pacienteid int not null,
    especialidadid int null,
    fechacita datetime2 not null,
    especialidad nvarchar(120) null,
    motivo nvarchar(200) null,
    medico nvarchar(120) null,
    estado nvarchar(40) not null default 'programada', -- programada, completada, cancelada
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (especialidadid) references especialidad(especialidadid),
    constraint ck_cita_estado check (estado in ('programada','completada','cancelada','no asistio'))
);

create table registrodental (
    registrodentalid int identity primary key,
    pacienteid int not null,
    fechaatencion datetime2 not null,
    procedimiento nvarchar(200) not null,
    diagnostico nvarchar(200) null,
    odontologo nvarchar(120) null,
    piezastratadas nvarchar(100) null,
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table operacion (
    operacionid int identity primary key,
    pacienteid int not null,
    tipooperacionid int null,
    fechaoperacion date not null,
    tipo nvarchar(150) not null,
    hospital nvarchar(150) null,
    cirujano nvarchar(120) null,
    resultado nvarchar(max) null,
    complicaciones nvarchar(max) null,
    estado nvarchar(40) not null default 'programada',
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipooperacionid) references tipooperacion(tipooperacionid),
    constraint ck_operacion_estado check (estado in ('programada','en curso','completada','cancelada'))
);

create table desparasitacion (
    desparasitacionid int identity primary key,
    pacienteid int not null,
    fecha date not null,
    producto nvarchar(150) not null,
    dosis nvarchar(80) null,
    proximafecha date null,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table registromensual (
    registromensualid int identity primary key,
    pacienteid int not null,
    mes int check (mes between 1 and 12),
    anio int not null,
    fechainicio date not null,
    duraciondias int null,
    dolor nvarchar(100) null,
    sintomas nvarchar(max) null,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table embarazo (
    embarazoid int identity primary key,
    pacienteid int not null,
    fechainicio date not null,
    fechaprobableparto date null,
    numerocontrol int null,
    riesgo nvarchar(100) null,
    estado nvarchar(40) not null default 'activo',
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ck_embarazo_estado check (estado in ('activo','cerrado','abortado'))
);

create table controlprenatal (
    controlid int identity primary key,
    embarazoid int not null,
    fechacontrol date not null,
    semanagestacion int null,
    presionarterial nvarchar(20) null,
    peso decimal(6,2) null,
    fetalheartrate int null,
    intervenciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (embarazoid) references embarazo(embarazoid)
);

create table documentoclinico (
    documentoid int identity primary key,
    pacienteid int not null,
    tipodocumentoid int not null,
    entidadorigen nvarchar(80) not null,
    entidadid int null,
    rutaarchivo nvarchar(260) null,
    urlexterna nvarchar(300) null,
    fechadocumento date null,
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipodocumentoid) references tipodocumentoclinico(tipodocumentoid),
    constraint ck_documento_origen check (entidadorigen in ('consultamedica','lesion','operacion','citamedica','vacuna','general'))
);

create table notificacion (
    notificacionid int identity primary key,
    pacienteid int not null,
    tipo nvarchar(80) not null,
    mensaje nvarchar(300) not null,
    fechaprogramada datetime2 not null,
    enviada bit not null default 0,
    medio nvarchar(50) null,
    entidadorigen nvarchar(80) null,
    entidadid int null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table alergia (
    alergiaid int identity primary key,
    pacienteid int not null,
    tipo nvarchar(120) not null,
    desencadenante nvarchar(200) null,
    severidad nvarchar(50) null,
    reaccion nvarchar(max) null,
    tratamiento nvarchar(max) null,
    fechadiagnostico date null,
    estado nvarchar(40) not null default 'activa',
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ck_alergia_estado check (estado in ('activa','inactiva'))
);

create table antecedentefamiliar (
    antecedenteid int identity primary key,
    pacienteid int not null,
    parentesco nvarchar(80) not null,
    condicion nvarchar(150) not null,
    estado nvarchar(50) null,
    edaddiagnostico int null,
    observaciones nvarchar(max) null,
    fecharegistro datetime2 not null default sysdatetime(),
    confirmado bit not null default 0,
    fuente nvarchar(100) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table habitoespecifico (
    habitoid int identity primary key,
    pacienteid int not null,
    tipohabitoid int not null,
    categoria nvarchar(80) null,
    nivel nvarchar(80) null,
    frecuencia nvarchar(100) null,
    cantidad decimal(10,2) null,
    unidad nvarchar(30) null,
    inicio date null,
    fin date null,
    impactosalud nvarchar(150) null,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipohabitoid) references tipohabito(tipohabitoid)
);

create table puntajeriesgo (
    puntajeriesgoid int identity primary key,
    pacienteid int not null,
    consultaid int null,
    tipo nvarchar(120) not null, -- imc, escala de dolor, etc.
    valordecimal decimal(10,2) null,
    valortexto nvarchar(100) null,
    unidad nvarchar(40) null,
    rangoreferencia nvarchar(80) null,
    clasificacion nvarchar(80) null,
    fechamedicion datetime2 not null default sysdatetime(),
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (consultaid) references consultamedica(consultaid)
);

create table condicioncronica (
    condicioncronicaid int identity primary key,
    pacienteid int not null,
    tipocondicionid int not null,
    fechadiagnostico date null,
    estado nvarchar(40) not null default 'activa',
    severidad nvarchar(40) null,
    tratamientoprincipal nvarchar(200) null,
    proveedorlider nvarchar(120) null,
    proximoseguimiento date null,
    notas nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (tipocondicionid) references tipocondicioncronica(tipocondicionid),
    constraint ck_condicioncronica_estado check (estado in ('activa','remision','resuelta'))
);

create table objetivocronico (
    objetivocronicoid int identity primary key,
    condicioncronicaid int not null,
    descripcion nvarchar(200) not null,
    indicador nvarchar(120) null,
    valormeta decimal(10,2) null,
    unidad nvarchar(40) null,
    fechalimite date null,
    estado nvarchar(40) not null default 'pendiente',
    cumplido bit not null default 0,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (condicioncronicaid) references condicioncronica(condicioncronicaid),
    constraint ck_objetivocronico_estado check (estado in ('pendiente','en progreso','logrado','cancelado'))
);

create table controlcronico (
    controlcronicoid int identity primary key,
    condicioncronicaid int not null,
    fechacontrol datetime2 not null,
    indicador nvarchar(120) null,
    valor decimal(10,2) null,
    unidad nvarchar(40) null,
    resultado nvarchar(150) null,
    conclusiones nvarchar(max) null,
    proximocontrol date null,
    medico nvarchar(120) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (condicioncronicaid) references condicioncronica(condicioncronicaid)
);

-- medicacion prescrita para gestionar horarios
create table medicacion (
    medicacionid int identity primary key,
    pacienteid int not null,
    consultaid int null,
    nombremedicamento nvarchar(150) not null,
    presentacion nvarchar(100) null,
    dosis nvarchar(80) null,
    viaadministracion nvarchar(60) null,
    indicaciones nvarchar(max) null,
    fechainicio date not null,
    fechafin date null,
    medicacionactiva bit not null default 1,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid),
    foreign key (consultaid) references consultamedica(consultaid),
    constraint ck_medicacion_fechas check (fechafin is null or fechafin >= fechainicio)
);

create table horariomedicamento (
    horariomedicamentoid int identity primary key,
    medicacionid int not null,
    horaprogramada time not null,
    frecuencia nvarchar(80) null,
    diasemana tinyint null check (diasemana between 1 and 7),
    generarecordatorio bit not null default 1,
    proximaalarma datetime2 null,
    estadorecordatorio nvarchar(30) not null default 'pendiente',
    ultimoenvio datetime2 null,
    observaciones nvarchar(300) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (medicacionid) references medicacion(medicacionid),
    constraint ck_horariomedicamento_estado check (estadorecordatorio in ('pendiente','programado','enviado','snoozed','cancelado'))
);

create table adherenciacronica (
    adherenciacronicaid int identity primary key,
    condicioncronicaid int not null,
    medicacionid int null,
    fechaevento datetime2 not null default sysdatetime(),
    tipo nvarchar(60) not null default 'medicacion',
    porcentaje decimal(5,2) null,
    estado nvarchar(40) null,
    descripcion nvarchar(200) null,
    observaciones nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (condicioncronicaid) references condicioncronica(condicioncronicaid),
    foreign key (medicacionid) references medicacion(medicacionid),
    constraint ck_adherenciacronica_tipo check (tipo in ('medicacion','estilo de vida','autocontrol')),
    constraint ck_adherenciacronica_estado check (estado is null or estado in ('completo','parcial','omitido'))
);


-- recordatorios especificos de citas medicas
create table recordatoriocita (
    recordatoriocitaid int identity primary key,
    citaid int not null,
    pacienteid int not null,
    fecharecordatorio datetime2 not null,
    mensaje nvarchar(300) not null,
    canal nvarchar(50) null,
    estado nvarchar(30) not null default 'pendiente',
    intentos int not null default 0,
    ultimointento datetime2 null,
    proximaejecucion datetime2 null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (citaid) references citamedica(citaid),
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ck_recordatoriocita_estado check (estado in ('pendiente','programado','enviado','cancelado'))
);

go

create or alter view vw_resumen_paciente as
select
    p.pacienteid,
    p.nombres,
    p.apellidos,
    isnull(cm.total_consultas, 0) as total_consultas,
    cm.ultima_consulta,
    isnull(ci.citas_pendientes, 0) as citas_pendientes,
    isnull(vac.vacunas_aplicadas, 0) as vacunas_aplicadas,
    isnull(med.medicaciones_activas, 0) as medicaciones_activas,
    isnull(rc.recordatorios_pendientes, 0) as recordatorios_pendientes,
    isnull(al.alergias_activas, 0) as alergias_activas,
    isnull(cc.condiciones_activas, 0) as condiciones_activas
from paciente p
left join (
    select pacienteid, count(*) as total_consultas, max(fechaconsulta) as ultima_consulta
    from consultamedica
    group by pacienteid
) cm on cm.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as citas_pendientes
    from citamedica
    where estado in ('programada', 'no asistio')
    group by pacienteid
) ci on ci.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as vacunas_aplicadas
    from vacuna
    group by pacienteid
) vac on vac.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as medicaciones_activas
    from medicacion
    where medicacionactiva = 1
    group by pacienteid
) med on med.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as recordatorios_pendientes
    from recordatoriocita
    where estado in ('pendiente', 'programado')
    group by pacienteid
) rc on rc.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as alergias_activas
    from alergia
    where estado = 'activa'
    group by pacienteid
) al on al.pacienteid = p.pacienteid
left join (
    select pacienteid, count(*) as condiciones_activas
    from condicioncronica
    where estado = 'activa'
    group by pacienteid
) cc on cc.pacienteid = p.pacienteid;

go

-- ============
-- usuarios root iniciales
-- ============
if not exists (select 1 from usuario where nombreusuario = 'kenneth')
begin
    insert into usuario (nombreusuario, hashpassword, rolprincipal, activo, creadopor)
    values (
        'kenneth',
        convert(varbinary(256), '$2b$10$3tFBTcFsiKmLenrXydUkPeCzsNKQsIRIOaWr3SG0oXOi2/IjZGy.y'),
        'admin',
        1,
        'seed'
    );
end;

if not exists (select 1 from usuario where nombreusuario = 'connie')
begin
    insert into usuario (nombreusuario, hashpassword, rolprincipal, activo, creadopor)
    values (
        'connie',
        convert(varbinary(256), '$2b$10$Jm2kIdOJlWNNxlgPHJn.FOPrs2ETzU6tGDhEV1WpETBFONfMgeFqa'),
        'admin',
        1,
        'seed'
    );
end;

create table evaluacionsaludhabito (
    evaluacionid int identity primary key,
    pacienteid int not null,
    fecha datetime2 not null default sysdatetime(),
    puntaje decimal(5,2) not null,
    categoria nvarchar(80) null,
    resumen nvarchar(200) null,
    detalle nvarchar(max) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (pacienteid) references paciente(pacienteid)
);

create table detalleevaluacionsalud (
    detalleid int identity primary key,
    evaluacionid int not null,
    habitoid int null,
    componente nvarchar(80) null,
    peso decimal(5,2) null,
    comentario nvarchar(200) null,
    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,
    foreign key (evaluacionid) references evaluacionsaludhabito(evaluacionid),
    foreign key (habitoid) references habitoespecifico(habitoid)
);
c r e a t e   t a b l e   i n d i c e h a b i t o   ( 
         i n d i c e i d   i n t   i d e n t i t y   p r i m a r y   k e y , 
         p a c i e n t e i d   i n t   n o t   n u l l , 
         f e c h a   d a t e t i m e 2   n o t   n u l l   d e f a u l t   s y s d a t e t i m e ( ) , 
         p u n t a j e   d e c i m a l ( 5 , 2 )   n o t   n u l l , 
         c a t e g o r i a   n v a r c h a r ( 8 0 )   n u l l , 
         d e s c r i p c i o n   n v a r c h a r ( 2 0 0 )   n u l l , 
         d e t a l l e   n v a r c h a r ( m a x )   n u l l , 
         c r e a d o p o r   n v a r c h a r ( 6 0 )   n u l l , 
         c r e a d o e n   d a t e t i m e 2   n o t   n u l l   d e f a u l t   s y s d a t e t i m e ( ) , 
         m o d i f i c a d o p o r   n v a r c h a r ( 6 0 )   n u l l , 
         m o d i f i c a d o e n   d a t e t i m e 2   n u l l , 
         c a m p o p r u e b a 0 1   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 2   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 3   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 4   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 5   n v a r c h a r ( 2 0 0 )   n u l l , 
         f o r e i g n   k e y   ( p a c i e n t e i d )   r e f e r e n c e s   p a c i e n t e ( p a c i e n t e i d ) 
 ) ; 
 
 c r e a t e   t a b l e   d e t a l l e i n d i c e h a b i t o   ( 
         d e t a l l e i d   i n t   i d e n t i t y   p r i m a r y   k e y , 
         i n d i c e i d   i n t   n o t   n u l l , 
         h a b i t o i d   i n t   n u l l , 
         t i p o   n v a r c h a r ( 8 0 )   n u l l , 
         f a c t o r   d e c i m a l ( 5 , 2 )   n u l l , 
         c o m e n t a r i o   n v a r c h a r ( 2 0 0 )   n u l l , 
         c r e a d o p o r   n v a r c h a r ( 6 0 )   n u l l , 
         c r e a d o e n   d a t e t i m e 2   n o t   n u l l   d e f a u l t   s y s d a t e t i m e ( ) , 
         m o d i f i c a d o p o r   n v a r c h a r ( 6 0 )   n u l l , 
         m o d i f i c a d o e n   d a t e t i m e 2   n u l l , 
         c a m p o p r u e b a 0 1   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 2   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 3   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 4   n v a r c h a r ( 2 0 0 )   n u l l , 
         c a m p o p r u e b a 0 5   n v a r c h a r ( 2 0 0 )   n u l l , 
         f o r e i g n   k e y   ( i n d i c e i d )   r e f e r e n c e s   i n d i c e h a b i t o ( i n d i c e i d ) , 
         f o r e i g n   k e y   ( h a b i t o i d )   r e f e r e n c e s   h a b i t o e s p e c i f i c o ( h a b i t o i d ) 
 ) ;  
 
