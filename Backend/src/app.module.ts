import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { DatabaseModule } from "./database/database.module";
import { Usuario } from "./users/entities/user.entity";
import { GestionSaludModule } from "./modules/gestionsalud.module";
import { AuthModule } from "./auth/auth.module";
import { PasswordResetToken } from "./auth/entities/password-reset-token.entity";
import { RevokedToken } from "./auth/entities/revoked-token.entity";
import { NotificationsModule } from "./notifications/notifications.module";
import { VersionModule } from "./version/version.module";
import { HealthModule } from "./health/health.module";
import { NanoModule } from "./nano/nano.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { IdempotencyInterceptor } from "./common/idempotency/idempotency.interceptor";

/**
 * Agrupa controladores y proveedores del dominio app.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const parseMs = (value: string | undefined, fallback: number) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
        };
        const authMode = config.get<string>("DB_AUTH", "sql").toLowerCase();
        const host = config.get<string>("DB_HOST", "localhost");
        const isAzureSql = host.toLowerCase().endsWith(".database.windows.net");
        const connectionTimeout = parseMs(
          config.get<string>("DB_CONNECTION_TIMEOUT_MS"),
          isAzureSql ? 60000 : 15000,
        );
        const requestTimeout = parseMs(
          config.get<string>("DB_REQUEST_TIMEOUT_MS"),
          isAzureSql ? 60000 : 15000,
        );
        const retryAttempts = parseMs(
          config.get<string>("DB_RETRY_ATTEMPTS"),
          isAzureSql ? 5 : 2,
        );
        const retryDelay = parseMs(
          config.get<string>("DB_RETRY_DELAY_MS"),
          5000,
        );
        const encrypt =
          config.get<string>("DB_ENCRYPT")?.toLowerCase() === "true" ||
          (!config.get<string>("DB_ENCRYPT") && isAzureSql);
        const trustServerCertificate =
          config.get<string>("DB_TRUST_SERVER_CERTIFICATE")?.toLowerCase() ===
            "true" ||
          (!config.get<string>("DB_TRUST_SERVER_CERTIFICATE") && !isAzureSql);

        console.log(
          `[db-config] host=${host} auth=${authMode} encrypt=${encrypt} trustServerCertificate=${trustServerCertificate} connectionTimeout=${connectionTimeout} requestTimeout=${requestTimeout} retryAttempts=${retryAttempts} retryDelay=${retryDelay}`,
        );

        const baseConfig = {
          type: "mssql" as const,
          host,
          port: Number(config.get<string>("DB_PORT", "1433")),
          database: config.get<string>("DB_NAME"),
          connectionTimeout,
          requestTimeout,
          retryAttempts,
          retryDelay,
          entities: [Usuario, PasswordResetToken, RevokedToken],
          autoLoadEntities: true,
          synchronize: false,
          options: {
            encrypt,
            trustServerCertificate,
            enableArithAbort: true,
          },
          extra: {
            options: {
              encrypt,
              trustServerCertificate,
              enableArithAbort: true,
            },
          },
        };

        if (authMode === "windows") {
          return {
            ...baseConfig,
            authentication: {
              type: "ntlm" as const,
              options: {
                userName: config.get<string>("DB_USER") ?? "",
                password: config.get<string>("DB_PASSWORD", ""),
                domain: config.get<string>("DB_DOMAIN") ?? "",
              },
            },
          };
        }

        return {
          ...baseConfig,
          username: config.get<string>("DB_USER"),
          password: config.get<string>("DB_PASSWORD"),
        };
      },
    }),
    UsersModule,
    DatabaseModule,
    GestionSaludModule,
    AuthModule,
    NotificationsModule,
    NanoModule,
    VersionModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
