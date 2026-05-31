IF OBJECT_ID('dbo.tipohabito', 'U') IS NULL
BEGIN
  RAISERROR('La tabla dbo.tipohabito no existe. Ejecuta primero el script principal de base de datos.', 16, 1);
  RETURN;
END;

;WITH HabitosBase AS (
  SELECT
    nombre,
    categoria,
    descripcion
  FROM (VALUES
    (N'Fumar', N'riesgo', N'Consumo de cigarrillos, tabaco u otros productos para fumar.'),
    (N'Vapear', N'riesgo', N'Uso de cigarrillo electronico o dispositivos de vapeo.'),
    (N'Tomar alcohol', N'riesgo', N'Consumo de bebidas alcoholicas como cerveza, vino o licor.'),
    (N'Uso de sustancias', N'riesgo', N'Consumo de sustancias psicoactivas o drogas recreativas.'),
    (N'Hacer ejercicio', N'actividad fisica', N'Rutinas de ejercicio, gimnasio, deporte o entrenamiento.'),
    (N'Caminata diaria', N'actividad fisica', N'Habito de caminar de forma regular durante el dia.'),
    (N'Andar en bicicleta', N'actividad fisica', N'Actividad fisica frecuente usando bicicleta.'),
    (N'Dormir bien', N'descanso', N'Rutina de sueno con horas y calidad adecuadas.'),
    (N'Dormir poco', N'descanso', N'Patron de sueno insuficiente o descanso deficiente.'),
    (N'Alimentacion saludable', N'nutricion', N'Consumo habitual de alimentos balanceados y saludables.'),
    (N'Comida chatarra frecuente', N'nutricion', N'Consumo frecuente de frituras, gaseosas o ultraprocesados.'),
    (N'Tomar agua', N'nutricion', N'Habito de hidratacion diaria con agua.'),
    (N'Consumo de cafeina', N'nutricion', N'Consumo habitual de cafe, bebidas energeticas o similares.'),
    (N'Meditacion o relajacion', N'bienestar', N'Practica regular de respiracion, meditacion o relajacion.'),
    (N'Tiempo de pantalla', N'bienestar', N'Tiempo prolongado frente a celular, computadora o television.')
  ) AS source(nombre, categoria, descripcion)
)
MERGE dbo.tipohabito AS target
USING HabitosBase AS source
  ON target.nombre = source.nombre
WHEN MATCHED THEN
  UPDATE SET
    categoria = source.categoria,
    descripcion = source.descripcion,
    activo = 1,
    modificadopor = N'script_habitos_catalogo',
    modificadoen = SYSDATETIME()
WHEN NOT MATCHED THEN
  INSERT (
    nombre,
    categoria,
    descripcion,
    activo,
    creadopor,
    creadoen
  )
  VALUES (
    source.nombre,
    source.categoria,
    source.descripcion,
    1,
    N'script_habitos_catalogo',
    SYSDATETIME()
  );

SELECT
  tipohabitoid,
  nombre,
  categoria,
  descripcion,
  activo
FROM dbo.tipohabito
WHERE nombre IN (
  N'Fumar',
  N'Vapear',
  N'Tomar alcohol',
  N'Uso de sustancias',
  N'Hacer ejercicio',
  N'Caminata diaria',
  N'Andar en bicicleta',
  N'Dormir bien',
  N'Dormir poco',
  N'Alimentacion saludable',
  N'Comida chatarra frecuente',
  N'Tomar agua',
  N'Consumo de cafeina',
  N'Meditacion o relajacion',
  N'Tiempo de pantalla'
)
ORDER BY categoria, nombre;
