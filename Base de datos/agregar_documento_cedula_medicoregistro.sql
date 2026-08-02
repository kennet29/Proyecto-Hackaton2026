IF OBJECT_ID('dbo.medicoregistro', 'U') IS NULL
BEGIN
  THROW 51001, 'No existe la tabla dbo.medicoregistro.', 1;
END;

IF COL_LENGTH('dbo.medicoregistro', 'documentocedula') IS NULL
  ALTER TABLE dbo.medicoregistro ADD documentocedula VARBINARY(MAX) NULL;

IF COL_LENGTH('dbo.medicoregistro', 'documentocedulanombre') IS NULL
  ALTER TABLE dbo.medicoregistro ADD documentocedulanombre NVARCHAR(260) NULL;

IF COL_LENGTH('dbo.medicoregistro', 'documentocedulamimetype') IS NULL
  ALTER TABLE dbo.medicoregistro ADD documentocedulamimetype NVARCHAR(100) NULL;
