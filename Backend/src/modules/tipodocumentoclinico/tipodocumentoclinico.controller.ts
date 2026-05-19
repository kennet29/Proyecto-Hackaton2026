import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipodocumentoclinicoService } from "./tipodocumentoclinico.service";
import { CreateTipodocumentoclinicoDto } from "./dto/create-tipodocumentoclinico.dto";
import { UpdateTipodocumentoclinicoDto } from "./dto/update-tipodocumentoclinico.dto";

/**
 * Expone los endpoints HTTP del dominio tipodocumentoclinico.
 */
@Controller("tipodocumentoclinico")
export class TipodocumentoclinicoController {
  constructor(
    private readonly tipodocumentoclinicoservice: TipodocumentoclinicoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipodocumentoclinicoDto) {
    return this.tipodocumentoclinicoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipodocumentoclinicoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipodocumentoclinicoservice.findOne(id);
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
    @Body() payload: UpdateTipodocumentoclinicoDto,
  ) {
    return this.tipodocumentoclinicoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipodocumentoclinicoservice.remove(id);
  }
}
