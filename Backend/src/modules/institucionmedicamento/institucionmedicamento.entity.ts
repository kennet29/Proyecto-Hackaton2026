import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionmedicamento.
 */
@Entity({ name: "institucionmedicamento" })
export class Institucionmedicamento {
  /**
   * Identificador persistido para `institucionMedicamentoId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionmedicamentoid", type: "int" })
  institucionMedicamentoId!: number;

  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @Column({ name: "institucionsaludid", type: "int", precision: 10 })
  institucionSaludId!: number;

  /**
   * Identificador persistido para `medicamentoRaroId`.
   */
  @Column({ name: "medicamentoraroid", type: "int", precision: 10 })
  medicamentoRaroId!: number;

  /**
   * Campo de datos asociado a `disponibilidad`.
   */
  @Column({ name: "disponibilidad", type: "nvarchar", length: 20 })
  disponibilidad!: string;

  /**
   * Campo de datos asociado a `cantidadEstimada`.
   */
  @Column({
    name: "cantidadestimada",
    type: "int",
    precision: 10,
    nullable: true,
  })
  cantidadEstimada?: number | null;

  /**
   * Campo de datos asociado a `precioReferencia`.
   */
  @Column({
    name: "precioreferencia",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioReferencia?: number | null;

  /**
   * Campo de datos asociado a `moneda`.
   */
  @Column({ name: "moneda", type: "nvarchar", length: 10, nullable: true })
  moneda?: string | null;

  /**
   * Fecha asociada al campo `fechaUltimaActualizacion`.
   */
  @Column({ name: "fechaultimaactualizacion", type: "datetime2", precision: 7 })
  fechaUltimaActualizacion!: Date;

  /**
   * Campo de datos asociado a `contactoAbastecimiento`.
   */
  @Column({
    name: "contactoabastecimiento",
    type: "nvarchar",
    length: 160,
    nullable: true,
  })
  contactoAbastecimiento?: string | null;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: 400,
    nullable: true,
  })
  observaciones?: string | null;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string | null;

  /**
   * Campo de datos asociado a `creadoEn`.
   */
  @Column({ name: "creadoen", type: "datetime2", precision: 7 })
  creadoEn!: Date;

  /**
   * Campo de datos asociado a `modificadoPor`.
   */
  @Column({
    name: "modificadopor",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  modificadoPor?: string | null;

  /**
   * Campo de datos asociado a `modificadoEn`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoEn?: Date | null;
}
