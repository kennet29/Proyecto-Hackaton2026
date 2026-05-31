import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { RegistromensualService } from "./registromensual.service";
import { CreateRegistromensualDto } from "./dto/create-registromensual.dto";
import { UpdateRegistromensualDto } from "./dto/update-registromensual.dto";

/**
 * Expone los endpoints HTTP del dominio registromensual.
 */
@Controller("registromensual")
export class RegistromensualController {
  constructor(
    private readonly registromensualservice: RegistromensualService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateRegistromensualDto) {
    return this.registromensualservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.registromensualservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.registromensualservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateRegistromensualDto) {
    return this.registromensualservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.registromensualservice.remove(id);
  }
}
