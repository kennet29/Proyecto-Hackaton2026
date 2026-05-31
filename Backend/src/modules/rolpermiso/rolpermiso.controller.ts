import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { RolpermisoService } from "./rolpermiso.service";
import { CreateRolpermisoDto } from "./dto/create-rolpermiso.dto";
import { UpdateRolpermisoDto } from "./dto/update-rolpermiso.dto";

/**
 * Expone los endpoints HTTP del dominio rolpermiso.
 */
@Controller("rolpermiso")
export class RolpermisoController {
  constructor(private readonly rolpermisoservice: RolpermisoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateRolpermisoDto) {
    return this.rolpermisoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.rolpermisoservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.rolpermisoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateRolpermisoDto) {
    return this.rolpermisoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.rolpermisoservice.remove(id);
  }
}
