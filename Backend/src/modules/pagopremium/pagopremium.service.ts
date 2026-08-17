import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SuscripcionPremiumService } from "../suscripcionpremium/suscripcionpremium.service";
import { CrearPagoPremiumDto, RevisarPagoPremiumDto } from "./dto/pago-premium.dto";
import { PagoPremium } from "./pagopremium.entity";

@Injectable()
export class PagoPremiumService {
  constructor(@InjectRepository(PagoPremium) private readonly repository: Repository<PagoPremium>, private readonly subscriptions: SuscripcionPremiumService) {}

  async crear(usuarioId: number, payload: CrearPagoPremiumDto) {
    const content = Buffer.from(payload.comprobanteBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
    if (!content.length || content.length > 5 * 1024 * 1024) throw new BadRequestException("el comprobante debe ser un archivo válido de hasta 5 MB");
    const payment = this.repository.create({ usuarioId, banco: payload.banco, plan: payload.plan, comprobante: content, nombreComprobante: payload.nombreComprobante, mimeComprobante: payload.mimeComprobante, estado: "pendiente", creadoEn: new Date() });
    return this.resumen(await this.repository.save(payment));
  }

  async listar() { return (await this.repository.find({ order: { creadoEn: "DESC" } })).map((item) => this.resumen(item)); }
  async misPagos(usuarioId: number) { return (await this.repository.find({ where: { usuarioId }, order: { creadoEn: "DESC" } })).map((item) => this.resumen(item)); }

  async revisar(id: number, payload: RevisarPagoPremiumDto, admin: string) {
    const payment = await this.repository.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`pago ${id} no encontrado`);
    if (payment.estado !== "pendiente") throw new BadRequestException("este pago ya fue revisado");
    payment.estado = payload.estado;
    payment.observaciones = payload.observaciones ?? null;
    payment.revisadoPor = admin;
    payment.revisadoEn = new Date();
    if (payload.estado === "aprobado") {
      const subscription = await this.subscriptions.asignar({ usuarioId: payment.usuarioId, plan: payment.plan }, admin);
      payment.suscripcionPremiumId = subscription.id;
    }
    return this.resumen(await this.repository.save(payment));
  }

  private resumen(payment: PagoPremium) { const { comprobante, ...data } = payment; return { ...data, tieneComprobante: Boolean(comprobante?.length) }; }
}
