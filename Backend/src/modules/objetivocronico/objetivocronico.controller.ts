import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ObjetivocronicoService } from "./objetivocronico.service";
import { CreateObjetivocronicoDto } from "./dto/create-objetivocronico.dto";
import { UpdateObjetivocronicoDto } from "./dto/update-objetivocronico.dto";

/**
 * Expone los endpoints HTTP del dominio objetivocronico.
 */
@Controller("objetivocronico")
export class ObjetivocronicoController {
  constructor(
    private readonly objetivocronicoservice: ObjetivocronicoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateObjetivocronicoDto) {
    return this.objetivocronicoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.objetivocronicoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.objetivocronicoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateObjetivocronicoDto) {
    return this.objetivocronicoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.objetivocronicoservice.remove(id);
  }
}
