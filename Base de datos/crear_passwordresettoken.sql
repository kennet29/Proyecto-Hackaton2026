IF OBJECT_ID('dbo.passwordresettoken', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.passwordresettoken (
    tokenid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    token NVARCHAR(100) NOT NULL,
    expiracion DATETIME2(7) NOT NULL,
    usado BIT NOT NULL CONSTRAINT DF_passwordresettoken_usado DEFAULT ((0)),
    usadooen DATETIME2(7) NULL,
    usuarioid INT NOT NULL,
    creadopor NVARCHAR(60) NULL,
    creadoen DATETIME2(7) NOT NULL CONSTRAINT DF_passwordresettoken_creadoen DEFAULT (SYSDATETIME()),
    modificadopor NVARCHAR(60) NULL,
    modificadoen DATETIME2(7) NULL,
    campoprueba01 NVARCHAR(200) NULL,
    campoprueba02 NVARCHAR(200) NULL,
    campoprueba03 NVARCHAR(200) NULL,
    campoprueba04 NVARCHAR(200) NULL,
    campoprueba05 NVARCHAR(200) NULL
  );

  ALTER TABLE dbo.passwordresettoken
    ADD CONSTRAINT UQ_passwordresettoken_token UNIQUE (token);

  ALTER TABLE dbo.passwordresettoken
    ADD CONSTRAINT FK_passwordresettoken_usuario
      FOREIGN KEY (usuarioid) REFERENCES dbo.usuario (usuarioid);
END;
