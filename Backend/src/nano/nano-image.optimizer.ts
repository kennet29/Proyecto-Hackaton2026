import { BadRequestException } from "@nestjs/common";
import sharp from "sharp";

export const NANO_IMAGE_MAX_DIMENSION = 1600;
export const NANO_IMAGE_QUALITY = 86;

type NanoImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export type OptimizedNanoImage = {
  buffer: Buffer;
  mimeType: NanoImageMimeType;
  width: number;
  height: number;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
};

/**
 * Prepara una foto para el analisis visual de Nano.
 *
 * Corrige la orientacion EXIF, reduce solamente las imagenes que exceden el
 * limite y elimina metadatos antes de codificar en WebP de alta calidad.
 */
export async function optimizeNanoImage(
  imageBuffer: Buffer,
): Promise<OptimizedNanoImage> {
  try {
    const metadata = await sharp(imageBuffer, { failOn: "error" }).metadata();
    const { data, info } = await sharp(imageBuffer, {
      failOn: "error",
    })
      .rotate()
      .resize({
        width: NANO_IMAGE_MAX_DIMENSION,
        height: NANO_IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .webp({
        quality: NANO_IMAGE_QUALITY,
        smartSubsample: true,
        effort: 4,
      })
      .toBuffer({ resolveWithObject: true });

    const originalMimeType = getSupportedMimeType(metadata.format);
    const originalWidth = metadata.width ?? info.width;
    const originalHeight = metadata.height ?? info.height;
    const originalFitsLimit =
      originalWidth <= NANO_IMAGE_MAX_DIMENSION &&
      originalHeight <= NANO_IMAGE_MAX_DIMENSION;

    // Una imagen pequena que ya esta bien comprimida no debe crecer solo por
    // cambiar de formato. En ese caso se conserva el archivo recibido.
    if (
      originalMimeType &&
      originalFitsLimit &&
      imageBuffer.byteLength <= data.byteLength
    ) {
      return {
        buffer: imageBuffer,
        mimeType: originalMimeType,
        width: originalWidth,
        height: originalHeight,
        originalSizeBytes: imageBuffer.byteLength,
        optimizedSizeBytes: imageBuffer.byteLength,
      };
    }

    return {
      buffer: data,
      mimeType: "image/webp",
      width: info.width,
      height: info.height,
      originalSizeBytes: imageBuffer.byteLength,
      optimizedSizeBytes: data.byteLength,
    };
  } catch {
    throw new BadRequestException(
      "La foto no se pudo procesar. Usa una imagen JPEG, PNG o WebP valida.",
    );
  }
}

function getSupportedMimeType(
  format: string | undefined,
): NanoImageMimeType | null {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return null;
  }
}
