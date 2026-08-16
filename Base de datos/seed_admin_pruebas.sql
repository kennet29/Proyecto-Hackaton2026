/* Datos completamente ficticios para pruebas de admin.hckt.2026. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @usuarioId INT = (SELECT usuarioid FROM dbo.usuario WHERE nombreusuario = N'admin.hckt.2026');
DECLARE @pacienteId INT;
DECLARE @consultaId INT;
DECLARE @condicionId INT;
DECLARE @operacionId INT;
DECLARE @lesionId INT;

IF @usuarioId IS NULL
  THROW 51000, 'No existe admin.hckt.2026.', 1;

INSERT INTO dbo.paciente (
  nombres, apellidos, fechanacimiento, sexo, tipodocumento, numerodocumento,
  telefono, email, direccion, fecharegistro, creadopor, creadoen,
  campoprueba01, campoprueba02, campoprueba03, campoprueba04, campoprueba05
)
VALUES (
  N'Valeria', N'Demo Pruebas', '1991-04-18', 'f', N'Cédula demo', N'DEMO-ADMIN-2026',
  N'8888-0000', N'valeria.demo@ejemplo.test', N'Managua, Nicaragua', SYSDATETIME(), N'seed-admin-pruebas', SYSDATETIME(),
  N'Dato ficticio 01', N'Dato ficticio 02', N'Dato ficticio 03', N'Dato ficticio 04', N'Dato ficticio 05'
);
SET @pacienteId = SCOPE_IDENTITY();

UPDATE dbo.usuario
SET pacienteid = @pacienteId, modificadoen = SYSDATETIME(), modificadopor = N'seed-admin-pruebas'
WHERE usuarioid = @usuarioId;

INSERT INTO dbo.usuariopaciente (usuarioid, pacienteid, parentesco, esprincipal, notas, creadopor, creadoen)
VALUES (@usuarioId, @pacienteId, N'Propietaria', 1, N'Expediente ficticio para pruebas.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.alergia (pacienteid, tipo, desencadenante, severidad, reaccion, tratamiento, fechadiagnostico, estado, observaciones, creadopor, creadoen, campoprueba01, campoprueba02, campoprueba03, campoprueba04, campoprueba05)
VALUES
(@pacienteId, N'Medicamento', N'Penicilina', N'Alta', N'Urticaria y dificultad respiratoria', N'Evitar penicilinas; evaluar alternativa', '2010-05-12', N'activa', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME(), N'Prueba 1', N'Prueba 2', N'Prueba 3', N'Prueba 4', N'Prueba 5'),
(@pacienteId, N'Alimento', N'Maní', N'Moderada', N'Inflamación labial', N'Antihistamínico según indicación médica', '2015-09-03', N'activa', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME(), N'Prueba 1', N'Prueba 2', N'Prueba 3', N'Prueba 4', N'Prueba 5'),
(@pacienteId, N'Ambiental', N'Polen', N'Leve', N'Estornudos y lagrimeo', N'Lavados nasales', '2018-02-20', N'activa', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME(), N'Prueba 1', N'Prueba 2', N'Prueba 3', N'Prueba 4', N'Prueba 5');

INSERT INTO dbo.antecedentefamiliar (pacienteid, parentesco, condicion, estado, edaddiagnostico, observaciones, fecharegistro, confirmado, fuente, creadopor, creadoen)
VALUES
(@pacienteId, N'Madre', N'Hipertensión arterial', N'Activa', 52, N'Dato ficticio.', SYSDATETIME(), 1, N'Entrevista', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Padre', N'Diabetes tipo 2', N'Activa', 57, N'Dato ficticio.', SYSDATETIME(), 1, N'Entrevista', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Abuela materna', N'Osteoporosis', N'Activa', 68, N'Dato ficticio.', SYSDATETIME(), 1, N'Entrevista', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Hermano', N'Asma', N'Controlada', 12, N'Dato ficticio.', SYSDATETIME(), 1, N'Entrevista', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.citamedica (pacienteid, fechacita, especialidad, motivo, medico, estado, notas, creadopor, creadoen)
VALUES
(@pacienteId, '2026-09-02T09:00:00', N'Medicina general', N'Chequeo anual', N'Dra. Sofía López', N'programada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-09-10T14:30:00', N'Odontología', N'Limpieza dental', N'Dr. Marco Ruiz', N'programada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-09-18T10:15:00', N'Nutrición', N'Plan alimenticio', N'Lic. Elena Castro', N'programada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-10-06T08:45:00', N'Ginecología', N'Control preventivo', N'Dra. Andrea Mena', N'programada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.consultamedica (pacienteid, fechaconsulta, motivo, diagnostico, tratamiento, medico, estado, notas, creadopor, creadoen)
VALUES (@pacienteId, '2026-07-15T10:00:00', N'Cefalea ocasional', N'Cefalea tensional', N'Hidratación, descanso y analgésico según indicación', N'Dra. Sofía López', N'firmada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME());
SET @consultaId = SCOPE_IDENTITY();

INSERT INTO dbo.consultamedica (pacienteid, fechaconsulta, motivo, diagnostico, tratamiento, medico, estado, notas, creadopor, creadoen)
VALUES
(@pacienteId, '2026-06-02T09:30:00', N'Molestia estomacal', N'Gastritis leve', N'Dieta suave durante 7 días', N'Dr. Daniel Reyes', N'firmada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-04-21T15:00:00', N'Revisión preventiva', N'Sin hallazgos relevantes', N'Continuar hábitos saludables', N'Dra. Sofía López', N'firmada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-02-11T11:20:00', N'Dolor lumbar leve', N'Contractura muscular', N'Estiramientos y fisioterapia', N'Dr. Pablo Torres', N'firmada', N'Consulta ficticia.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.examenclinico (pacienteid, consultaid, nombreexamen, tipoexamen, laboratorio, fechaexamen, fecharesultado, resultadotexto, observaciones, creadopor, creadoen)
VALUES
(@pacienteId, @consultaId, N'Hemograma completo', N'Sangre', N'Laboratorio Central', '2026-07-15', '2026-07-16', N'Resultados dentro de rangos esperados para prueba.', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, @consultaId, N'Glucosa en ayunas', N'Sangre', N'Laboratorio Central', '2026-07-15', '2026-07-16', N'92 mg/dL', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, NULL, N'Perfil lipídico', N'Sangre', N'Laboratorio Central', '2026-04-21', '2026-04-22', N'Perfil dentro de rangos esperados.', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.medicacion (pacienteid, consultaid, nombremedicamento, presentacion, dosis, viaadministracion, indicaciones, fechainicio, fechafin, medicacionactiva, creadopor, creadoen)
VALUES
(@pacienteId, @consultaId, N'Paracetamol', N'Tableta 500 mg', N'1 tableta según necesidad', N'Oral', N'No exceder dosis indicada.', '2026-07-15', '2026-07-20', 0, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, NULL, N'Omeprazol', N'Cápsula 20 mg', N'1 cápsula diaria', N'Oral', N'Antes del desayuno.', '2026-06-02', '2026-06-16', 0, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, NULL, N'Vitamina D', N'Tableta 1000 UI', N'1 tableta diaria', N'Oral', N'Con alimentos.', '2026-08-01', NULL, 1, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, NULL, N'Gel antiinflamatorio', N'Tubo 30 g', N'Aplicar 2 veces al día', N'Tópica', N'En zona lumbar por 5 días.', '2026-02-11', '2026-02-16', 0, N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.vacuna (pacienteid, nombre, fechaaplicacion, lote, proximadosis, observaciones, creadopor, creadoen)
VALUES
(@pacienteId, N'Influenza estacional', '2025-10-15', N'INF-25-100', '2026-10-15', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'COVID-19 refuerzo', '2025-08-20', N'CV-25-832', NULL, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Tétanos y difteria', '2024-05-10', N'TD-24-221', '2034-05-10', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Hepatitis B', '2023-11-07', N'HB-23-504', NULL, N'Esquema completo ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.registrodental (pacienteid, fechaatencion, procedimiento, diagnostico, odontologo, piezastratadas, notas, creadopor, creadoen)
VALUES
(@pacienteId, '2026-07-01T09:00:00', N'Limpieza dental', N'Profilaxis preventiva', N'Dr. Marco Ruiz', N'Toda la dentadura', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-05-14T10:00:00', N'Restauración', N'Caries superficial', N'Dr. Marco Ruiz', N'16', N'Resina compuesta ficticia.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-03-09T11:30:00', N'Radiografía panorámica', N'Evaluación preventiva', N'Dra. Paula Díaz', N'N/A', N'Sin hallazgos relevantes.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2025-12-03T08:45:00', N'Sellante dental', N'Prevención de caries', N'Dr. Marco Ruiz', N'26', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2025-09-22T14:00:00', N'Consulta de evaluación', N'Sensibilidad dental leve', N'Dra. Paula Díaz', N'11 y 21', N'Recomendaciones de pasta dental.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.estilovida (pacienteid, fecharegistro, alimentacion, actividadfisica, consumoalcohol, consumotabaco, horassueno, estres, notas, creadopor, creadoen)
VALUES
(@pacienteId, '2026-08-01', N'Balanceada con frutas y vegetales', N'Caminata 4 días por semana', N'Ocasional', N'No consume', 7.5, N'Moderado', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-05-01', N'Alimentación variada', N'Yoga 2 días por semana', N'Ocasional', N'No consume', 7.0, N'Leve', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-02-01', N'En mejora', N'Actividad ligera', N'Ocasional', N'No consume', 6.5, N'Moderado', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.saludmental (pacienteid, fecha, estadoanimo, estres, ansiedad, horassueno, notapersonal, ejerciciominutos, hidratacionlitros, descansohoras, tiemposocialminutos, pausasdigitales, creadopor, creadoen)
VALUES
(@pacienteId, '2026-08-01', 8, 3, 2, 7.5, N'Día productivo ficticio.', 40, 2.1, 7.5, 90, 3, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-02', 7, 4, 3, 7.0, N'Día tranquilo ficticio.', 30, 2.0, 7.0, 60, 2, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-03', 6, 6, 5, 6.5, N'Mucho trabajo ficticio.', 20, 1.8, 6.5, 45, 1, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-04', 8, 2, 2, 8.0, N'Descanso adecuado ficticio.', 45, 2.3, 8.0, 120, 4, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-05', 7, 4, 3, 7.5, N'Día normal ficticio.', 35, 2.0, 7.5, 75, 3, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-06', 9, 2, 1, 8.0, N'Buen ánimo ficticio.', 50, 2.2, 8.0, 110, 4, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-07', 6, 5, 4, 6.5, N'Día de pendientes ficticio.', 25, 1.9, 6.5, 50, 2, N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.seguimientofisico (pacienteid, fecha, peso, minutosejercicio, tipoejercicio, intensidad, pasos, caloriasquemadas, distanciakm, notas, creadopor, creadoen)
VALUES
(@pacienteId, '2026-08-01', 62.4, 40, N'Caminata', N'moderada', 7200, 260, 5.4, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-02', 62.3, 30, N'Yoga', N'leve', 5100, 160, 3.8, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-03', 62.5, 20, N'Caminata', N'leve', 4300, 130, 3.2, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-04', 62.2, 45, N'Caminata', N'moderada', 8100, 310, 6.1, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-05', 62.3, 35, N'Bicicleta estática', N'moderada', 6300, 280, 4.7, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-06', 62.1, 50, N'Caminata', N'intensa', 9200, 350, 7.0, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2026-08-07', 62.2, 25, N'Estiramientos', N'leve', 4800, 115, 3.5, N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.condicioncronica (pacienteid, tipocondicionid, fechadiagnostico, estado, severidad, tratamientoprincipal, proveedorlider, proximoseguimiento, notas, creadopor, creadoen)
VALUES (@pacienteId, 1, '2024-01-10', N'activa', N'Leve', N'Plan alimenticio y seguimiento', N'Dra. Sofía López', '2026-10-10', N'Dato ficticio para pruebas.', N'seed-admin-pruebas', SYSDATETIME());
SET @condicionId = SCOPE_IDENTITY();

INSERT INTO dbo.controlcronico (condicioncronicaid, fechacontrol, indicador, valor, unidad, resultado, conclusiones, proximocontrol, medico, creadopor, creadoen)
VALUES
(@condicionId, '2026-05-10T09:00:00', N'Glucosa en ayunas', 94, N'mg/dL', N'Controlado', N'Continuar plan.', '2026-08-10', N'Dra. Sofía López', N'seed-admin-pruebas', SYSDATETIME()),
(@condicionId, '2026-06-10T09:00:00', N'Glucosa en ayunas', 92, N'mg/dL', N'Controlado', N'Continuar plan.', '2026-09-10', N'Dra. Sofía López', N'seed-admin-pruebas', SYSDATETIME()),
(@condicionId, '2026-07-10T09:00:00', N'Glucosa en ayunas', 95, N'mg/dL', N'Controlado', N'Continuar plan.', '2026-10-10', N'Dra. Sofía López', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.lesion (pacienteid, fechalesion, tipo, partecuerpo, severidad, tratamiento, recuperado, notas, creadopor, creadoen)
VALUES (@pacienteId, '2026-01-25', N'Esguince', N'Tobillo derecho', N'Leve', N'Reposo y compresas frías', 1, N'Evento ficticio.', N'seed-admin-pruebas', SYSDATETIME());
SET @lesionId = SCOPE_IDENTITY();

INSERT INTO dbo.operacion (pacienteid, fechaoperacion, tipo, hospital, cirujano, resultado, complicaciones, estado, creadopor, creadoen)
VALUES (@pacienteId, '2022-06-08', N'Extracción de muela del juicio', N'Clínica Demo', N'Dr. Marco Ruiz', N'Recuperación satisfactoria', N'Ninguna', N'completada', N'seed-admin-pruebas', SYSDATETIME());
SET @operacionId = SCOPE_IDENTITY();

INSERT INTO dbo.seguimientopostevento (pacienteid, tipoevento, operacionid, lesionid, tituloevento, fechaevento, fechaseguimiento, estado, evolucion, sintomas, niveldolor, medicacionactual, cuidadoshogar, notas, compartirconmedico, requiereatencion, proximocontrol, creadopor, creadoen)
VALUES
(@pacienteId, N'lesion', NULL, @lesionId, N'Seguimiento de esguince', '2026-01-25', '2026-01-29T10:00:00', N'cerrado', N'Mejoría progresiva', N'Molestia leve', 2, N'Ninguna', N'Estiramientos suaves', N'Dato ficticio.', 1, 0, NULL, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'operacion', @operacionId, NULL, N'Seguimiento odontológico', '2022-06-08', '2022-06-15T09:00:00', N'cerrado', N'Recuperación satisfactoria', N'Sin síntomas', 0, N'Analgésico según indicación', N'Higiene oral', N'Dato ficticio.', 1, 0, NULL, N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.desparasitacion (pacienteid, fecha, producto, dosis, proximafecha, observaciones, creadopor, creadoen)
VALUES
(@pacienteId, '2026-03-01', N'Albendazol', N'400 mg dosis única', '2027-03-01', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, '2025-03-02', N'Albendazol', N'400 mg dosis única', '2026-03-01', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.registromensual (pacienteid, mes, anio, fechainicio, duraciondias, dolor, sintomas, observaciones, creadopor, creadoen)
VALUES
(@pacienteId, 3, 2026, '2026-03-04', 5, N'Leve', N'Cansancio leve', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, 4, 2026, '2026-04-02', 5, N'Moderado', N'Cólicos leves', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, 5, 2026, '2026-05-01', 4, N'Leve', N'Ninguno', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, 6, 2026, '2026-06-01', 5, N'Leve', N'Cansancio leve', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, 7, 2026, '2026-07-01', 5, N'Moderado', N'Cólicos leves', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, 8, 2026, '2026-08-01', 4, N'Leve', N'Ninguno', N'Dato ficticio.', N'seed-admin-pruebas', SYSDATETIME());

INSERT INTO dbo.recordatoriocita (citaid, pacienteid, fecharecordatorio, mensaje, canal, estado, intentos, ultimointento, proximaejecucion, creadopor, creadoen)
SELECT citaid, @pacienteId, DATEADD(DAY, -1, fechacita), N'Recordatorio de cita ficticio.', N'App', N'pendiente', 0, NULL, DATEADD(DAY, -1, fechacita), N'seed-admin-pruebas', SYSDATETIME()
FROM dbo.citamedica WHERE pacienteid = @pacienteId;

INSERT INTO dbo.notificacion (pacienteid, tipo, mensaje, fechaprogramada, enviada, medio, entidadorigen, entidadid, creadopor, creadoen)
VALUES
(@pacienteId, N'Medicación', N'Recordatorio ficticio de vitamina D.', '2026-08-17T08:00:00', 0, N'App', N'medicacion', NULL, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Cita', N'Recordatorio ficticio de chequeo anual.', '2026-09-01T09:00:00', 0, N'App', N'citamedica', NULL, N'seed-admin-pruebas', SYSDATETIME()),
(@pacienteId, N'Vacuna', N'Recordatorio ficticio de vacuna contra influenza.', '2026-10-01T09:00:00', 0, N'App', N'vacuna', NULL, N'seed-admin-pruebas', SYSDATETIME());

COMMIT TRANSACTION;

SELECT @pacienteId AS pacienteId, @usuarioId AS usuarioId;
