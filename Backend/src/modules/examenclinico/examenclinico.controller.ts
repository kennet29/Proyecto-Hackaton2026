import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreateExamenclinicoDto } from "./dto/create-examenclinico.dto";
import { UpdateExamenclinicoDto } from "./dto/update-examenclinico.dto";
import { ExamenclinicoService } from "./examenclinico.service";

/**
 * Expone los endpoints HTTP del dominio examenclinico.
 */
@Controller("examenclinico")
export class ExamenclinicoController {
  constructor(private readonly examenclinicoService: ExamenclinicoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateExamenclinicoDto) {
    return this.examenclinicoService.create(payload);
  }

  /**
   * Find all.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll(@Query("pacienteId") pacienteId?: string) {
    return this.examenclinicoService.findAll(
      pacienteId ? Number(pacienteId) : undefined,
    );
  }

  /**
   * Get documento.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id/documento")
  getDocumento(@Param("id", ParseIntPipe) id: number) {
    return this.examenclinicoService.getDocumento(id);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.examenclinicoService.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateExamenclinicoDto,
  ) {
    return this.examenclinicoService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.examenclinicoService.remove(id);
  }
}
