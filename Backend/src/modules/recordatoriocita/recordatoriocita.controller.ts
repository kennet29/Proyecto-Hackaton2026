import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { RecordatoriocitaService } from "./recordatoriocita.service";
import { CreateRecordatoriocitaDto } from "./dto/create-recordatoriocita.dto";
import { UpdateRecordatoriocitaDto } from "./dto/update-recordatoriocita.dto";

/**
 * Expone los endpoints HTTP del dominio recordatoriocita.
 */
@Controller("recordatoriocita")
export class RecordatoriocitaController {
  constructor(
    private readonly recordatoriocitaservice: RecordatoriocitaService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateRecordatoriocitaDto) {
    return this.recordatoriocitaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.recordatoriocitaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.recordatoriocitaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateRecordatoriocitaDto) {
    return this.recordatoriocitaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.recordatoriocitaservice.remove(id);
  }
}
