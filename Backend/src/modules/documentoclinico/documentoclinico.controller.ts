import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { DocumentoclinicoService } from "./documentoclinico.service";
import { CreateDocumentoclinicoDto } from "./dto/create-documentoclinico.dto";
import { UpdateDocumentoclinicoDto } from "./dto/update-documentoclinico.dto";

/**
 * Expone los endpoints HTTP del dominio documentoclinico.
 */
@Controller("documentoclinico")
export class DocumentoclinicoController {
  constructor(
    private readonly documentoclinicoservice: DocumentoclinicoService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateDocumentoclinicoDto) {
    return this.documentoclinicoservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.documentoclinicoservice.findAll();
  }

  @Get(":id/archivo")
  getArchivo(@Param("id") id: string) {
    return this.documentoclinicoservice.getArchivo(id);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentoclinicoservice.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateDocumentoclinicoDto) {
    return this.documentoclinicoservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documentoclinicoservice.remove(id);
  }
}
