import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CitamedicaService } from "./citamedica.service";
import { CreateCitamedicaDto } from "./dto/create-citamedica.dto";
import { UpdateCitamedicaDto } from "./dto/update-citamedica.dto";

/**
 * Expone los endpoints HTTP del dominio citamedica.
 */
@Controller("citamedica")
export class CitamedicaController {
  constructor(private readonly citamedicaservice: CitamedicaService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateCitamedicaDto) {
    return this.citamedicaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.citamedicaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.citamedicaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateCitamedicaDto) {
    return this.citamedicaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.citamedicaservice.remove(id);
  }
}
