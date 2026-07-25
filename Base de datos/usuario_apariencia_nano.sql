IF OBJECT_ID('dbo.usuarioapariencianano', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.usuarioapariencianano (
    usuarioaparienciananoid INT IDENTITY(1,1) NOT NULL
      CONSTRAINT PK_usuarioapariencianano PRIMARY KEY,
    usuarioid INT NOT NULL,
    aparienciaid NVARCHAR(40) NOT NULL,
    fechadesbloqueo DATETIME2(7) NOT NULL,
    seleccionada BIT NOT NULL
      CONSTRAINT DF_usuarioapariencianano_seleccionada DEFAULT ((0)),
    creadoen DATETIME2(7) NOT NULL
      CONSTRAINT DF_usuarioapariencianano_creadoen DEFAULT (SYSDATETIME()),
    modificadoen DATETIME2(7) NULL,

    CONSTRAINT FK_usuarioapariencianano_usuario
      FOREIGN KEY (usuarioid) REFERENCES dbo.usuario (usuarioid),
    CONSTRAINT UQ_usuarioapariencianano_usuario_apariencia
      UNIQUE (usuarioid, aparienciaid),
    CONSTRAINT CK_usuarioapariencianano_apariencia
      CHECK (aparienciaid IN (
        'base',
        'valentin',
        'gladiador',
        'patriota',
        'halloween',
        'navideno'
      ))
  );

  CREATE UNIQUE INDEX UX_usuarioapariencianano_seleccionada
    ON dbo.usuarioapariencianano (usuarioid)
    WHERE seleccionada = 1;
END;
