IF OBJECT_ID(N'dbo.dispositivopush', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.dispositivopush (
    dispositivopushid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuarioid INT NOT NULL,
    expopushtoken NVARCHAR(255) NOT NULL UNIQUE,
    plataforma NVARCHAR(20) NOT NULL,
    activo BIT NOT NULL CONSTRAINT DF_dispositivopush_activo DEFAULT 1,
    creadoen DATETIME2 NOT NULL CONSTRAINT DF_dispositivopush_creadoen DEFAULT SYSDATETIME(),
    actualizadoen DATETIME2 NOT NULL CONSTRAINT DF_dispositivopush_actualizadoen DEFAULT SYSDATETIME()
  );
  CREATE INDEX IX_dispositivopush_usuario_activo ON dbo.dispositivopush(usuarioid, activo);
END;
