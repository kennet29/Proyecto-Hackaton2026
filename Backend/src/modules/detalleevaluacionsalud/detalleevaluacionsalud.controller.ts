import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { DetalleevaluacionsaludService } from "./detalleevaluacionsalud.service";
import { CreateDetalleevaluacionsaludDto } from "./dto/create-detalleevaluacionsalud.dto";
import { UpdateDetalleevaluacionsaludDto } from "./dto/update-detalleevaluacionsalud.dto";

/**
 * Expone los endpoints HTTP del dominio detalleevaluacionsalud.
 */
@Controller("detalleevaluacionsalud")
export class DetalleevaluacionsaludController {
  constructor(
    private readonly detalleevaluacionsaludservice: DetalleevaluacionsaludService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateDetalleevaluacionsaludDto) {
    return this.detalleevaluacionsaludservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.detalleevaluacionsaludservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.detalleevaluacionsaludservice.findOne(id);
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
    @Body() payload: UpdateDetalleevaluacionsaludDto,
  ) {
    return this.detalleevaluacionsaludservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.detalleevaluacionsaludservice.remove(id);
  }
}
