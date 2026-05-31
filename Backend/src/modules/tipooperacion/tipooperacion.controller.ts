import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipooperacionService } from "./tipooperacion.service";
import { CreateTipooperacionDto } from "./dto/create-tipooperacion.dto";
import { UpdateTipooperacionDto } from "./dto/update-tipooperacion.dto";

/**
 * Expone los endpoints HTTP del dominio tipooperacion.
 */
@Controller("tipooperacion")
export class TipooperacionController {
  constructor(private readonly tipooperacionservice: TipooperacionService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipooperacionDto) {
    return this.tipooperacionservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipooperacionservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipooperacionservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateTipooperacionDto) {
    return this.tipooperacionservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipooperacionservice.remove(id);
  }
}
