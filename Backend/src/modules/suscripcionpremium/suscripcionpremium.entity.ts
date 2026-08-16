import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "suscripcionpremium" })
export class SuscripcionPremium {
  @PrimaryGeneratedColumn({ name: "suscripcionpremiumid" })
  id!: number;

  @Column({ name: "usuarioid", type: "int" })
  usuarioId!: number;

  @Column({ name: "token", type: "nvarchar", length: 80 })
  token!: string;

  @Column({ name: "plan", type: "nvarchar", length: 20 })
  plan!: "mensual" | "trimestral";

  @Column({ name: "fechainicio", type: "datetime2" })
  fechaInicio!: Date;

  @Column({ name: "fechavencimiento", type: "datetime2" })
  fechaVencimiento!: Date;

  @Column({ name: "activo", type: "bit" })
  activo!: boolean;

  @Column({ name: "asignadopor", type: "nvarchar", length: 60, nullable: true })
  asignadoPor?: string | null;

  @Column({ name: "creadoen", type: "datetime2" })
  creadoEn!: Date;
}
