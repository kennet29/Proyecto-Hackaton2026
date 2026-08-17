import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfiguracionPagoController } from "./configuracionpago.controller";
import { ConfiguracionPago } from "./configuracionpago.entity";
import { ConfiguracionPagoService } from "./configuracionpago.service";

@Module({ imports: [TypeOrmModule.forFeature([ConfiguracionPago])], controllers: [ConfiguracionPagoController], providers: [ConfiguracionPagoService] })
export class ConfiguracionPagoModule {}
