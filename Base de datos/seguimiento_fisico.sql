IF OBJECT_ID('dbo.seguimientofisico', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.seguimientofisico (
    seguimientofisicoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pacienteid INT NOT NULL,
    fecha DATE NOT NULL,
    peso DECIMAL(6,2) NULL,
    minutosejercicio INT NULL,
    tipoejercicio NVARCHAR(120) NULL,
    intensidad NVARCHAR(30) NULL,
    pasos INT NULL,
    caloriasquemadas INT NULL,
    distanciakm DECIMAL(6,2) NULL,
    notas NVARCHAR(MAX) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_seguimientofisico_creadoen DEFAULT SYSDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    campoprueba01 NVARCHAR(200) NULL,
    campoprueba02 NVARCHAR(200) NULL,
    campoprueba03 NVARCHAR(200) NULL,
    campoprueba04 NVARCHAR(200) NULL,
    campoprueba05 NVARCHAR(200) NULL,
    CONSTRAINT UQ_seguimientofisico_paciente_fecha UNIQUE (pacienteid, fecha),
    CONSTRAINT CK_seguimientofisico_intensidad CHECK (
      intensidad IS NULL OR intensidad IN (N'leve', N'moderada', N'intensa')
    )
  );

  CREATE INDEX IX_seguimientofisico_paciente_fecha
    ON dbo.seguimientofisico (pacienteid, fecha DESC);
END;

IF OBJECT_ID('dbo.seguimientofisico', 'U') IS NOT NULL
  AND OBJECT_ID('dbo.paciente', 'U') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys.foreign_key_columns AS fkc
    WHERE fkc.parent_object_id = OBJECT_ID('dbo.seguimientofisico')
      AND COL_NAME(fkc.parent_object_id, fkc.parent_column_id) = 'pacienteid'
  )
BEGIN
  ALTER TABLE dbo.seguimientofisico WITH CHECK
    ADD CONSTRAINT FK_seguimientofisico_paciente
    FOREIGN KEY (pacienteid) REFERENCES dbo.paciente (pacienteid)
    ON DELETE CASCADE;
END;
