import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { isDatabaseUnavailable } from "../database/database-error.util";

type PayloadTooLargeLike = {
  type?: string;
  status?: number;
  statusCode?: number;
  limit?: number;
};

/**
 * Filtro de excepciones que transforma errores del flujo api exception filter.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * Catch.
   * @param exception Valor del parámetro `exception`.
   * @param host Valor del parámetro `host`.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (isDatabaseUnavailable(exception)) {
      const dbException = new ServiceUnavailableException(
        "la base de datos no esta disponible temporalmente, intenta nuevamente en unos minutos",
      );
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: dbException.name,
        message: dbException.message,
        details: dbException.getResponse(),
        path: request.url,
        timestamp: new Date().toISOString(),
        hint: this.buildHint(HttpStatus.SERVICE_UNAVAILABLE),
      });
      return;
    }

    const payloadTooLargeException = exception as PayloadTooLargeLike;
    if (
      payloadTooLargeException?.type === "entity.too.large" ||
      payloadTooLargeException?.status === HttpStatus.PAYLOAD_TOO_LARGE ||
      payloadTooLargeException?.statusCode === HttpStatus.PAYLOAD_TOO_LARGE
    ) {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: "PayloadTooLarge",
        message:
          "la imagen enviada es demasiado grande para procesarse en una sola solicitud",
        details: {
          limit: payloadTooLargeException.limit,
          type: payloadTooLargeException.type,
        },
        path: request.url,
        timestamp: new Date().toISOString(),
        hint: "reduce el tamano o calidad de la foto e intenta nuevamente.",
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === "string"
          ? responseBody
          : ((responseBody as Record<string, unknown>)?.message ??
            exception.message);

      response.status(status).json({
        statusCode: status,
        error: exception.name,
        message,
        details: typeof responseBody === "object" ? responseBody : undefined,
        path: request.url,
        timestamp: new Date().toISOString(),
        hint: this.buildHint(status),
      });
      return;
    }

    console.error("error no controlado", exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "InternalServerError",
      message: "ocurrio un error inesperado en el servidor",
      path: request.url,
      timestamp: new Date().toISOString(),
      hint: "revisa los datos enviados y vuelve a intentarlo. si persiste contacta soporte.",
    });
  }

  /**
   * Construye hint.
   * @param status Valor del parámetro `status`.
   * @returns Estructura construida para el flujo interno.
   */
  private buildHint(status: number): string {
    if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      return "el servicio depende de una conexion externa que no esta respondiendo, intenta nuevamente en unos minutos.";
    }
    if (status >= 500) {
      return "nuestro servidor no pudo procesar la solicitud, intenta de nuevo en unos minutos.";
    }
    if (status === HttpStatus.NOT_FOUND) {
      return "verifica el identificador o la ruta antes de volver a consultar.";
    }
    if (status === HttpStatus.UNAUTHORIZED) {
      return "asegurate de iniciar sesion antes de continuar.";
    }
    if (status === HttpStatus.FORBIDDEN) {
      return "este recurso exige permisos adicionales.";
    }
    return "corrige los datos indicados en el mensaje y vuelve a enviar la solicitud.";
  }

}
