import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "presupuestomedico" })
export class PresupuestoMedico {
  @PrimaryGeneratedColumn({ name: "presupuestomedicoid" }) id!: number;
  @Column({ name: "usuarioid", type: "int" }) usuarioId!: number;
  @Column({ name: "mes", type: "char", length: 7 }) month!: string;
  @Column({ name: "limitemensual", type: "decimal", precision: 12, scale: 2, default: 0 }) limit!: number;
  @CreateDateColumn({ name: "creadoen", type: "datetime2", default: () => "SYSDATETIME()" }) creadoEn!: Date;
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", default: () => "SYSDATETIME()" }) modificadoEn!: Date;
}
