IF OBJECT_ID('dbo.usuario', 'U') IS NULL
BEGIN
  THROW 51000, 'No existe la tabla dbo.usuario.', 1;
END;

IF COL_LENGTH('dbo.usuario', 'preguntaseguridad') IS NULL
BEGIN
  IF COL_LENGTH('dbo.usuario', 'campoprueba01') IS NOT NULL
  BEGIN
    EXEC sp_rename 'dbo.usuario.campoprueba01', 'preguntaseguridad', 'COLUMN';
  END
  ELSE
  BEGIN
    ALTER TABLE dbo.usuario
      ADD preguntaseguridad NVARCHAR(200) NULL;
  END;
END;

IF COL_LENGTH('dbo.usuario', 'respuestaseguridadhash') IS NULL
BEGIN
  IF COL_LENGTH('dbo.usuario', 'campoprueba02') IS NOT NULL
  BEGIN
    EXEC sp_rename 'dbo.usuario.campoprueba02', 'respuestaseguridadhash', 'COLUMN';
  END
  ELSE
  BEGIN
    ALTER TABLE dbo.usuario
      ADD respuestaseguridadhash NVARCHAR(200) NULL;
  END;
END;
