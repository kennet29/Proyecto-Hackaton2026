import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { DatabaseService } from "./database.service";

/**
 * Expone los endpoints HTTP del dominio database.
 */
@Roles("admin", "superadmin")
@Controller("database")
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * List tables.
   * @returns Resultado de la operación.
   */
  @Get("tables")
  listTables(): string[] {
    return this.databaseService.listTables();
  }

  /**
   * Find all.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Colección de registros encontrados.
   */
  @Get(":table")
  findAll(@Param("table") table: string): Promise<Record<string, any>[]> {
    return this.databaseService.findAll(table);
  }

  /**
   * Find one.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":table/:id")
  findOne(
    @Param("table") table: string,
    @Param("id") id: string,
  ): Promise<Record<string, any>> {
    return this.databaseService.findOne(table, id);
  }

  /**
   * Create.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post(":table")
  create(
    @Param("table") table: string,
    @Body() payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    return this.databaseService.create(table, payload ?? {});
  }

  /**
   * Update.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":table/:id")
  update(
    @Param("table") table: string,
    @Param("id") id: string,
    @Body() payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    return this.databaseService.update(table, id, payload ?? {});
  }

  /**
   * Remove.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":table/:id")
  remove(
    @Param("table") table: string,
    @Param("id") id: string,
  ): Promise<void> {
    return this.databaseService.remove(table, id);
  }
}
