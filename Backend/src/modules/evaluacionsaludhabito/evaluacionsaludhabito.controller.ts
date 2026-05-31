import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { EvaluacionsaludhabitoService } from "./evaluacionsaludhabito.service";
import { CreateEvaluacionsaludhabitoDto } from "./dto/create-evaluacionsaludhabito.dto";
import { UpdateEvaluacionsaludhabitoDto } from "./dto/update-evaluacionsaludhabito.dto";

/**
 * Expone los endpoints HTTP del dominio evaluacionsaludhabito.
 */
@Controller("evaluacionsaludhabito")
export class EvaluacionsaludhabitoController {
  constructor(
    private readonly evaluacionsaludhabitoservice: EvaluacionsaludhabitoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateEvaluacionsaludhabitoDto) {
    return this.evaluacionsaludhabitoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.evaluacionsaludhabitoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.evaluacionsaludhabitoservice.findOne(id);
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
    @Body() payload: UpdateEvaluacionsaludhabitoDto,
  ) {
    return this.evaluacionsaludhabitoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.evaluacionsaludhabitoservice.remove(id);
  }
}
