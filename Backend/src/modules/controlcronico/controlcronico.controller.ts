import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ControlcronicoService } from "./controlcronico.service";
import { CreateControlcronicoDto } from "./dto/create-controlcronico.dto";
import { UpdateControlcronicoDto } from "./dto/update-controlcronico.dto";

/**
 * Expone los endpoints HTTP del dominio controlcronico.
 */
@Controller("controlcronico")
export class ControlcronicoController {
  constructor(private readonly controlcronicoservice: ControlcronicoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateControlcronicoDto) {
    return this.controlcronicoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.controlcronicoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.controlcronicoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateControlcronicoDto) {
    return this.controlcronicoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.controlcronicoservice.remove(id);
  }
}
