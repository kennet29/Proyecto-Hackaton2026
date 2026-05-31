import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CreateMedicoregistroDto } from "./dto/create-medicoregistro.dto";
import { UpdateMedicoregistroDto } from "./dto/update-medicoregistro.dto";
import { MedicoregistroService } from "./medicoregistro.service";

/**
 * Expone los endpoints HTTP del dominio medicoregistro.
 */
@Controller("medicoregistro")
export class MedicoregistroController {
  constructor(private readonly medicoregistroService: MedicoregistroService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateMedicoregistroDto) {
    return this.medicoregistroService.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.medicoregistroService.findAll();
  }

  /**
   * Find by usuario.
   * @param usuarioId Identificador asociado a usuario.
   * @returns Resultado de la operación.
   */
  @Get("usuario/:usuarioId")
  findByUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.medicoregistroService.findByUsuario(usuarioId);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.medicoregistroService.findOne(id);
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
    @Body() payload: UpdateMedicoregistroDto,
  ) {
    return this.medicoregistroService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.medicoregistroService.remove(id);
  }
}
