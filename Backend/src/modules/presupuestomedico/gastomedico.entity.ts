import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export const CATEGORIAS_GASTO_MEDICO = ["Consultas", "Medicamentos", "Exámenes", "Transporte", "Otros"] as const;
export type CategoriaGastoMedico = (typeof CATEGORIAS_GASTO_MEDICO)[number];

@Entity({ name: "gastomedicopresupuestado" })
export class GastoMedicoPresupuestado {
  @PrimaryGeneratedColumn({ name: "gastomedicoid" }) id!: number;
  @Column({ name: "presupuestomedicoid", type: "int" }) presupuestoMedicoId!: number;
  @Column({ name: "descripcion", type: "nvarchar", length: 180 }) description!: string;
  @Column({ name: "categoria", type: "nvarchar", length: 30 }) category!: CategoriaGastoMedico;
  @Column({ name: "monto", type: "decimal", precision: 12, scale: 2 }) amount!: number;
  @CreateDateColumn({ name: "creadoen", type: "datetime2", default: () => "SYSDATETIME()" }) creadoEn!: Date;
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", default: () => "SYSDATETIME()" }) modificadoEn!: Date;
}
