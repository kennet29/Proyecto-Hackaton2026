import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SuscripcionPremiumModule } from "../suscripcionpremium/suscripcionpremium.module";
import { PagoPremiumController } from "./pagopremium.controller";
import { PagoPremium } from "./pagopremium.entity";
import { PagoPremiumService } from "./pagopremium.service";

@Module({ imports: [TypeOrmModule.forFeature([PagoPremium]), SuscripcionPremiumModule], controllers: [PagoPremiumController], providers: [PagoPremiumService] })
export class PagoPremiumModule {}
