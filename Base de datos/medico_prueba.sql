-- Medico de prueba para validar la opcion de compartir historial medico.
-- Credenciales:
--   Usuario: medico.prueba
--   Clave:   Medico123!

DECLARE @username NVARCHAR(60) = N'medico.prueba';
DECLARE @passwordHash VARBINARY(256) = CONVERT(VARBINARY(256), '$2b$10$2l8a/BZlrieSkTrqo39OlO4tuLH8ckp11qcG3uZ7JfWwIOgzXymKK');
DECLARE @usuarioId INT;
DECLARE @hasHospitalTrabajo BIT = CASE WHEN COL_LENGTH('dbo.medicoregistro', 'hospitaltrabajo') IS NULL THEN 0 ELSE 1 END;
DECLARE @hasTitulo BIT = CASE WHEN COL_LENGTH('dbo.medicoregistro', 'titulo') IS NULL THEN 0 ELSE 1 END;

IF OBJECT_ID('dbo.usuario', 'U') IS NULL
BEGIN
  THROW 51000, 'No existe la tabla dbo.usuario.', 1;
END;

IF OBJECT_ID('dbo.medicoregistro', 'U') IS NULL
BEGIN
  THROW 51001, 'No existe la tabla dbo.medicoregistro.', 1;
END;

IF EXISTS (SELECT 1 FROM dbo.usuario WHERE nombreusuario = @username)
BEGIN
  UPDATE dbo.usuario
  SET
    hashpassword = @passwordHash,
    rolprincipal = N'medico',
    activo = 1,
    ciudad = COALESCE(ciudad, N'Managua'),
    pais = COALESCE(pais, N'Nicaragua'),
    creadopor = COALESCE(creadopor, N'seed-medico-prueba'),
    modificadoen = SYSDATETIME(),
    modificadopor = N'seed-medico-prueba'
  WHERE nombreusuario = @username;
END
ELSE
BEGIN
  INSERT INTO dbo.usuario (
    nombreusuario,
    ciudad,
    pais,
    hashpassword,
    rolprincipal,
    activo,
    fechacreacion,
    creadopor,
    creadoen
  )
  VALUES (
    @username,
    N'Managua',
    N'Nicaragua',
    @passwordHash,
    N'medico',
    1,
    SYSDATETIME(),
    N'seed-medico-prueba',
    SYSDATETIME()
  );
END;

SELECT @usuarioId = usuarioid
FROM dbo.usuario
WHERE nombreusuario = @username;

IF EXISTS (SELECT 1 FROM dbo.medicoregistro WHERE usuarioid = @usuarioId)
BEGIN
  UPDATE dbo.medicoregistro
  SET
    numerolicencia = N'DEMO-2026-001',
    especialidadprincipal = N'Medicina general',
    estado = N'aprobado',
    fecharevision = SYSDATETIME(),
    observaciones = N'Medico de prueba para compartir historial medico.',
    modificadopor = N'seed-medico-prueba',
    modificadoen = SYSDATETIME()
  WHERE usuarioid = @usuarioId;

  IF @hasHospitalTrabajo = 1
  BEGIN
    EXEC sp_executesql
      N'UPDATE dbo.medicoregistro SET hospitaltrabajo = @hospital WHERE usuarioid = @usuarioId;',
      N'@hospital NVARCHAR(150), @usuarioId INT',
      @hospital = N'Hospital Demo',
      @usuarioId = @usuarioId;
  END;

  IF @hasTitulo = 1
  BEGIN
    EXEC sp_executesql
      N'UPDATE dbo.medicoregistro SET titulo = @titulo WHERE usuarioid = @usuarioId;',
      N'@titulo NVARCHAR(150), @usuarioId INT',
      @titulo = N'Dr. Usuario de Prueba',
      @usuarioId = @usuarioId;
  END;
END
ELSE
BEGIN
  IF @hasHospitalTrabajo = 1 AND @hasTitulo = 1
  BEGIN
    EXEC sp_executesql
      N'INSERT INTO dbo.medicoregistro (
          usuarioid,
          hospitaltrabajo,
          titulo,
          numerolicencia,
          especialidadprincipal,
          estado,
          fechasolicitud,
          fecharevision,
          observaciones,
          creadopor,
          creadoen
        )
        VALUES (
          @usuarioId,
          @hospital,
          @titulo,
          N''DEMO-2026-001'',
          N''Medicina general'',
          N''aprobado'',
          SYSDATETIME(),
          SYSDATETIME(),
          N''Medico de prueba para compartir historial medico.'',
          N''seed-medico-prueba'',
          SYSDATETIME()
        );',
      N'@usuarioId INT, @hospital NVARCHAR(150), @titulo NVARCHAR(150)',
      @usuarioId = @usuarioId,
      @hospital = N'Hospital Demo',
      @titulo = N'Dr. Usuario de Prueba';
  END
  ELSE
  BEGIN
    INSERT INTO dbo.medicoregistro (
      usuarioid,
      numerolicencia,
      especialidadprincipal,
      estado,
      fechasolicitud,
      fecharevision,
      observaciones,
      creadopor,
      creadoen
    )
    VALUES (
      @usuarioId,
      N'DEMO-2026-001',
      N'Medicina general',
      N'aprobado',
      SYSDATETIME(),
      SYSDATETIME(),
      N'Medico de prueba para compartir historial medico.',
      N'seed-medico-prueba',
      SYSDATETIME()
    );
  END;
END;

SELECT
  @usuarioId AS usuarioId,
  @username AS nombreusuario,
  N'Medico123!' AS password,
  N'medico' AS rolprincipal,
  N'aprobado' AS estadoMedico;
