SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.pagopremium', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.pagopremium (
    pagopremiumid INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_pagopremium PRIMARY KEY,
    usuarioid INT NOT NULL,
    banco NVARCHAR(20) NOT NULL,
    [plan] NVARCHAR(20) NOT NULL,
    comprobante VARBINARY(MAX) NOT NULL,
    nombrecomprobante NVARCHAR(260) NOT NULL,
    mimecomprobante NVARCHAR(100) NOT NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT DF_pagopremium_estado DEFAULT N'pendiente',
    observaciones NVARCHAR(400) NULL,
    suscripcionpremiumid INT NULL,
    revisadopor NVARCHAR(60) NULL,
    revisadoen DATETIME2 NULL,
    creadoen DATETIME2 NOT NULL CONSTRAINT DF_pagopremium_creadoen DEFAULT SYSDATETIME(),
    CONSTRAINT CK_pagopremium_banco CHECK (banco IN (N'banpro', N'bac', N'lafise')),
    CONSTRAINT CK_pagopremium_plan CHECK ([plan] IN (N'mensual', N'trimestral')),
    CONSTRAINT CK_pagopremium_estado CHECK (estado IN (N'pendiente', N'aprobado', N'rechazado')),
    CONSTRAINT FK_pagopremium_usuario FOREIGN KEY (usuarioid) REFERENCES dbo.usuario(usuarioid),
    CONSTRAINT FK_pagopremium_suscripcion FOREIGN KEY (suscripcionpremiumid) REFERENCES dbo.suscripcionpremium(suscripcionpremiumid)
  );
  CREATE INDEX IX_pagopremium_estado ON dbo.pagopremium (estado, creadoen DESC);
END;
