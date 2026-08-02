IF OBJECT_ID('dbo.saludmental', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.saludmental (
    saludmentalid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pacienteid INT NOT NULL,
    fecha DATE NOT NULL,
    estadoanimo INT NOT NULL,
    estres INT NOT NULL,
    ansiedad INT NOT NULL,
    horassueno DECIMAL(4,2) NULL,
    notapersonal NVARCHAR(MAX) NULL,
    ejerciciominutos INT NULL,
    hidratacionlitros DECIMAL(4,2) NULL,
    descansohoras DECIMAL(4,2) NULL,
    tiemposocialminutos INT NULL,
    pausasdigitales INT NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_saludmental_creadoen DEFAULT SYSUTCDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    campoprueba01 NVARCHAR(200) NULL,
    campoprueba02 NVARCHAR(200) NULL,
    campoprueba03 NVARCHAR(200) NULL,
    campoprueba04 NVARCHAR(200) NULL,
    campoprueba05 NVARCHAR(200) NULL
  );

  CREATE INDEX IX_saludmental_paciente_fecha
    ON dbo.saludmental (pacienteid, fecha DESC);
END;

IF OBJECT_ID('dbo.medicoregistro', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.medicoregistro (
    medicoregistroid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuarioid INT NOT NULL,
    hospitaltrabajo NVARCHAR(150) NOT NULL,
    titulo NVARCHAR(150) NOT NULL,
    codigominsa NVARCHAR(40) NULL,
    numerolicencia NVARCHAR(80) NOT NULL,
    entidadcertificadora NVARCHAR(120) NULL,
    especialidadprincipal NVARCHAR(120) NULL,
    documentorespaldo NVARCHAR(260) NULL,
    fotocodigominsa VARBINARY(MAX) NULL,
    fototitulo VARBINARY(MAX) NULL,
    documentocedula VARBINARY(MAX) NULL,
    documentocedulanombre NVARCHAR(260) NULL,
    documentocedulamimetype NVARCHAR(100) NULL,
    estado NVARCHAR(30) NOT NULL CONSTRAINT DF_medicoregistro_estado DEFAULT N'pendiente',
    fechasolicitud DATETIME2(7) NOT NULL CONSTRAINT DF_medicoregistro_fechasolicitud DEFAULT SYSDATETIME(),
    fecharevision DATETIME2(7) NULL,
    observaciones NVARCHAR(400) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_medicoregistro_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT UQ_medicoregistro_usuario UNIQUE (usuarioid),
    CONSTRAINT CK_medicoregistro_estado CHECK (estado IN (N'pendiente', N'aprobado', N'rechazado'))
  );
END;

IF OBJECT_ID('dbo.medicoregistro', 'U') IS NOT NULL
BEGIN
  IF COL_LENGTH('dbo.medicoregistro', 'hospitaltrabajo') IS NULL
    ALTER TABLE dbo.medicoregistro ADD hospitaltrabajo NVARCHAR(150) NULL;

  IF COL_LENGTH('dbo.medicoregistro', 'titulo') IS NULL
    ALTER TABLE dbo.medicoregistro ADD titulo NVARCHAR(150) NULL;

  IF COL_LENGTH('dbo.medicoregistro', 'documentocedula') IS NULL
    ALTER TABLE dbo.medicoregistro ADD documentocedula VARBINARY(MAX) NULL;

  IF COL_LENGTH('dbo.medicoregistro', 'documentocedulanombre') IS NULL
    ALTER TABLE dbo.medicoregistro ADD documentocedulanombre NVARCHAR(260) NULL;

  IF COL_LENGTH('dbo.medicoregistro', 'documentocedulamimetype') IS NULL
    ALTER TABLE dbo.medicoregistro ADD documentocedulamimetype NVARCHAR(100) NULL;
END;

IF OBJECT_ID('dbo.medicoregistro', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.usuario', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.medicoregistro')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'usuarioid'
  )
BEGIN
  ALTER TABLE dbo.medicoregistro WITH CHECK
    ADD CONSTRAINT FK_medicoregistro_usuario
    FOREIGN KEY (usuarioid) REFERENCES dbo.usuario (usuarioid);
END;

IF OBJECT_ID('dbo.permisoacceso', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.permisoacceso (
    permisoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pacienteid INT NOT NULL,
    medicoid INT NOT NULL,
    tipo NVARCHAR(20) NOT NULL,
    duracion NVARCHAR(5) NULL,
    fechainicio DATETIME2(7) NOT NULL CONSTRAINT DF_permisoacceso_fechainicio DEFAULT SYSDATETIME(),
    fechafin DATETIME2(7) NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT DF_permisoacceso_estado DEFAULT N'activo',
    notas NVARCHAR(200) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_permisoacceso_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT CK_permisoacceso_tipo CHECK (tipo IN (N'temporal', N'permanente')),
    CONSTRAINT CK_permisoacceso_estado CHECK (estado IN (N'activo', N'revocado', N'expirado'))
  );
END;

IF OBJECT_ID('dbo.permisoacceso', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_permisoacceso_activo'
      AND object_id = OBJECT_ID('dbo.permisoacceso')
  )
BEGIN
  CREATE UNIQUE INDEX UX_permisoacceso_activo
    ON dbo.permisoacceso (pacienteid, medicoid, estado)
    WHERE estado = N'activo';
END;

IF OBJECT_ID('dbo.permisoacceso', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.paciente', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.permisoacceso')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'pacienteid'
  )
BEGIN
  ALTER TABLE dbo.permisoacceso WITH CHECK
    ADD CONSTRAINT FK_permisoacceso_paciente
    FOREIGN KEY (pacienteid) REFERENCES dbo.paciente (pacienteid);
END;

IF OBJECT_ID('dbo.permisoacceso', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.usuario', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.permisoacceso')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'medicoid'
  )
BEGIN
  ALTER TABLE dbo.permisoacceso WITH CHECK
    ADD CONSTRAINT FK_permisoacceso_medico
    FOREIGN KEY (medicoid) REFERENCES dbo.usuario (usuarioid);
END;

IF OBJECT_ID('dbo.permisoacceso_token', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.permisoacceso_token (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_permisoacceso_token_id DEFAULT NEWID() PRIMARY KEY,
    token NVARCHAR(128) NOT NULL UNIQUE,
    permisoid INT NOT NULL,
    expiraen DATETIME2(7) NOT NULL,
    usado BIT NOT NULL CONSTRAINT DF_permisoacceso_token_usado DEFAULT 0,
    usadopor INT NULL,
    usadoen DATETIME2(7) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_permisoacceso_token_creadoen DEFAULT SYSDATETIME(),
    modificadoen DATETIME2(7) NULL
  );
END;

IF OBJECT_ID('dbo.permisoacceso_token', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.permisoacceso', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.permisoacceso_token')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'permisoid'
  )
BEGIN
  ALTER TABLE dbo.permisoacceso_token WITH CHECK
    ADD CONSTRAINT FK_permisoacceso_token_permiso
    FOREIGN KEY (permisoid) REFERENCES dbo.permisoacceso (permisoid)
    ON DELETE CASCADE;
END;
