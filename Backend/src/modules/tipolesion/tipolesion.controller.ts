import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipolesionService } from "./tipolesion.service";
import { CreateTipolesionDto } from "./dto/create-tipolesion.dto";
import { UpdateTipolesionDto } from "./dto/update-tipolesion.dto";

/**
 * Expone los endpoints HTTP del dominio tipolesion.
 */
@Controller("tipolesion")
export class TipolesionController {
  constructor(private readonly tipolesionservice: TipolesionService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipolesionDto) {
    return this.tipolesionservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipolesionservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipolesionservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateTipolesionDto) {
    return this.tipolesionservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipolesionservice.remove(id);
  }
}
