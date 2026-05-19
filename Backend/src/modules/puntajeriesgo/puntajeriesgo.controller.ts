import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { PuntajeriesgoService } from "./puntajeriesgo.service";
import { CreatePuntajeriesgoDto } from "./dto/create-puntajeriesgo.dto";
import { UpdatePuntajeriesgoDto } from "./dto/update-puntajeriesgo.dto";

/**
 * Expone los endpoints HTTP del dominio puntajeriesgo.
 */
@Controller("puntajeriesgo")
export class PuntajeriesgoController {
  constructor(private readonly puntajeriesgoservice: PuntajeriesgoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreatePuntajeriesgoDto) {
    return this.puntajeriesgoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.puntajeriesgoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.puntajeriesgoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdatePuntajeriesgoDto) {
    return this.puntajeriesgoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.puntajeriesgoservice.remove(id);
  }
}
