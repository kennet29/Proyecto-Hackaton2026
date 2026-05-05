IF OBJECT_ID('dbo.institucionsalud', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionsalud (
    institucionsaludid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nombre NVARCHAR(160) NOT NULL,
    tipo NVARCHAR(20) NOT NULL,
    descripcion NVARCHAR(500) NULL,
    telefono NVARCHAR(40) NULL,
    correo NVARCHAR(120) NULL,
    sitioweb NVARCHAR(200) NULL,
    direccion NVARCHAR(250) NULL,
    ciudad NVARCHAR(120) NULL,
    departamento NVARCHAR(120) NULL,
    horarioatencion NVARCHAR(200) NULL,
    latitud DECIMAL(10,6) NULL,
    longitud DECIMAL(10,6) NULL,
    logoimagen VARBINARY(MAX) NULL,
    logomimetype NVARCHAR(120) NULL,
    logonombrearchivo NVARCHAR(180) NULL,
    activo BIT NOT NULL CONSTRAINT DF_institucionsalud_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionsalud_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT CK_institucionsalud_tipo CHECK (tipo IN (N'clinica', N'hospital', N'laboratorio'))
  );

  CREATE INDEX IX_institucionsalud_tipo_activo
    ON dbo.institucionsalud (tipo, activo, nombre);
END;

IF OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
BEGIN
  IF COL_LENGTH('dbo.institucionsalud', 'logoimagen') IS NULL
    ALTER TABLE dbo.institucionsalud ADD logoimagen VARBINARY(MAX) NULL;

  IF COL_LENGTH('dbo.institucionsalud', 'logomimetype') IS NULL
    ALTER TABLE dbo.institucionsalud ADD logomimetype NVARCHAR(120) NULL;

  IF COL_LENGTH('dbo.institucionsalud', 'logonombrearchivo') IS NULL
    ALTER TABLE dbo.institucionsalud ADD logonombrearchivo NVARCHAR(180) NULL;
END;

IF OBJECT_ID('dbo.catalogoservicio', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.catalogoservicio (
    catalogoservicioid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    codigo NVARCHAR(40) NULL,
    nombre NVARCHAR(150) NOT NULL,
    categoria NVARCHAR(80) NULL,
    descripcion NVARCHAR(500) NULL,
    requierepreparacion BIT NOT NULL CONSTRAINT DF_catalogoservicio_requierepreparacion DEFAULT 0,
    requierereferencia BIT NOT NULL CONSTRAINT DF_catalogoservicio_requierereferencia DEFAULT 0,
    activo BIT NOT NULL CONSTRAINT DF_catalogoservicio_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_catalogoservicio_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL
  );

  CREATE UNIQUE INDEX UX_catalogoservicio_codigo
    ON dbo.catalogoservicio (codigo)
    WHERE codigo IS NOT NULL;

  CREATE INDEX IX_catalogoservicio_categoria_activo
    ON dbo.catalogoservicio (categoria, activo, nombre);
END;

IF OBJECT_ID('dbo.institucionservicio', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionservicio (
    institucionservicioid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    institucionsaludid INT NOT NULL,
    catalogoservicioid INT NOT NULL,
    precioreferencia DECIMAL(12,2) NULL,
    moneda NVARCHAR(10) NULL,
    tiempoentrega NVARCHAR(120) NULL,
    disponible BIT NOT NULL CONSTRAINT DF_institucionservicio_disponible DEFAULT 1,
    observaciones NVARCHAR(400) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionservicio_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT UQ_institucionservicio UNIQUE (institucionsaludid, catalogoservicioid)
  );

  CREATE INDEX IX_institucionservicio_institucion
    ON dbo.institucionservicio (institucionsaludid, disponible);

  CREATE INDEX IX_institucionservicio_servicio
    ON dbo.institucionservicio (catalogoservicioid, disponible);
END;

IF OBJECT_ID('dbo.medicamentoraro', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.medicamentoraro (
    medicamentoraroid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nombregenerico NVARCHAR(160) NOT NULL,
    nombrecomercial NVARCHAR(160) NULL,
    presentacion NVARCHAR(120) NULL,
    concentracion NVARCHAR(120) NULL,
    fabricante NVARCHAR(120) NULL,
    descripcion NVARCHAR(500) NULL,
    requierereceta BIT NOT NULL CONSTRAINT DF_medicamentoraro_requierereceta DEFAULT 1,
    controlado BIT NOT NULL CONSTRAINT DF_medicamentoraro_controlado DEFAULT 0,
    notasabastecimiento NVARCHAR(400) NULL,
    activo BIT NOT NULL CONSTRAINT DF_medicamentoraro_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_medicamentoraro_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL
  );

  CREATE INDEX IX_medicamentoraro_nombre_activo
    ON dbo.medicamentoraro (nombregenerico, activo);
END;

IF OBJECT_ID('dbo.institucionmedicamento', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionmedicamento (
    institucionmedicamentoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    institucionsaludid INT NOT NULL,
    medicamentoraroid INT NOT NULL,
    disponibilidad NVARCHAR(20) NOT NULL CONSTRAINT DF_institucionmedicamento_disponibilidad DEFAULT N'limitado',
    cantidadestimada INT NULL,
    precioreferencia DECIMAL(12,2) NULL,
    moneda NVARCHAR(10) NULL,
    fechaultimaactualizacion DATETIME2(7) NOT NULL CONSTRAINT DF_institucionmedicamento_fechaultimaactualizacion DEFAULT SYSDATETIME(),
    contactoabastecimiento NVARCHAR(160) NULL,
    observaciones NVARCHAR(400) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionmedicamento_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT UQ_institucionmedicamento UNIQUE (institucionsaludid, medicamentoraroid),
    CONSTRAINT CK_institucionmedicamento_disponibilidad CHECK (
      disponibilidad IN (N'disponible', N'limitado', N'agotado', N'por_encargo')
    )
  );

  CREATE INDEX IX_institucionmedicamento_institucion
    ON dbo.institucionmedicamento (institucionsaludid, disponibilidad);

  CREATE INDEX IX_institucionmedicamento_medicamento
    ON dbo.institucionmedicamento (medicamentoraroid, disponibilidad);
END;

IF OBJECT_ID('dbo.institucionimagen', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionimagen (
    institucionimagenid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    institucionsaludid INT NOT NULL,
    tipoimagen NVARCHAR(30) NOT NULL CONSTRAINT DF_institucionimagen_tipoimagen DEFAULT N'otra',
    titulo NVARCHAR(120) NULL,
    descripcion NVARCHAR(250) NULL,
    nombrearchivo NVARCHAR(180) NULL,
    mimetype NVARCHAR(120) NOT NULL,
    imagen VARBINARY(MAX) NOT NULL,
    esprincipal BIT NOT NULL CONSTRAINT DF_institucionimagen_esprincipal DEFAULT 0,
    ordenvisual INT NULL,
    activo BIT NOT NULL CONSTRAINT DF_institucionimagen_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionimagen_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT CK_institucionimagen_tipoimagen CHECK (
      tipoimagen IN (N'logo', N'fachada', N'interior', N'laboratorio', N'equipo', N'otra')
    )
  );

  CREATE INDEX IX_institucionimagen_institucion
    ON dbo.institucionimagen (institucionsaludid, activo, esprincipal, ordenvisual);
END;

IF OBJECT_ID('dbo.institucionhorario', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionhorario (
    institucionhorarioid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    institucionsaludid INT NOT NULL,
    diasemana TINYINT NOT NULL,
    horainicio TIME(0) NULL,
    horafin TIME(0) NULL,
    cerrado BIT NOT NULL CONSTRAINT DF_institucionhorario_cerrado DEFAULT 0,
    veinticuatrohoras BIT NOT NULL CONSTRAINT DF_institucionhorario_veinticuatrohoras DEFAULT 0,
    observaciones NVARCHAR(200) NULL,
    activo BIT NOT NULL CONSTRAINT DF_institucionhorario_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionhorario_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT UQ_institucionhorario UNIQUE (institucionsaludid, diasemana),
    CONSTRAINT CK_institucionhorario_diasemana CHECK (diasemana BETWEEN 1 AND 7)
  );

  CREATE INDEX IX_institucionhorario_institucion
    ON dbo.institucionhorario (institucionsaludid, activo, diasemana);
END;

IF OBJECT_ID('dbo.institucionespecialidad', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.institucionespecialidad (
    institucionespecialidadid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    institucionsaludid INT NOT NULL,
    especialidadid INT NOT NULL,
    destacada BIT NOT NULL CONSTRAINT DF_institucionespecialidad_destacada DEFAULT 0,
    observaciones NVARCHAR(200) NULL,
    activo BIT NOT NULL CONSTRAINT DF_institucionespecialidad_activo DEFAULT 1,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_institucionespecialidad_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    CONSTRAINT UQ_institucionespecialidad UNIQUE (institucionsaludid, especialidadid)
  );

  CREATE INDEX IX_institucionespecialidad_institucion
    ON dbo.institucionespecialidad (institucionsaludid, activo, destacada);

  CREATE INDEX IX_institucionespecialidad_especialidad
    ON dbo.institucionespecialidad (especialidadid, activo);
END;

IF OBJECT_ID('dbo.institucionservicio', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionservicio')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'institucionsaludid'
  )
BEGIN
  ALTER TABLE dbo.institucionservicio WITH CHECK
    ADD CONSTRAINT FK_institucionservicio_institucionsalud
    FOREIGN KEY (institucionsaludid) REFERENCES dbo.institucionsalud (institucionsaludid);
END;

IF OBJECT_ID('dbo.institucionservicio', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.catalogoservicio', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionservicio')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'catalogoservicioid'
  )
BEGIN
  ALTER TABLE dbo.institucionservicio WITH CHECK
    ADD CONSTRAINT FK_institucionservicio_catalogoservicio
    FOREIGN KEY (catalogoservicioid) REFERENCES dbo.catalogoservicio (catalogoservicioid);
END;

IF OBJECT_ID('dbo.institucionmedicamento', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionmedicamento')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'institucionsaludid'
  )
BEGIN
  ALTER TABLE dbo.institucionmedicamento WITH CHECK
    ADD CONSTRAINT FK_institucionmedicamento_institucionsalud
    FOREIGN KEY (institucionsaludid) REFERENCES dbo.institucionsalud (institucionsaludid);
END;

IF OBJECT_ID('dbo.institucionmedicamento', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.medicamentoraro', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionmedicamento')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'medicamentoraroid'
  )
BEGIN
  ALTER TABLE dbo.institucionmedicamento WITH CHECK
    ADD CONSTRAINT FK_institucionmedicamento_medicamentoraro
    FOREIGN KEY (medicamentoraroid) REFERENCES dbo.medicamentoraro (medicamentoraroid);
END;

IF OBJECT_ID('dbo.institucionimagen', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionimagen')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'institucionsaludid'
  )
BEGIN
  ALTER TABLE dbo.institucionimagen WITH CHECK
    ADD CONSTRAINT FK_institucionimagen_institucionsalud
    FOREIGN KEY (institucionsaludid) REFERENCES dbo.institucionsalud (institucionsaludid)
    ON DELETE CASCADE;
END;

IF OBJECT_ID('dbo.institucionhorario', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionhorario')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'institucionsaludid'
  )
BEGIN
  ALTER TABLE dbo.institucionhorario WITH CHECK
    ADD CONSTRAINT FK_institucionhorario_institucionsalud
    FOREIGN KEY (institucionsaludid) REFERENCES dbo.institucionsalud (institucionsaludid)
    ON DELETE CASCADE;
END;

IF OBJECT_ID('dbo.institucionespecialidad', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.institucionsalud', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionespecialidad')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'institucionsaludid'
  )
BEGIN
  ALTER TABLE dbo.institucionespecialidad WITH CHECK
    ADD CONSTRAINT FK_institucionespecialidad_institucionsalud
    FOREIGN KEY (institucionsaludid) REFERENCES dbo.institucionsalud (institucionsaludid)
    ON DELETE CASCADE;
END;

IF OBJECT_ID('dbo.institucionespecialidad', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.especialidad', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.institucionespecialidad')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'especialidadid'
  )
BEGIN
  ALTER TABLE dbo.institucionespecialidad WITH CHECK
    ADD CONSTRAINT FK_institucionespecialidad_especialidad
    FOREIGN KEY (especialidadid) REFERENCES dbo.especialidad (especialidadid);
END;
