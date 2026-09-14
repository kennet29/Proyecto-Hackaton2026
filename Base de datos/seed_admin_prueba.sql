/* Cuenta exclusiva para desarrollo y pruebas locales. */
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombreusuario = N'admin.prueba')
BEGIN
  INSERT INTO dbo.usuario (
    nombreusuario,
    hashpassword,
    rolprincipal,
    activo,
    creadopor
  )
  VALUES (
    N'admin.prueba',
    CONVERT(VARBINARY(256), '$2b$10$h6aBXEj0eXZH6WVVZWPhH.czxt2m7pxp6j8bm9tsLU7CbCoUGKIry'),
    N'admin',
    1,
    N'seed_admin_prueba'
  );
END;
GO
