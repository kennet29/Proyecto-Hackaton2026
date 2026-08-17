SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.configuracionpago', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.configuracionpago (
    configuracionpagoid INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_configuracionpago PRIMARY KEY,
    banco NVARCHAR(20) NOT NULL,
    titularcuenta NVARCHAR(120) NULL,
    numerocuenta NVARCHAR(80) NULL,
    moneda NVARCHAR(10) NOT NULL CONSTRAINT DF_configuracionpago_moneda DEFAULT N'NIO',
    tipocambio DECIMAL(12,4) NULL,
    activo BIT NOT NULL CONSTRAINT DF_configuracionpago_activo DEFAULT 1,
    modificadoen DATETIME2 NULL,
    modificadopor NVARCHAR(60) NULL,
    CONSTRAINT UQ_configuracionpago_banco UNIQUE (banco),
    CONSTRAINT CK_configuracionpago_banco CHECK (banco IN (N'banpro', N'bac', N'lafise')),
    CONSTRAINT CK_configuracionpago_tipocambio CHECK (tipocambio IS NULL OR tipocambio > 0)
  );
  INSERT INTO dbo.configuracionpago (banco, moneda, activo)
  VALUES (N'banpro', N'NIO', 1), (N'bac', N'NIO', 1), (N'lafise', N'NIO', 1);
END;
