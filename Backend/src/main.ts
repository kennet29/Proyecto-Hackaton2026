import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  console.log(`api usuarios escuchando en puerto ${port}`);
}

bootstrap();
