import "reflect-metadata";
import { BadRequestException, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import morgan from "morgan";
import { cleanupOpenApiDoc, createZodValidationPipe } from "nestjs-zod";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodError } from "zod";
import path from "path";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { DataSource } from "typeorm";
import { VersionService } from "./version/version.service";

const zodJsonSchemaProcessors = require(
  path.join(
    process.cwd(),
    "node_modules",
    "zod",
    "v4",
    "core",
    "json-schema-processors.cjs",
  ),
) as any;

const openApiDateProcessor = (_schema: unknown, _ctx: unknown, json: any) => {
  json.type = "string";
  json.format = "date-time";
};

zodJsonSchemaProcessors.dateProcessor = openApiDateProcessor;
zodJsonSchemaProcessors.allProcessors.date = openApiDateProcessor;

/**
 * Bootstrap.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLogFormat =
    ":method :url :status :res[content-length] - :response-time ms";
  app.use(
    morgan(requestLogFormat, {
      stream: {
        write: (message) => console.log(`[http] ${message.trim()}`),
      },
    }),
  );
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });
  const corsOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors(
    corsOrigins.length
      ? {
          origin: corsOrigins,
        }
      : undefined,
  );
  const GlobalZodValidationPipe = createZodValidationPipe({
    createValidationException: (error: unknown) => {
      const zodError = error as ZodError;
      return new BadRequestException({
        message: "los datos enviados no superaron las validaciones",
        detalles: zodError.issues?.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      });
    },
  });
  app.useGlobalPipes(new GlobalZodValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Gestion Salud API")
    .setDescription(
      "API principal para pacientes, expedientes clinicos y seguimiento de salud",
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  SwaggerModule.setup("api/docs", app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  const port = process.env.PORT ?? "3000";
  await app.listen(port);
  const versionService = app.get(VersionService);
  const backendVersion = versionService.getBackendVersion();
  let dbStatus = "conexion a base de datos no disponible";
  try {
    const dataSource = app.get(DataSource);
    if (dataSource?.isInitialized) {
      const dbName =
        (typeof dataSource.options.database === "string" &&
          dataSource.options.database) ||
        "";
      dbStatus = `conexion a base de datos exitosa${dbName ? ` (${dbName})` : ""}`;
    } else {
      dbStatus = "conexion a base de datos no inicializada";
    }
  } catch (error) {
    dbStatus = `conexion a base de datos fallo: ${(error as Error).message}`;
  }
  console.log(
    `api usuarios ${backendVersion.version} escuchando en puerto ${port} con prefijo /api - ${dbStatus}`,
  );
  console.log(`documentacion Swagger disponible en /api/docs`);
}

bootstrap();
