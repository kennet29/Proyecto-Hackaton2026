import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThan, Repository } from "typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { SuscripcionPremiumService } from "../suscripcionpremium/suscripcionpremium.service";
import { CrearPagoPremiumDto, RevisarPagoPremiumDto } from "./dto/pago-premium.dto";
import { PagoPremium } from "./pagopremium.entity";

const MAX_RECEIPTS_PER_HOUR = 3;
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class PagoPremiumService {
  constructor(
    @InjectRepository(PagoPremium) private readonly repository: Repository<PagoPremium>,
    @InjectRepository(Usuario) private readonly usersRepository: Repository<Usuario>,
    private readonly subscriptions: SuscripcionPremiumService,
  ) {}

  async crear(usuarioId: number, payload: CrearPagoPremiumDto) {
    const content = this.decodeAndValidateReceipt(payload.comprobanteBase64, payload.mimeComprobante);
    if (!content.length || content.length > RECEIPT_MAX_BYTES) throw new BadRequestException("el comprobante debe ser un archivo valido de hasta 5 MB");
    const submissionsLastHour = await this.repository.count({ where: { usuarioId, creadoEn: MoreThan(new Date(Date.now() - 60 * 60 * 1000)) } });
    if (submissionsLastHour >= MAX_RECEIPTS_PER_HOUR) throw new HttpException("solo puedes enviar hasta 3 comprobantes por hora", HttpStatus.TOO_MANY_REQUESTS);
    const payment = this.repository.create({ usuarioId, banco: payload.banco, plan: payload.plan, comprobante: content, nombreComprobante: payload.nombreComprobante, mimeComprobante: payload.mimeComprobante, estado: "pendiente", creadoEn: new Date() });
    return this.resumen(await this.repository.save(payment));
  }

  async listar() {
    const payments = await this.repository.find({ order: { creadoEn: "DESC" } });
    const userIds = [...new Set(payments.map((payment) => payment.usuarioId))];
    const users = userIds.length ? await this.usersRepository.find({ where: { id: In(userIds) }, select: { id: true, username: true } }) : [];
    const namesByUserId = new Map(users.map((user) => [user.id, user.username]));
    return payments.map((item) => ({ ...this.resumen(item), usuario: { id: item.usuarioId, username: namesByUserId.get(item.usuarioId) ?? `Usuario #${item.usuarioId}` } }));
  }

  async misPagos(usuarioId: number) {
    return (await this.repository.find({ where: { usuarioId }, order: { creadoEn: "DESC" } })).map((item) => this.resumen(item));
  }

  async revisar(id: number, payload: RevisarPagoPremiumDto, admin: string) {
    return this.repository.manager.transaction(async (manager) => {
      const payments = manager.getRepository(PagoPremium);
      const payment = await payments.findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!payment) throw new NotFoundException(`pago ${id} no encontrado`);
      if (payment.estado !== "pendiente") throw new BadRequestException("este pago ya fue revisado");
      payment.estado = payload.estado;
      payment.observaciones = payload.observaciones ?? null;
      payment.revisadoPor = admin;
      payment.revisadoEn = new Date();
      if (payload.estado === "aprobado") {
        const subscription = await this.subscriptions.asignar({ usuarioId: payment.usuarioId, plan: payment.plan }, admin, manager);
        payment.suscripcionPremiumId = subscription.id;
      }
      return this.resumen(await payments.save(payment));
    });
  }

  private decodeAndValidateReceipt(value: string, mimeType: CrearPagoPremiumDto["mimeComprobante"]): Buffer {
    const base64 = value.replace(/^data:[^;]+;base64,/, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) throw new BadRequestException("el comprobante no contiene Base64 valido");
    const content = Buffer.from(base64, "base64");
    const signatures: Record<CrearPagoPremiumDto["mimeComprobante"], Buffer> = {
      "application/pdf": Buffer.from("%PDF-"),
      "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
      "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    };
    const signature = signatures[mimeType];
    if (!signature || content.length < signature.length || !content.subarray(0, signature.length).equals(signature)) throw new BadRequestException("el archivo no coincide con el tipo de comprobante indicado");
    return content;
  }

  private resumen(payment: PagoPremium) {
    const { comprobante, ...data } = payment;
    return { ...data, tieneComprobante: Boolean(comprobante?.length) };
  }
}
