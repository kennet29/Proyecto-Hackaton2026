import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { DesparasitacionService } from "./desparasitacion.service";
import { CreateDesparasitacionDto } from "./dto/create-desparasitacion.dto";
import { UpdateDesparasitacionDto } from "./dto/update-desparasitacion.dto";

/**
 * Expone los endpoints HTTP del dominio desparasitacion.
 */
@Controller("desparasitacion")
export class DesparasitacionController {
  constructor(
    private readonly desparasitacionservice: DesparasitacionService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateDesparasitacionDto) {
    return this.desparasitacionservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.desparasitacionservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.desparasitacionservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateDesparasitacionDto) {
    return this.desparasitacionservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.desparasitacionservice.remove(id);
  }
}
