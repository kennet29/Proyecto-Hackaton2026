use gestionsalud;
go

create table nutricioncomida (
    nutricioncomidaid int identity primary key,
    pacienteid int not null,
    consultaid int null,
    fechaanalisis date not null,
    fecharegistro datetime2 not null default sysdatetime(),
    objetivo nvarchar(80) null,
    origen nvarchar(40) not null default 'nano',
    nombredelplatillo nvarchar(160) null,
    alimentosdetectados nvarchar(max) null,
    observacionesia nvarchar(max) null,

    calorias decimal(10,2) null,
    carbohidratosg decimal(10,2) null,
    proteinasg decimal(10,2) null,
    grasasg decimal(10,2) null,
    fibrag decimal(10,2) null,
    azucarg decimal(10,2) null,
    sodiomg decimal(10,2) null,

    porc_carbohidratos decimal(5,2) null,
    porc_proteinas decimal(5,2) null,
    porc_grasas decimal(5,2) null,
    porc_fibra decimal(5,2) null,

    vitaminaa_ug decimal(10,2) null,
    vitaminac_mg decimal(10,2) null,
    vitaminad_ug decimal(10,2) null,
    vitaminab12_ug decimal(10,2) null,
    calcio_mg decimal(10,2) null,
    hierro_mg decimal(10,2) null,
    potasio_mg decimal(10,2) null,
    magnesio_mg decimal(10,2) null,
    zinc_mg decimal(10,2) null,

    creadopor nvarchar(60) null,
    creadoen datetime2 not null default sysdatetime(),
    modificadopor nvarchar(60) null,
    modificadoen datetime2 null,
    campoprueba01 nvarchar(200) null,
    campoprueba02 nvarchar(200) null,
    campoprueba03 nvarchar(200) null,
    campoprueba04 nvarchar(200) null,
    campoprueba05 nvarchar(200) null,

    constraint fk_nutricioncomida_paciente
        foreign key (pacienteid) references paciente(pacienteid),
    constraint fk_nutricioncomida_consulta
        foreign key (consultaid) references consultamedica(consultaid)
);
go

create index ix_nutricioncomida_paciente_fecha
    on nutricioncomida(pacienteid, fechaanalisis desc);
go

create index ix_nutricioncomida_consulta
    on nutricioncomida(consultaid)
    where consultaid is not null;
go

create unique index ux_nutricioncomida_paciente_consulta_fecha
    on nutricioncomida(pacienteid, consultaid, fechaanalisis, origen);
go
