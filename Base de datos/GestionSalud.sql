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
    foreign key (pacienteid) references paciente(pacienteid),
    constraint ck_regmensual_sexo check (
        exists (
            select 1 from paciente p
            where p.pacienteid = registromensual.pacienteid and p.sexo = 'f'
        )
    )
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
    constraint ck_embarazo_sexo check (
        exists (
            select 1 from paciente p
            where p.pacienteid = embarazo.pacienteid and p.sexo = 'f'
        )
    ),
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
