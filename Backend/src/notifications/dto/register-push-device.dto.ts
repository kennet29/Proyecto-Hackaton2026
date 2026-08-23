/**
 * @file Backend/src/notifications/dto/register-push-device.dto.ts
 * @description TypeScript module implementation.
 */

import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const registerPushDeviceSchema = z.object({
  expoPushToken: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/, "token de Expo invalido"),
  platform: z.enum(["android", "ios"]),
});

export class RegisterPushDeviceDto extends createZodDto(registerPushDeviceSchema) {}
