import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { TipocondicioncronicaService } from "./tipocondicioncronica.service";
import { CreateTipocondicioncronicaDto } from "./dto/create-tipocondicioncronica.dto";
import { UpdateTipocondicioncronicaDto } from "./dto/update-tipocondicioncronica.dto";

/**
 * Expone los endpoints HTTP del dominio tipocondicioncronica.
 */
@Controller("tipocondicioncronica")
export class TipocondicioncronicaController {
  constructor(
    private readonly tipocondicioncronicaservice: TipocondicioncronicaService,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreateTipocondicioncronicaDto) {
    return this.tipocondicioncronicaservice.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.tipocondicioncronicaservice.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tipocondicioncronicaservice.findOne(id);
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
    @Body() payload: UpdateTipocondicioncronicaDto,
  ) {
    return this.tipocondicioncronicaservice.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tipocondicioncronicaservice.remove(id);
  }
}
