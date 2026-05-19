import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CondicioncronicaService } from "./condicioncronica.service";
import { CreateCondicioncronicaDto } from "./dto/create-condicioncronica.dto";
import { UpdateCondicioncronicaDto } from "./dto/update-condicioncronica.dto";

/**
 * Expone los endpoints HTTP del dominio condicioncronica.
 */
@Controller("condicioncronica")
export class CondicioncronicaController {
  constructor(
    private readonly condicioncronicaservice: CondicioncronicaService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateCondicioncronicaDto) {
    return this.condicioncronicaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.condicioncronicaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.condicioncronicaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateCondicioncronicaDto) {
    return this.condicioncronicaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.condicioncronicaservice.remove(id);
  }
}
