import { Module } from "@nestjs/common";
import { DatabaseController } from "./database.controller";
import { DatabaseService } from "./database.service";

/**
 * Agrupa controladores y proveedores del dominio database.
 */
@Module({
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
