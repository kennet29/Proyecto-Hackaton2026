import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { AntecedentefamiliarService } from "./antecedentefamiliar.service";
import { CreateAntecedentefamiliarDto } from "./dto/create-antecedentefamiliar.dto";
import { UpdateAntecedentefamiliarDto } from "./dto/update-antecedentefamiliar.dto";

/**
 * Expone los endpoints HTTP del dominio antecedentefamiliar.
 */
@Controller("antecedentefamiliar")
export class AntecedentefamiliarController {
  constructor(
    private readonly antecedentefamiliarservice: AntecedentefamiliarService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateAntecedentefamiliarDto) {
    return this.antecedentefamiliarservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.antecedentefamiliarservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.antecedentefamiliarservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() payload: UpdateAntecedentefamiliarDto,
  ) {
    return this.antecedentefamiliarservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.antecedentefamiliarservice.remove(id);
  }
}
