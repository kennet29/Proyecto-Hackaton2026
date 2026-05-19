import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { EspecialidadService } from "./especialidad.service";
import { CreateEspecialidadDto } from "./dto/create-especialidad.dto";
import { UpdateEspecialidadDto } from "./dto/update-especialidad.dto";

/**
 * Expone los endpoints HTTP del dominio especialidad.
 */
@Controller("especialidad")
export class EspecialidadController {
  constructor(private readonly especialidadservice: EspecialidadService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateEspecialidadDto) {
    return this.especialidadservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.especialidadservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.especialidadservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateEspecialidadDto) {
    return this.especialidadservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.especialidadservice.remove(id);
  }
}
