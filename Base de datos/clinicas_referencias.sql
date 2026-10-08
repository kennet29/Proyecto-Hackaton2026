/*
  Instituciones verificadas a partir de material publico de referencia.
  Script idempotente: no duplica instituciones, servicios ni asignaciones.
*/
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

SET NOCOUNT ON;

IF OBJECT_ID('dbo.institucionsalud', 'U') IS NULL
  OR OBJECT_ID('dbo.catalogoservicio', 'U') IS NULL
  OR OBJECT_ID('dbo.institucionservicio', 'U') IS NULL
BEGIN
  THROW 50001, 'El esquema del directorio de salud no esta disponible.', 1;
END;

DECLARE @Servicios TABLE (
  codigo NVARCHAR(40),
  nombre NVARCHAR(150),
  categoria NVARCHAR(80),
  descripcion NVARCHAR(500),
  requierePreparacion BIT
);

INSERT INTO @Servicios (codigo, nombre, categoria, descripcion, requierePreparacion)
VALUES
  (N'DIR-LAB-CLINICO', N'Analisis de laboratorio clinico', N'Diagnostico', N'Pruebas rutinarias, especiales y perfiles clinicos.', 1),
  (N'DIR-ODONTOLOGIA', N'Odontologia', N'Especialidad', N'Valoracion y atencion odontologica integral.', 0),
  (N'DIR-FISIOTERAPIA', N'Fisioterapia', N'Rehabilitacion', N'Recuperacion y rehabilitacion de lesiones musculoesqueleticas.', 0),
  (N'DIR-MEDICINA-ESTETICA', N'Medicina estetica', N'Especialidad', N'Procedimientos profesionales para el cuidado estetico y de la piel.', 0),
  (N'DIR-GINECOLOGIA', N'Ginecologia', N'Especialidad', N'Prevencion y atencion integral de la salud de la mujer.', 0),
  (N'DIR-ULTRASONIDO', N'Ultrasonido', N'Diagnostico', N'Estudios de imagen por ultrasonido para apoyo diagnostico.', 0),
  (N'DIR-OTORRINO', N'Otorrinolaringologia', N'Especialidad', N'Atencion especializada de oido, nariz y garganta.', 0),
  (N'DIR-ORTOPEDIA', N'Ortopedia', N'Especialidad', N'Diagnostico y tratamiento de lesiones y enfermedades musculoesqueleticas.', 0),
  (N'DIR-NUTRICION', N'Nutricion', N'Especialidad', N'Valoracion y planes de alimentacion personalizados.', 0),
  (N'DIR-MEDICINA-INTERNA', N'Medicina interna', N'Especialidad', N'Evaluacion integral y seguimiento de enfermedades del adulto.', 0),
  (N'DIR-UROLOGIA', N'Urologia', N'Especialidad', N'Prevencion, diagnostico y tratamiento de condiciones urologicas.', 0),
  (N'DIR-PSICOLOGIA', N'Psicologia', N'Salud mental', N'Atencion confidencial para el bienestar emocional y mental.', 0),
  (N'DIR-ONCOLOGIA-QUIRURGICA', N'Consulta de oncologia quirurgica', N'Oncologia', N'Diagnostico, tratamiento y seguimiento quirurgico del cancer.', 0),
  (N'DIR-CIRUGIA-GENERAL', N'Cirugia general', N'Cirugia', N'Valoracion y tratamiento quirurgico de hernias, calculos biliares y hemorroides.', 0),
  (N'DIR-CIRUGIA-LAPAROSCOPICA', N'Cirugia laparoscopica', N'Cirugia', N'Valoracion para procedimientos quirurgicos mediante tecnicas laparoscopicas.', 0),
  (N'DIR-BIOPSIA-MAMA', N'Biopsia de mama Tru-Cut', N'Diagnostico', N'Valoracion especializada para biopsia de lesiones mamarias.', 1);

INSERT INTO dbo.catalogoservicio
  (codigo, nombre, categoria, descripcion, requierepreparacion, requierereferencia, activo, creadopor)
SELECT fuente.codigo, fuente.nombre, fuente.categoria, fuente.descripcion, fuente.requierePreparacion, 0, 1, N'seed-directorio'
FROM @Servicios AS fuente
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.catalogoservicio AS existente WHERE existente.codigo = fuente.codigo
);

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Laboratorio Bioanalisis Clinico Santiago')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, sitioweb, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Laboratorio Bioanalisis Clinico Santiago', N'laboratorio', N'Laboratorio de referencia en Carazo con mas de 30 anos de experiencia, pruebas rutinarias, especiales y perfiles clinicos.', N'2532-2824 / 8539-6629', N'contacto@laboratoriosantiago.com', N'https://laboratoriosantiago.com/', N'Torreon de la UNAN, 2 cuadras al sur', N'Jinotepe', N'Carazo', N'Lunes a viernes 6:30 a. m.-5:00 p. m.; sabados 6:30 a. m.-3:00 p. m.; domingos 8:30 a. m.-11:00 a. m.', 11.850332, -86.201212, 1, N'seed-directorio');

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Clinica San Luis - Managua')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, sitioweb, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Clinica San Luis - Managua', N'clinica', N'Centro de atencion medica integral con especialidades, laboratorio clinico y servicios diagnosticos para toda la familia.', N'7874-0792 / 8420-0546 / 2533-6016', NULL, N'https://sanluisclinicamedica.com/', N'Residencial Lomas del Valle, casa 1, contiguo al Super Express', N'Managua', N'Managua', N'Lunes a sabado 8:00 a. m.-5:30 p. m.', 12.108052, -86.246750, 1, N'seed-directorio');

IF NOT EXISTS (SELECT 1 FROM dbo.institucionsalud WHERE nombre = N'Cirujano Oncologo Dr. Omar Garcia Baltodano')
  INSERT INTO dbo.institucionsalud
    (nombre, tipo, descripcion, telefono, correo, sitioweb, direccion, ciudad, departamento, horarioatencion, latitud, longitud, activo, creadopor)
  VALUES
    (N'Cirujano Oncologo Dr. Omar Garcia Baltodano', N'clinica', N'Consulta especializada en oncologia quirurgica, cirugia general y laparoscopica, diagnostico, tratamiento y seguimiento del cancer.', N'8732-6183 / 7794-5542', NULL, NULL, N'Del Pali Diriamba, 2 cuadras al norte, a mano izquierda', N'Diriamba', N'Carazo', N'Lunes a viernes 8:00 a. m.-5:00 p. m.; sabados 9:00 a. m.-12:00 p. m.; domingos cerrado', NULL, NULL, 1, N'seed-directorio');

DECLARE @LaboratorioSantiagoId INT = (
  SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Laboratorio Bioanalisis Clinico Santiago'
);
DECLARE @ClinicaSanLuisId INT = (
  SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Clinica San Luis - Managua'
);
DECLARE @DrOmarGarciaId INT = (
  SELECT TOP (1) institucionsaludid FROM dbo.institucionsalud WHERE nombre = N'Cirujano Oncologo Dr. Omar Garcia Baltodano'
);

DECLARE @Asignaciones TABLE (institucionId INT, codigoServicio NVARCHAR(40), tiempoEntrega NVARCHAR(120));
INSERT INTO @Asignaciones (institucionId, codigoServicio, tiempoEntrega)
VALUES
  (@LaboratorioSantiagoId, N'DIR-LAB-CLINICO', N'Resultados disponibles en linea y por WhatsApp'),
  (@ClinicaSanLuisId, N'CARAZO-CONSULTA-GENERAL', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-LAB-CLINICO', N'Consultar disponibilidad'),
  (@ClinicaSanLuisId, N'DIR-ODONTOLOGIA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-FISIOTERAPIA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-MEDICINA-ESTETICA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-GINECOLOGIA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-ULTRASONIDO', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-OTORRINO', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-ORTOPEDIA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-NUTRICION', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-MEDICINA-INTERNA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-UROLOGIA', N'Con cita previa'),
  (@ClinicaSanLuisId, N'DIR-PSICOLOGIA', N'Con cita previa'),
  (@DrOmarGarciaId, N'DIR-ONCOLOGIA-QUIRURGICA', N'Con cita previa'),
  (@DrOmarGarciaId, N'DIR-CIRUGIA-GENERAL', N'Con cita previa'),
  (@DrOmarGarciaId, N'DIR-CIRUGIA-LAPAROSCOPICA', N'Con cita previa'),
  (@DrOmarGarciaId, N'DIR-BIOPSIA-MAMA', N'Con cita previa');

INSERT INTO dbo.institucionservicio
  (institucionsaludid, catalogoservicioid, tiempoentrega, disponible, creadopor)
SELECT asignacion.institucionId, servicio.catalogoservicioid, asignacion.tiempoEntrega, 1, N'seed-directorio'
FROM @Asignaciones AS asignacion
INNER JOIN dbo.catalogoservicio AS servicio ON servicio.codigo = asignacion.codigoServicio
WHERE asignacion.institucionId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.institucionservicio AS existente
    WHERE existente.institucionsaludid = asignacion.institucionId
      AND existente.catalogoservicioid = servicio.catalogoservicioid
  );

GO
