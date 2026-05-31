import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionservicio.
 */
@Entity({ name: "institucionservicio" })
export class Institucionservicio {
  /**
   * Identificador persistido para `institucionServicioId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionservicioid", type: "int" })
  institucionServicioId!: number;

  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @Column({ name: "institucionsaludid", type: "int", precision: 10 })
  institucionSaludId!: number;

  /**
   * Identificador persistido para `catalogoServicioId`.
   */
  @Column({ name: "catalogoservicioid", type: "int", precision: 10 })
  catalogoServicioId!: number;

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
   * Campo de datos asociado a `tiempoEntrega`.
   */
  @Column({
    name: "tiempoentrega",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  tiempoEntrega?: string | null;

  /**
   * Campo de datos asociado a `disponible`.
   */
  @Column({ name: "disponible", type: "bit" })
  disponible!: boolean;

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
