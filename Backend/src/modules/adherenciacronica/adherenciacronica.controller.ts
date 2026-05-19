import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { AdherenciacronicaService } from "./adherenciacronica.service";
import { CreateAdherenciacronicaDto } from "./dto/create-adherenciacronica.dto";
import { UpdateAdherenciacronicaDto } from "./dto/update-adherenciacronica.dto";

/**
 * Expone los endpoints HTTP del dominio adherenciacronica.
 */
@Controller("adherenciacronica")
export class AdherenciacronicaController {
  constructor(
    private readonly adherenciacronicaservice: AdherenciacronicaService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateAdherenciacronicaDto) {
    return this.adherenciacronicaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.adherenciacronicaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.adherenciacronicaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateAdherenciacronicaDto) {
    return this.adherenciacronicaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.adherenciacronicaservice.remove(id);
  }
}
