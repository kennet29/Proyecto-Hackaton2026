IF COL_LENGTH('dbo.usuario', 'ciudad') IS NULL
BEGIN
  ALTER TABLE dbo.usuario
  ADD ciudad NVARCHAR(100) NULL;
END;
GO

IF COL_LENGTH('dbo.usuario', 'pais') IS NULL
BEGIN
  ALTER TABLE dbo.usuario
  ADD pais NVARCHAR(100) NULL;
END;
GO
