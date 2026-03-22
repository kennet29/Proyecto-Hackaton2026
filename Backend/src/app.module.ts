import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { Usuario } from './users/entities/user.entity';
import { GestionSaludModule } from './modules/gestionsalud.module';
import { AuthModule } from './auth/auth.module';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const authMode = config.get<string>('DB_AUTH', 'sql').toLowerCase();
        const baseConfig = {
          type: 'mssql' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get<string>('DB_PORT', '1433')),
          database: config.get<string>('DB_NAME'),
          entities: [Usuario, PasswordResetToken],
          synchronize: false,
          options: {
            encrypt: false,
          },
          extra: {
            trustServerCertificate: true,
          },
        };

        if (authMode === 'windows') {
          return {
            ...baseConfig,
            authentication: {
              type: 'ntlm' as const,
              options: {
                userName: config.get<string>('DB_USER') ?? '',
                password: config.get<string>('DB_PASSWORD', ''),
                domain: config.get<string>('DB_DOMAIN') ?? '',
              },
            },
          };
        }

        return {
          ...baseConfig,
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
        };
      },
    }),
    UsersModule,
    DatabaseModule,
    GestionSaludModule,
    AuthModule,
  ],
})
export class AppModule {}
