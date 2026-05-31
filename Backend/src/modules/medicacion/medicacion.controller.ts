import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { MedicacionService } from "./medicacion.service";
import { CreateMedicacionDto } from "./dto/create-medicacion.dto";
import { UpdateMedicacionDto } from "./dto/update-medicacion.dto";

/**
 * Expone los endpoints HTTP del dominio medicacion.
 */
@Controller("medicacion")
export class MedicacionController {
  constructor(private readonly medicacionservice: MedicacionService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateMedicacionDto) {
    return this.medicacionservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.medicacionservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.medicacionservice.findOne(id);
  }

  /**
   * Get receta.
   * @param id Identificador del registro objetivo.
   * @returns Archivo adjunto asociado a la medicación.
   */
  @Get(":id/receta")
  getReceta(@Param("id") id: string) {
    return this.medicacionservice.getReceta(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateMedicacionDto) {
    return this.medicacionservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.medicacionservice.remove(id);
  }
}
