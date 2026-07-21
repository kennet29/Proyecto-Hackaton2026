const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

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
