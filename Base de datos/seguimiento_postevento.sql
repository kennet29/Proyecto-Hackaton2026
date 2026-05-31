IF OBJECT_ID('dbo.seguimientopostevento', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.seguimientopostevento (
    seguimientoposteventoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pacienteid INT NOT NULL,
    tipoevento NVARCHAR(30) NOT NULL,
    operacionid INT NULL,
    lesionid INT NULL,
    tituloevento NVARCHAR(160) NOT NULL,
    fechaevento DATE NOT NULL,
    fechaseguimiento DATETIME2(7) NOT NULL CONSTRAINT DF_seguimientopostevento_fechaseguimiento DEFAULT SYSDATETIME(),
    estado NVARCHAR(40) NOT NULL CONSTRAINT DF_seguimientopostevento_estado DEFAULT N'activo',
    evolucion NVARCHAR(MAX) NULL,
    sintomas NVARCHAR(MAX) NULL,
    niveldolor INT NULL,
    medicacionactual NVARCHAR(MAX) NULL,
    cuidadoshogar NVARCHAR(MAX) NULL,
    notas NVARCHAR(MAX) NULL,
    compartirconmedico BIT NOT NULL CONSTRAINT DF_seguimientopostevento_compartir DEFAULT 1,
    requiereatencion BIT NOT NULL CONSTRAINT DF_seguimientopostevento_atencion DEFAULT 0,
    proximocontrol DATE NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_seguimientopostevento_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    campoprueba01 NVARCHAR(200) NULL,
    campoprueba02 NVARCHAR(200) NULL,
    campoprueba03 NVARCHAR(200) NULL,
    campoprueba04 NVARCHAR(200) NULL,
    campoprueba05 NVARCHAR(200) NULL,
    CONSTRAINT CK_seguimientopostevento_tipoevento CHECK (
      tipoevento IN (N'operacion', N'lesion', N'emergencia')
    ),
    CONSTRAINT CK_seguimientopostevento_estado CHECK (
      estado IN (N'activo', N'en observacion', N'cerrado')
    ),
    CONSTRAINT CK_seguimientopostevento_niveldolor CHECK (
      niveldolor IS NULL OR (niveldolor >= 0 AND niveldolor <= 10)
    )
  );

  CREATE INDEX IX_seguimientopostevento_paciente_fecha
    ON dbo.seguimientopostevento (pacienteid, fechaseguimiento DESC);
END;

IF OBJECT_ID('dbo.seguimientopostevento', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.paciente', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.seguimientopostevento')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'pacienteid'
  )
BEGIN
  ALTER TABLE dbo.seguimientopostevento WITH CHECK
    ADD CONSTRAINT FK_seguimientopostevento_paciente
    FOREIGN KEY (pacienteid) REFERENCES dbo.paciente (pacienteid)
    ON DELETE CASCADE;
END;

IF OBJECT_ID('dbo.seguimientopostevento', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.operacion', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.seguimientopostevento')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'operacionid'
  )
BEGIN
  ALTER TABLE dbo.seguimientopostevento WITH CHECK
    ADD CONSTRAINT FK_seguimientopostevento_operacion
    FOREIGN KEY (operacionid) REFERENCES dbo.operacion (operacionid)
    ON DELETE SET NULL;
END;

IF OBJECT_ID('dbo.seguimientopostevento', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.lesion', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.seguimientopostevento')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'lesionid'
  )
BEGIN
  ALTER TABLE dbo.seguimientopostevento WITH CHECK
    ADD CONSTRAINT FK_seguimientopostevento_lesion
    FOREIGN KEY (lesionid) REFERENCES dbo.lesion (lesionid)
    ON DELETE SET NULL;
END;
