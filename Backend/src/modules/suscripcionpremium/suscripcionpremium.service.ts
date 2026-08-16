import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "crypto";
import { Repository } from "typeorm";
import { Usuario } from "../../users/entities/user.entity";
import { AsignarSuscripcionPremiumDto } from "./dto/asignar-suscripcion-premium.dto";
import { SuscripcionPremium } from "./suscripcionpremium.entity";

@Injectable()
export class SuscripcionPremiumService {
  constructor(
    @InjectRepository(SuscripcionPremium)
    private readonly repository: Repository<SuscripcionPremium>,
    @InjectRepository(Usuario)
    private readonly usersRepository: Repository<Usuario>,
  ) {}

  async asignar(payload: AsignarSuscripcionPremiumDto, asignadoPor: string) {
    const user = await this.usersRepository.findOne({ where: { id: payload.usuarioId } });
    if (!user) throw new NotFoundException(`usuario ${payload.usuarioId} no encontrado`);

    const fechaInicio = new Date();
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (payload.plan === "mensual" ? 1 : 3));

    await this.repository.update(
      { usuarioId: payload.usuarioId, activo: true },
      { activo: false },
    );

    const subscription = this.repository.create({
      usuarioId: payload.usuarioId,
      token: `PREM-${randomBytes(18).toString("hex").toUpperCase()}`,
      plan: payload.plan,
      fechaInicio,
      fechaVencimiento,
      activo: true,
      asignadoPor,
      creadoEn: fechaInicio,
    });
    return this.repository.save(subscription);
  }

  async listar() {
    const subscriptions = await this.repository.find({ order: { creadoEn: "DESC" } });
    return subscriptions.map((subscription) => this.conEstado(subscription));
  }

  async obtenerActual(usuarioId: number) {
    const subscription = await this.repository.findOne({
      where: { usuarioId, activo: true },
      order: { fechaVencimiento: "DESC" },
    });
    return subscription ? this.conEstado(subscription) : null;
  }

  private conEstado(subscription: SuscripcionPremium) {
    return { ...subscription, vigente: subscription.activo && subscription.fechaVencimiento > new Date() };
  }
}
