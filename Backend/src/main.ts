import 'reflect-metadata';
import { BadRequestException, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { DataSource } from 'typeorm';
import { VersionService } from './version/version.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLogFormat = ':method :url :status :res[content-length] - :response-time ms';
  app.use(
    morgan(requestLogFormat, {
      stream: {
        write: (message) => console.log(`[http] ${message.trim()}`),
      },
    }),
  );
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors();
  const GlobalZodValidationPipe = createZodValidationPipe({
    createValidationException: (error: unknown) => {
      const zodError = error as ZodError;
      return new BadRequestException({
        message: 'los datos enviados no superaron las validaciones',
        detalles: zodError.issues?.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    },
  });
  app.useGlobalPipes(new GlobalZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  const port = process.env.PORT ?? '3000';
  await app.listen(port);
  const versionService = app.get(VersionService);
  const backendVersion = versionService.getBackendVersion();
  let dbStatus = 'conexion a base de datos no disponible';
  try {
    const dataSource = app.get(DataSource);
    if (dataSource?.isInitialized) {
      const dbName =
        (typeof dataSource.options.database === 'string' && dataSource.options.database) || '';
      dbStatus = `conexion a base de datos exitosa${dbName ? ` (${dbName})` : ''}`;
    } else {
      dbStatus = 'conexion a base de datos no inicializada';
    }
  } catch (error) {
    dbStatus = `conexion a base de datos fallo: ${(error as Error).message}`;
  }
  console.log(
    `api usuarios ${backendVersion.version} escuchando en puerto ${port} con prefijo /api - ${dbStatus}`,
  );
}

bootstrap();
