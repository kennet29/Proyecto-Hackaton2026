/**
 * @file App movil/GestionSaludExpo/src/utils/localDate.ts
 * @description TypeScript module implementation.
 */

const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

export const toLocalDateOnlyString = (date = new Date()): string => {
  if (Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

export const parseCalendarDate = (
  value?: Date | string | null,
): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const trimmed = String(value).trim();
  const dateMatch = trimmed.match(DATE_PREFIX_PATTERN);
  if (dateMatch) {
    const parsed = new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3]),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Convierte los controles de fecha y hora a un instante ISO con la zona horaria
 * del equipo. Así el backend no interpreta una hora local como si fuera UTC.
 */
export const composeLocalDateTime = (date: string, time: string): string => {
  const match = `${date}T${time}`.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) return '';

  const [, year, month, day, hours, minutes] = match;
  const local = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    0,
    0,
  );
  if (Number.isNaN(local.getTime())) return '';

  const offsetMinutes = -local.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, '0');

  return `${date}T${time}:00${offsetSign}${offsetHours}:${offsetRemainder}`;
};

const parseDateTime = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Devuelve la parte de fecha en la zona local del equipo. */
export const extractLocalDatePortion = (value?: string | null): string => {
  if (!value) return '';
  // Los valores antiguos sin zona ya representan fecha/hora local.
  const localMatch = value.match(LOCAL_DATE_TIME_PATTERN);
  if (localMatch) return `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}`;

  const parsed = parseDateTime(value);
  return parsed ? toLocalDateOnlyString(parsed) : '';
};

/** Devuelve la parte de hora en la zona local del equipo. */
export const extractLocalTimePortion = (value?: string | null): string => {
  if (!value) return '';
  const localMatch = value.match(LOCAL_DATE_TIME_PATTERN);
  if (localMatch) return `${localMatch[4]}:${localMatch[5]}`;

  const parsed = parseDateTime(value);
  if (!parsed) return '';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
};

export const parseScheduledDateTime = (value?: string | null): Date | null =>
  parseDateTime(value);
