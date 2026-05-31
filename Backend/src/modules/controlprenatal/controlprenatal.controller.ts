import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ControlprenatalService } from "./controlprenatal.service";
import { CreateControlprenatalDto } from "./dto/create-controlprenatal.dto";
import { UpdateControlprenatalDto } from "./dto/update-controlprenatal.dto";

/**
 * Expone los endpoints HTTP del dominio controlprenatal.
 */
@Controller("controlprenatal")
export class ControlprenatalController {
  constructor(
    private readonly controlprenatalservice: ControlprenatalService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateControlprenatalDto) {
    return this.controlprenatalservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.controlprenatalservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.controlprenatalservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateControlprenatalDto) {
    return this.controlprenatalservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.controlprenatalservice.remove(id);
  }
}
