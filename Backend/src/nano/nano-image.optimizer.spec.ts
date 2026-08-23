/**
 * @file Backend/src/nano/nano-image.optimizer.spec.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException } from "@nestjs/common";
import sharp from "sharp";
import {
  NANO_IMAGE_MAX_DIMENSION,
  optimizeNanoImage,
} from "./nano-image.optimizer";

describe("optimizeNanoImage", () => {
  it("reduce una foto grande conservando su proporcion", async () => {
    const source = await sharp({
      create: {
        width: 3200,
        height: 2400,
        channels: 3,
        background: { r: 62, g: 142, b: 82 },
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const result = await optimizeNanoImage(source);
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimeType).toBe("image/webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(NANO_IMAGE_MAX_DIMENSION);
    expect(metadata.height).toBe(1200);
    expect(result.originalSizeBytes).toBe(source.byteLength);
    expect(result.optimizedSizeBytes).toBe(result.buffer.byteLength);
    expect(result.optimizedSizeBytes).toBeLessThan(result.originalSizeBytes);
  });

  it("no amplia una foto que ya es pequena", async () => {
    const source = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: { r: 220, g: 190, b: 120 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeNanoImage(source);

    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
    expect(result.optimizedSizeBytes).toBeLessThanOrEqual(
      result.originalSizeBytes,
    );
  });

  it("nunca aumenta el peso de una imagen pequena ya comprimida", async () => {
    const source = await sharp({
      create: {
        width: 320,
        height: 180,
        channels: 3,
        background: { r: 40, g: 90, b: 140 },
      },
    })
      .webp({ quality: 50 })
      .toBuffer();

    const result = await optimizeNanoImage(source);

    expect(result.optimizedSizeBytes).toBeLessThanOrEqual(source.byteLength);
  });

  it("rechaza contenido que no es una imagen valida", async () => {
    await expect(
      optimizeNanoImage(Buffer.from("esto no es una imagen")),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
