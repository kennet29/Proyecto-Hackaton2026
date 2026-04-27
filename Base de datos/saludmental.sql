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
