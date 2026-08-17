import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "pagopremium" })
export class PagoPremium {
  @PrimaryGeneratedColumn({ name: "pagopremiumid" }) id!: number;
  @Column({ name: "usuarioid", type: "int" }) usuarioId!: number;
  @Column({ name: "banco", type: "nvarchar", length: 20 }) banco!: "banpro" | "bac" | "lafise";
  @Column({ name: "plan", type: "nvarchar", length: 20 }) plan!: "mensual" | "trimestral";
  @Column({ name: "comprobante", type: "varbinary" }) comprobante!: Buffer;
  @Column({ name: "nombrecomprobante", type: "nvarchar", length: 260 }) nombreComprobante!: string;
  @Column({ name: "mimecomprobante", type: "nvarchar", length: 100 }) mimeComprobante!: string;
  @Column({ name: "estado", type: "nvarchar", length: 20 }) estado!: "pendiente" | "aprobado" | "rechazado";
  @Column({ name: "observaciones", type: "nvarchar", length: 400, nullable: true }) observaciones?: string | null;
  @Column({ name: "suscripcionpremiumid", type: "int", nullable: true }) suscripcionPremiumId?: number | null;
  @Column({ name: "revisadopor", type: "nvarchar", length: 60, nullable: true }) revisadoPor?: string | null;
  @Column({ name: "revisadoen", type: "datetime2", nullable: true }) revisadoEn?: Date | null;
  @Column({ name: "creadoen", type: "datetime2" }) creadoEn!: Date;
}
