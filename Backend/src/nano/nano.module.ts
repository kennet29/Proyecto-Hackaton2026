import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NanoController } from "./nano.controller";
import { NanoService } from "./nano.service";

/**
 * Agrupa controladores y proveedores del dominio nano.
 */
@Module({
  imports: [ConfigModule],
  controllers: [NanoController],
  providers: [NanoService],
  exports: [NanoService],
})
export class NanoModule {}
