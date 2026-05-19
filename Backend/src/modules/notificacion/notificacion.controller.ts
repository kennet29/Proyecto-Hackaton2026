import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { NotificacionService } from "./notificacion.service";
import { CreateNotificacionDto } from "./dto/create-notificacion.dto";
import { UpdateNotificacionDto } from "./dto/update-notificacion.dto";

/**
 * Expone los endpoints HTTP del dominio notificacion.
 */
@Controller("notificacion")
export class NotificacionController {
  constructor(private readonly notificacionservice: NotificacionService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateNotificacionDto) {
    return this.notificacionservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.notificacionservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.notificacionservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateNotificacionDto) {
    return this.notificacionservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.notificacionservice.remove(id);
  }
}
