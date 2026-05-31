import { Module } from "@nestjs/common";
import { VersionController } from "./version.controller";
import { VersionService } from "./version.service";

/**
 * Agrupa controladores y proveedores del dominio version.
 */
@Module({
  controllers: [VersionController],
  providers: [VersionService],
  exports: [VersionService],
})
export class VersionModule {}
