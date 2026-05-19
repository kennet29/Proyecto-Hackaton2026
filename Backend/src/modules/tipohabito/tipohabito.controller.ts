import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipohabitoService } from "./tipohabito.service";
import { CreateTipohabitoDto } from "./dto/create-tipohabito.dto";
import { UpdateTipohabitoDto } from "./dto/update-tipohabito.dto";

/**
 * Expone los endpoints HTTP del dominio tipohabito.
 */
@Controller("tipohabito")
export class TipohabitoController {
  constructor(private readonly tipohabitoservice: TipohabitoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipohabitoDto) {
    return this.tipohabitoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipohabitoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipohabitoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateTipohabitoDto) {
    return this.tipohabitoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipohabitoservice.remove(id);
  }
}
