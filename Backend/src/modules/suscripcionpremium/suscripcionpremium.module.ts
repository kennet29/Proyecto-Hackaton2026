import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { SuscripcionPremiumController } from "./suscripcionpremium.controller";
import { SuscripcionPremium } from "./suscripcionpremium.entity";
import { SuscripcionPremiumService } from "./suscripcionpremium.service";

@Module({
  imports: [TypeOrmModule.forFeature([SuscripcionPremium, Usuario])],
  controllers: [SuscripcionPremiumController],
  providers: [SuscripcionPremiumService],
  exports: [SuscripcionPremiumService],
})
export class SuscripcionPremiumModule {}
