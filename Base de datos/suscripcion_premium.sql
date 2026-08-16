/* Suscripciones Premium asignadas por administración. */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.suscripcionpremium', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.suscripcionpremium (
    suscripcionpremiumid INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_suscripcionpremium PRIMARY KEY,
    usuarioid INT NOT NULL,
    token NVARCHAR(80) NOT NULL,
    [plan] NVARCHAR(20) NOT NULL,
    fechainicio DATETIME2 NOT NULL CONSTRAINT DF_suscripcionpremium_fechainicio DEFAULT SYSDATETIME(),
    fechavencimiento DATETIME2 NOT NULL,
    activo BIT NOT NULL CONSTRAINT DF_suscripcionpremium_activo DEFAULT 1,
    asignadopor NVARCHAR(60) NULL,
    creadoen DATETIME2 NOT NULL CONSTRAINT DF_suscripcionpremium_creadoen DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_suscripcionpremium_token UNIQUE (token),
    CONSTRAINT CK_suscripcionpremium_plan CHECK ([plan] IN (N'mensual', N'trimestral')),
    CONSTRAINT CK_suscripcionpremium_fechas CHECK (fechavencimiento > fechainicio),
    CONSTRAINT FK_suscripcionpremium_usuario FOREIGN KEY (usuarioid) REFERENCES dbo.usuario(usuarioid)
  );
  CREATE INDEX IX_suscripcionpremium_usuario_vigencia
    ON dbo.suscripcionpremium (usuarioid, activo, fechavencimiento DESC);
END;
