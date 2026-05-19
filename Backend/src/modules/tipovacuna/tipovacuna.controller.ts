import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipovacunaService } from "./tipovacuna.service";
import { CreateTipovacunaDto } from "./dto/create-tipovacuna.dto";
import { UpdateTipovacunaDto } from "./dto/update-tipovacuna.dto";

/**
 * Expone los endpoints HTTP del dominio tipovacuna.
 */
@Controller("tipovacuna")
export class TipovacunaController {
  constructor(private readonly tipovacunaservice: TipovacunaService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipovacunaDto) {
    return this.tipovacunaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipovacunaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipovacunaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateTipovacunaDto) {
    return this.tipovacunaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipovacunaservice.remove(id);
  }
}
