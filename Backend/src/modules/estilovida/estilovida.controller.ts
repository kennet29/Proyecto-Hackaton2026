import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { EstilovidaService } from "./estilovida.service";
import { CreateEstilovidaDto } from "./dto/create-estilovida.dto";
import { UpdateEstilovidaDto } from "./dto/update-estilovida.dto";

/**
 * Expone los endpoints HTTP del dominio estilovida.
 */
@Controller("estilovida")
export class EstilovidaController {
  constructor(private readonly estilovidaservice: EstilovidaService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateEstilovidaDto) {
    return this.estilovidaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.estilovidaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.estilovidaservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateEstilovidaDto) {
    return this.estilovidaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.estilovidaservice.remove(id);
  }
}
