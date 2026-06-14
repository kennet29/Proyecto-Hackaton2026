import { Module } from "@nestjs/common";
import { VersionModule } from "../version/version.module";
import { HealthController } from "./health.controller";

/**
 * Agrupa controladores del dominio health.
 */
@Module({
  imports: [VersionModule],
  controllers: [HealthController],
})
export class HealthModule {}
