/**
 * @file Backend/src/modules/configuracionpago/configuracionpago.service.ts
 * @description TypeScript module implementation.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ActualizarConfiguracionPagoDto } from "./dto/actualizar-configuracion-pago.dto";
import { ConfiguracionPago } from "./configuracionpago.entity";

@Injectable()
export class ConfiguracionPagoService {
  constructor(@InjectRepository(ConfiguracionPago) private readonly repository: Repository<ConfiguracionPago>) {}

  listar() { return this.repository.find({ where: { activo: true }, order: { banco: "ASC" } }); }
  listarAdmin() { return this.repository.find({ order: { banco: "ASC" } }); }

  async actualizar(banco: string, payload: ActualizarConfiguracionPagoDto, actor: string) {
    const config = await this.repository.findOne({ where: { banco: banco as ConfiguracionPago["banco"] } });
    if (!config) throw new NotFoundException(`configuración de ${banco} no encontrada`);
    Object.assign(config, payload, { modificadoEn: new Date(), modificadoPor: actor });
    return this.repository.save(config);
  }
}
