export type EditField = { key: string; label: string; type: 'text' | 'number' | 'date'; required?: boolean };
// Explicit allowlists: never send identifiers, ownership, files or audit fields back.
const definitions: Record<string, string[]> = {
  vacuna: ['nombre|Nombre|text|required', 'fechaaplicacion|Fecha de aplicación|date|required', 'lote|Lote', 'proximadosis|Próxima dosis|date', 'observaciones|Observaciones'],
  registrodental: ['procedimiento|Procedimiento|text|required', 'fechaatencion|Fecha de atención|date|required', 'diagnostico|Diagnóstico', 'odontologo|Odontólogo', 'piezastratadas|Piezas tratadas', 'notas|Notas'],
  operacion: ['tipo|Tipo de operación|text|required', 'fechaoperacion|Fecha de operación|date|required', 'hospital|Hospital', 'cirujano|Cirujano', 'resultado|Resultado', 'complicaciones|Complicaciones'],
  alergia: ['tipo|Tipo de alergia|text|required', 'desencadenante|Desencadenante', 'severidad|Severidad', 'reaccion|Reacción', 'tratamiento|Tratamiento', 'fechadiagnostico|Fecha del diagnóstico|date', 'observaciones|Observaciones'],
  lesion: ['tipo|Tipo de lesión|text|required', 'fechalesion|Fecha de lesión|date|required', 'partecuerpo|Parte del cuerpo', 'severidad|Severidad', 'tratamiento|Tratamiento', 'notas|Notas'],
  desparasitacion: ['producto|Producto|text|required', 'fecha|Fecha|date|required', 'dosis|Dosis', 'proximafecha|Próxima fecha|date', 'observaciones|Observaciones'],
  condicioncronica: ['fechadiagnostico|Fecha del diagnóstico|date', 'severidad|Severidad', 'tratamientoprincipal|Tratamiento principal', 'proveedorlider|Profesional responsable', 'proximoseguimiento|Próximo seguimiento|date', 'notas|Notas'],
  controlcronico: ['fechacontrol|Fecha del control|date|required', 'indicador|Indicador', 'valor|Valor|number', 'unidad|Unidad', 'resultado|Resultado', 'conclusiones|Conclusiones', 'proximocontrol|Próximo control|date', 'medico|Médico'],
  embarazo: ['fechainicio|Fecha de inicio|date|required', 'fechaprobableparto|Fecha probable de parto|date|required', 'numeroFetos|Número de fetos|number|required', 'antecedentesRelevantes|Antecedentes relevantes', 'medicoResponsable|Médico responsable', 'centroMedico|Centro médico'],
  periodo: ['fechaInicio|Fecha de inicio|date|required', 'fechaFin|Fecha de fin|date', 'duracionDias|Duración en días|number', 'cicloDias|Duración del ciclo|number', 'observaciones|Observaciones'],
  'salud-mental': ['fecha|Fecha|date|required', 'estadoAnimo|Estado de ánimo (1–5)|number|required', 'estres|Estrés (1–5)|number|required', 'ansiedad|Ansiedad (1–5)|number|required', 'horasSueno|Horas de sueño|number', 'notaPersonal|Nota personal'],
  seguimientofisico: ['fecha|Fecha|date|required', 'peso|Peso|number', 'minutosEjercicio|Minutos de ejercicio|number', 'tipoEjercicio|Tipo de ejercicio', 'pasos|Pasos|number', 'caloriasQuemadas|Calorías quemadas|number', 'distanciaKm|Distancia (km)|number', 'notas|Notas'],
  seguimientopostevento: ['tituloEvento|Título del evento|text|required', 'fechaEvento|Fecha del evento|date|required', 'fechaSeguimiento|Fecha del seguimiento|date|required', 'evolucion|Evolución', 'sintomas|Síntomas', 'nivelDolor|Dolor (0–10)|number', 'medicacionActual|Medicación actual', 'cuidadosHogar|Cuidados en casa', 'notas|Notas', 'proximoControl|Próximo control|date'],
  examenclinico: ['nombreExamen|Nombre del examen|text|required', 'tipoExamen|Tipo de examen', 'laboratorio|Laboratorio', 'fechaExamen|Fecha del examen|date|required', 'fechaResultado|Fecha del resultado|date', 'resultadoTexto|Resultado', 'observaciones|Observaciones'],
  documentoclinico: ['fechadocumento|Fecha del documento|date', 'notas|Notas'],
  habitoespecifico: ['categoria|Categoría', 'nivel|Nivel', 'frecuencia|Frecuencia', 'cantidad|Cantidad|number', 'unidad|Unidad', 'inicio|Inicio|date', 'fin|Fin|date', 'impactosalud|Impacto en salud', 'observaciones|Observaciones'],
  medicacion: ['nombremedicamento|Medicamento|text|required', 'dosis|Dosis', 'viaadministracion|Vía de administración', 'indicaciones|Indicaciones', 'fechainicio|Fecha de inicio|date|required', 'fechafin|Fecha de fin|date'],
  consultamedica: ['fechaconsulta|Fecha de consulta|date|required', 'motivo|Motivo|text|required', 'diagnostico|Diagnóstico', 'tratamiento|Tratamiento', 'medico|Médico', 'notas|Notas'],
};
export function fieldsFor(resource: string): EditField[] {
  return (definitions[resource] ?? []).map((entry) => {
    const [key, label, type = 'text', required] = entry.split('|');
    return { key, label, type: type as EditField['type'], required: required === 'required' };
  });
}
export function displayValue(value: unknown, field: EditField): string {
  if (value === null || value === undefined) return '';
  return field.type === 'date' ? String(value).slice(0, 10) : String(value);
}
export function buildRecordPatch(resource: string, original: Record<string, unknown>, draft: Record<string, string>) {
  const patch: Record<string, unknown> = {};
  for (const field of fieldsFor(resource)) {
    const value = (draft[field.key] ?? '').trim();
    if (value === displayValue(original[field.key], field)) continue;
    if (!value && field.required) throw new Error(`${field.label} es obligatorio.`);
    if (!value && field.type !== 'text' && (resource === 'periodo' || resource === 'salud-mental')) {
      throw new Error(`${field.label}: indica un valor; este campo no permite borrar el valor guardado.`);
    }
    if (field.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
      throw new Error(`${field.label}: usa una fecha válida (AAAA-MM-DD).`);
    }
    if (field.type === 'number' && value && !Number.isFinite(Number(value))) throw new Error(`${field.label}: escribe un número válido.`);
    // Preserve the time component when changing the calendar date.
    patch[field.key] = !value ? (field.type === 'text' ? '' : null)
      : field.type === 'number' ? Number(value)
      : field.type === 'date' ? value + (String(original[field.key] ?? '').match(/T.*$/)?.[0] ?? '') : value;
  }
  return patch;
}
