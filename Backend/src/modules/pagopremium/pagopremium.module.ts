/**
 * @file Backend/src/modules/pagopremium/pagopremium.module.ts
 * @description TypeScript module implementation.
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { SuscripcionPremiumModule } from "../suscripcionpremium/suscripcionpremium.module";
import { PagoPremiumController } from "./pagopremium.controller";
import { PagoPremium } from "./pagopremium.entity";
import { PagoPremiumService } from "./pagopremium.service";

@Module({ imports: [TypeOrmModule.forFeature([PagoPremium, Usuario]), SuscripcionPremiumModule], controllers: [PagoPremiumController], providers: [PagoPremiumService] })
export class PagoPremiumModule {}
