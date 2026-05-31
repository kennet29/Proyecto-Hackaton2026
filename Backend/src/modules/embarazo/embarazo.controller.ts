import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { EmbarazoService } from "./embarazo.service";
import { CreateEmbarazoDto } from "./dto/create-embarazo.dto";
import { UpdateEmbarazoDto } from "./dto/update-embarazo.dto";

/**
 * Expone los endpoints HTTP del dominio embarazo.
 */
@Controller("embarazo")
export class EmbarazoController {
  constructor(private readonly embarazoservice: EmbarazoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateEmbarazoDto) {
    return this.embarazoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.embarazoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.embarazoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateEmbarazoDto) {
    return this.embarazoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.embarazoservice.remove(id);
  }
}
