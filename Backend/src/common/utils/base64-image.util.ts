import { BadRequestException } from '@nestjs/common';

export function decodeBase64Image(
  value: string | null | undefined,
  field: string,
): Buffer | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const payload = trimmed.startsWith('data:')
    ? (trimmed.split(',', 2)[1] ?? '').trim()
    : trimmed.replace(/\s+/g, '');

  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
    throw new BadRequestException(`${field} debe ser una cadena base64 valida`);
  }

  const buffer = Buffer.from(payload, 'base64');
  if (!buffer.length) {
    throw new BadRequestException(`${field} no contiene datos validos`);
  }

  return buffer;
}

export function validateImageMimeType(
  value: string | null | undefined,
  field: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (!normalized.startsWith('image/')) {
    throw new BadRequestException(`${field} debe ser un mime type de imagen valido`);
  }

  return normalized;
}
