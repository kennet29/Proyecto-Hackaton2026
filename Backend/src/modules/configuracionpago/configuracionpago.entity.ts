import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "configuracionpago" })
export class ConfiguracionPago {
  @PrimaryGeneratedColumn({ name: "configuracionpagoid" }) id!: number;
  @Column({ name: "banco", type: "nvarchar", length: 20 }) banco!: "banpro" | "bac" | "lafise";
  @Column({ name: "titularcuenta", type: "nvarchar", length: 120, nullable: true }) titularCuenta?: string | null;
  @Column({ name: "numerocuenta", type: "nvarchar", length: 80, nullable: true }) numeroCuenta?: string | null;
  @Column({ name: "moneda", type: "nvarchar", length: 10 }) moneda!: string;
  @Column({ name: "tipocambio", type: "decimal", precision: 12, scale: 4, nullable: true }) tipoCambio?: number | null;
  @Column({ name: "activo", type: "bit" }) activo!: boolean;
  @Column({ name: "modificadoen", type: "datetime2", nullable: true }) modificadoEn?: Date | null;
  @Column({ name: "modificadopor", type: "nvarchar", length: 60, nullable: true }) modificadoPor?: string | null;
}
