import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso adherenciacronica.
 */
@Entity({ name: "adherenciacronica" })
export class Adherenciacronica {
  /**
   * Identificador persistido para `adherenciacronicaId`.
   */
  @PrimaryGeneratedColumn({ name: "adherenciacronicaid", type: "int" })
  adherenciacronicaId!: number;

  /**
   * Identificador persistido para `condicioncronicaId`.
   */
  @Column({ name: "condicioncronicaid", type: "int", precision: 10 })
  condicioncronicaId!: number;

  /**
   * Identificador persistido para `medicacionId`.
   */
  @Column({ name: "medicacionid", type: "int", precision: 10, nullable: true })
  medicacionId?: number;

  /**
   * Fecha asociada al campo `fechaevento`.
   */
  @Column({ name: "fechaevento", type: "datetime2", precision: 7 })
  fechaevento!: Date;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 60 })
  tipo!: string;

  /**
   * Campo de datos asociado a `porcentaje`.
   */
  @Column({
    name: "porcentaje",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  porcentaje?: number;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40, nullable: true })
  estado?: string;

  /**
   * Texto descriptivo del campo `descripcion`.
   */
  @Column({
    name: "descripcion",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  descripcion?: string;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({ name: "observaciones", type: "nvarchar", nullable: true })
  observaciones?: string;

  /**
   * Campo de datos asociado a `creadopor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadopor?: string;

  /**
   * Campo de datos asociado a `creadoen`.
   */
  @Column({ name: "creadoen", type: "datetime2", precision: 7 })
  creadoen!: Date;

  /**
   * Campo de datos asociado a `modificadopor`.
   */
  @Column({
    name: "modificadopor",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  modificadopor?: string;

  /**
   * Campo de datos asociado a `modificadoen`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoen?: Date;

  /**
   * Campo de datos asociado a `campoprueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba01?: string;

  /**
   * Campo de datos asociado a `campoprueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba02?: string;

  /**
   * Campo de datos asociado a `campoprueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba03?: string;

  /**
   * Campo de datos asociado a `campoprueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba04?: string;

  /**
   * Campo de datos asociado a `campoprueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoprueba05?: string;
}
