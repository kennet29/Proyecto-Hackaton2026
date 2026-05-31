import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { RegistrodentalService } from "./registrodental.service";
import { CreateRegistrodentalDto } from "./dto/create-registrodental.dto";
import { UpdateRegistrodentalDto } from "./dto/update-registrodental.dto";

/**
 * Expone los endpoints HTTP del dominio registrodental.
 */
@Controller("registrodental")
export class RegistrodentalController {
  constructor(private readonly registrodentalservice: RegistrodentalService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateRegistrodentalDto) {
    return this.registrodentalservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.registrodentalservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.registrodentalservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateRegistrodentalDto) {
    return this.registrodentalservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.registrodentalservice.remove(id);
  }
}
