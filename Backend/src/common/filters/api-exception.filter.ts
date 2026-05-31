import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

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
