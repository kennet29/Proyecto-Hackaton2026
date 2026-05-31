import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { UsuariorolService } from "./usuariorol.service";
import { CreateUsuariorolDto } from "./dto/create-usuariorol.dto";
import { UpdateUsuariorolDto } from "./dto/update-usuariorol.dto";

/**
 * Expone los endpoints HTTP del dominio usuariorol.
 */
@Controller("usuariorol")
export class UsuariorolController {
  constructor(private readonly usuariorolservice: UsuariorolService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateUsuariorolDto) {
    return this.usuariorolservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.usuariorolservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usuariorolservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateUsuariorolDto) {
    return this.usuariorolservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usuariorolservice.remove(id);
  }
}
