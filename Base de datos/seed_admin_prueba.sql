/* Cuenta exclusiva para desarrollo y pruebas locales. */
-- Credenciales:
--   Usuario: admin.prueba
--   Clave:   Password123!

DECLARE @username NVARCHAR(60) = N'admin.prueba';
DECLARE @passwordHash VARBINARY(256) = CONVERT(VARBINARY(256), '$2b$10$YvM/k6xopDkIpIFaZbB2sewuKZuhNzu.qmCPsvMwIxuhPvn/kko/.');

IF EXISTS (SELECT 1 FROM dbo.usuario WHERE nombreusuario = @username)
BEGIN
  UPDATE dbo.usuario
  SET
    hashpassword = @passwordHash,
    rolprincipal = N'admin',
    activo = 1,
    modificadoen = SYSDATETIME(),
    modificadopor = N'seed_admin_prueba'
  WHERE nombreusuario = @username;
END
ELSE
BEGIN
  INSERT INTO dbo.usuario (
    nombreusuario,
    hashpassword,
    rolprincipal,
    activo,
    creadopor,
    creadoen
  )
  VALUES (
    @username,
    @passwordHash,
    N'admin',
    1,
    N'seed_admin_prueba',
    SYSDATETIME()
  );
END;
GO

 