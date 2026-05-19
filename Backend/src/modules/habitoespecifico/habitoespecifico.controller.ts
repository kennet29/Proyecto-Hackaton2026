import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { HabitoespecificoService } from "./habitoespecifico.service";
import { CreateHabitoespecificoDto } from "./dto/create-habitoespecifico.dto";
import { UpdateHabitoespecificoDto } from "./dto/update-habitoespecifico.dto";

/**
 * Expone los endpoints HTTP del dominio habitoespecifico.
 */
@Controller("habitoespecifico")
export class HabitoespecificoController {
  constructor(
    private readonly habitoespecificoservice: HabitoespecificoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateHabitoespecificoDto) {
    return this.habitoespecificoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.habitoespecificoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.habitoespecificoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateHabitoespecificoDto) {
    return this.habitoespecificoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.habitoespecificoservice.remove(id);
  }
}
