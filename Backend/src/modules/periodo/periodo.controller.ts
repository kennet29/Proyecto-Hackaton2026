import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CreatePeriodoDto } from "./dto/create-periodo.dto";
import { RegisterPeriodoSintomasDto } from "./dto/register-periodo-sintomas.dto";
import { UpdatePeriodoDto } from "./dto/update-periodo.dto";
import { PeriodoService } from "./periodo.service";

/**
 * Expone los endpoints HTTP del dominio periodo.
 */
@Controller("periodo")
export class PeriodoController {
  constructor(private readonly periodoService: PeriodoService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Post()
  create(@Body() payload: CreatePeriodoDto) {
    return this.periodoService.create(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Get()
  findAll() {
    return this.periodoService.findAll();
  }

  /**
   * Get calendar.
   * @param pacienteId Identificador asociado a paciente.
   * @param mes Valor del parámetro `mes`.
   * @param anio Valor del parámetro `anio`.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("calendario/:pacienteId")
  getCalendar(
    @Param("pacienteId", ParseIntPipe) pacienteId: number,
    @Query("mes") mes?: string,
    @Query("anio") anio?: string,
  ) {
    return this.periodoService.getCalendar(
      pacienteId,
      mes ? Number(mes) : undefined,
      anio ? Number(anio) : undefined,
    );
  }

  /**
   * Get historial.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/historial")
  getHistorial(@Param("pacienteId", ParseIntPipe) pacienteId: number) {
    return this.periodoService.getHistorial(pacienteId);
  }

  /**
   * Get prediction.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/prediccion")
  getPrediction(@Param("pacienteId", ParseIntPipe) pacienteId: number) {
    return this.periodoService.getPrediction(pacienteId);
  }

  /**
   * Get medical report.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Resultado de la consulta solicitada.
   */
  @Get("paciente/:pacienteId/reporte-medico")
  getMedicalReport(@Param("pacienteId", ParseIntPipe) pacienteId: number) {
    return this.periodoService.getMedicalReport(pacienteId);
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.periodoService.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdatePeriodoDto,
  ) {
    return this.periodoService.update(id, payload);
  }

  /**
   * Register symptoms.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Patch(":id/sintomas")
  registerSymptoms(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: RegisterPeriodoSintomasDto,
  ) {
    return this.periodoService.registerSymptoms(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.periodoService.remove(id);
  }
}
