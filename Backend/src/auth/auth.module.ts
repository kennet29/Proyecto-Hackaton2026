import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { APP_GUARD } from "@nestjs/core";
import { SignOptions } from "jsonwebtoken";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { PasswordResetToken } from "./entities/password-reset-token.entity";
import { RevokedToken } from "./entities/revoked-token.entity";
import { TokenRevocationService } from "./token-revocation.service";
import { MailModule } from "../mail/mail.module";
import { PermisoAcceso } from "../modules/permisoacceso/permisoacceso.entity";
import { PacienteAccessService } from "./paciente-access.service";
import { UsuarioPaciente } from "../modules/usuariopaciente/usuariopaciente.entity";

/**
 * Agrupa controladores y proveedores del dominio auth.
 */
@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    TypeOrmModule.forFeature([
      PasswordResetToken,
      RevokedToken,
      PermisoAcceso,
      UsuarioPaciente,
    ]),
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const signOptions: SignOptions = {};
        const expiresIn = config.get<string>("JWT_EXPIRES_IN") ?? "1h";
        signOptions.expiresIn = expiresIn as SignOptions["expiresIn"];

        return {
          secret: config.get<string>("JWT_SECRET", "dev-secret"),
          signOptions,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenRevocationService,
    PacienteAccessService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PacienteAccessService],
})
export class AuthModule {}
