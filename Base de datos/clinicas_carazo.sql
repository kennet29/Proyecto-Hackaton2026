/*
  Directorio inicial de Carazo para la landing.
  Este script es idempotente: no duplica clinicas, servicios ni asignaciones.
*/
SET NOCOUNT ON;

IF OBJECT_ID('dbo.institucionsalud', 'U') IS NULL
  OR OBJECT_ID('dbo.catalogoservicio', 'U') IS NULL
  OR OBJECT_ID('dbo.institucionservicio', 'U') IS NULL
BEGIN
  THROW 50001, 'El esquema del directorio de salud no esta disponible.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-CONSULTA-GENERAL')
  INSERT INTO dbo.catalogoservicio
    (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
  VALUES
    (N'CARAZO-CONSULTA-GENERAL', N'Consulta de medicina general', N'Consulta', N'Evaluacion medica general y orientacion preventiva.', 0, 0, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-PEDIATRIA')
  INSERT INTO dbo.catalogoservicio
    (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
  VALUES
    (N'CARAZO-PEDIATRIA', N'Pediatria y control del niño', N'Pediatria', N'Consulta pediatrica y seguimiento del crecimiento infantil.', 0, 0, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-CONTROL-PRENATAL')
  INSERT INTO dbo.catalogoservicio
    (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
  VALUES
    (N'CARAZO-CONTROL-PRENATAL', N'Control prenatal', N'Salud materna', N'Seguimiento preventivo durante el embarazo.', 0, 0, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-LABORATORIO')
  INSERT INTO dbo.catalogoservicio
    (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
  VALUES
    (N'CARAZO-LABORATORIO', N'Laboratorio clinico basico', N'Diagnostico', N'Toma de muestras y pruebas clinicas basicas.', 1, 0, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-VACUNACION')
  INSERT INTO dbo.catalogoservicio
    (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
  VALUES
    (N'CARAZO-VACUNACION', N'Vacunacion', N'Prevencion', N'Aplicacion de vacunas y orientacion sobre esquemas preventivos.', 0, 0, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Clinica NicaPrime Jinotepe')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Clinica NicaPrime Jinotepe', N'clinica', N'Atencion familiar, pediatria y diagnostico basico para la comunidad de Jinotepe.', N'+505 2532 2101', N'jinotepe@nicaprime.example', N'Zona central, contiguo al parque municipal', N'Jinotepe', N'Carazo', N'Lunes a sabado, 7:00 a. m. - 6:00 p. m.', 11.849620, -86.199030, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Clinica Familiar NicaPrime Diriamba')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Clinica Familiar NicaPrime Diriamba', N'clinica', N'Consulta general, control prenatal y vacunacion con enfoque preventivo.', N'+505 2534 1202', N'diriamba@nicaprime.example', N'Zona central, a dos cuadras del reloj publico', N'Diriamba', N'Carazo', N'Lunes a viernes, 8:00 a. m. - 5:30 p. m.', 11.858120, -86.239220, 1, N'seed-carazo');

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Clinica Comunitaria NicaPrime San Marcos')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Clinica Comunitaria NicaPrime San Marcos', N'clinica', N'Servicios de medicina general, pediatria y prevencion para familias de San Marcos.', N'+505 2535 1803', N'sanmarcos@nicaprime.example', N'Entrada principal de San Marcos, sector central', N'San Marcos', N'Carazo', N'Lunes a sabado, 8:00 a. m. - 5:00 p. m.', 11.909490, -86.203510, 1, N'seed-carazo');

DECLARE @JinotepeId INT = (SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Clinica NicaPrime Jinotepe');
DECLARE @DiriambaId INT = (SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Clinica Familiar NicaPrime Diriamba');
DECLARE @SanMarcosId INT = (SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Clinica Comunitaria NicaPrime San Marcos');
DECLARE @ConsultaId INT = (SELECT TOP (1) catalogoservicioid FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-CONSULTA-GENERAL');
DECLARE @PediatriaId INT = (SELECT TOP (1) catalogoservicioid FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-PEDIATRIA');
DECLARE @PrenatalId INT = (SELECT TOP (1) catalogoservicioid FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-CONTROL-PRENATAL');
DECLARE @LaboratorioId INT = (SELECT TOP (1) catalogoservicioid FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-LABORATORIO');
DECLARE @VacunacionId INT = (SELECT TOP (1) catalogoservicioid FROM dbo.catalogoservicio WHERE codigo = N'CARAZO-VACUNACION');

DECLARE @Asignaciones TABLE (institucionId INT, servicioId INT, tiempoEntrega NVARCHAR(120));
INSERT INTO @Asignaciones (institucionId, servicioId, tiempoEntrega)
VALUES
  (@JinotepeId, @ConsultaId, N'Atencion el mismo dia'),
  (@JinotepeId, @PediatriaId, N'Con cita previa'),
  (@JinotepeId, @LaboratorioId, N'Resultados en 24 horas'),
  (@DiriambaId, @ConsultaId, N'Atencion el mismo dia'),
  (@DiriambaId, @PrenatalId, N'Con cita previa'),
  (@DiriambaId, @VacunacionId, N'Segun disponibilidad'),
  (@SanMarcosId, @ConsultaId, N'Atencion el mismo dia'),
  (@SanMarcosId, @PediatriaId, N'Con cita previa'),
  (@SanMarcosId, @VacunacionId, N'Segun disponibilidad');

INSERT INTO dbo.institucionservicio
  (institucionsaludid, catalogoservicioid, tiempoentrega, disponible, creadopor)
SELECT asignacion.institucionId, asignacion.servicioId, asignacion.tiempoEntrega, 1, N'seed-carazo'
FROM @Asignaciones AS asignacion
WHERE asignacion.institucionId IS NOT NULL
  AND asignacion.servicioId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.institucionservicio AS existente
    WHERE existente.institucionsaludid = asignacion.institucionId
      AND existente.catalogoservicioid = asignacion.servicioId
  );

