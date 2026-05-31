import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { HorariomedicamentoService } from "./horariomedicamento.service";
import { CreateHorariomedicamentoDto } from "./dto/create-horariomedicamento.dto";
import { UpdateHorariomedicamentoDto } from "./dto/update-horariomedicamento.dto";

/**
 * Expone los endpoints HTTP del dominio horariomedicamento.
 */
@Controller("horariomedicamento")
export class HorariomedicamentoController {
  constructor(
    private readonly horariomedicamentoservice: HorariomedicamentoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateHorariomedicamentoDto) {
    return this.horariomedicamentoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.horariomedicamentoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.horariomedicamentoservice.findOne(id);
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
    @Body() payload: UpdateHorariomedicamentoDto,
  ) {
    return this.horariomedicamentoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.horariomedicamentoservice.remove(id);
  }
}
