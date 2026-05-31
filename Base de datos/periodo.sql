IF OBJECT_ID('dbo.periodo', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.periodo (
    periodoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    pacienteid INT NOT NULL,
    fechainicio DATE NOT NULL,
    fechafin DATE NULL,
    duraciondias INT NULL,
    ciclodias INT NULL,
    flujo NVARCHAR(30) NULL,
    dolor NVARCHAR(100) NULL,
    sintomas NVARCHAR(MAX) NULL,
    observaciones NVARCHAR(MAX) NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_periodo_creadoen DEFAULT SYSUTCDATETIME(),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    campoprueba01 NVARCHAR(200) NULL,
    campoprueba02 NVARCHAR(200) NULL,
    campoprueba03 NVARCHAR(200) NULL,
    campoprueba04 NVARCHAR(200) NULL,
    campoprueba05 NVARCHAR(200) NULL
  );

  CREATE INDEX IX_periodo_paciente_fecha
    ON dbo.periodo (pacienteid, fechainicio DESC);
END;
