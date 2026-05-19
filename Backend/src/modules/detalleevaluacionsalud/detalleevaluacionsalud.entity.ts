import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso detalleevaluacionsalud.
 */
@Entity({ name: "detalleevaluacionsalud" })
export class Detalleevaluacionsalud {
  /**
   * Identificador persistido para `detalleId`.
   */
  @PrimaryGeneratedColumn({ name: "detalleid", type: "int" })
  detalleId!: number;

  /**
   * Identificador persistido para `evaluacionId`.
   */
  @Column({ name: "evaluacionid", type: "int", precision: 10 })
  evaluacionId!: number;

  /**
   * Identificador persistido para `habitoId`.
   */
  @Column({ name: "habitoid", type: "int", precision: 10, nullable: true })
  habitoId?: number;

  /**
   * Campo de datos asociado a `componente`.
   */
  @Column({ name: "componente", type: "nvarchar", length: 80, nullable: true })
  componente?: string;

  /**
   * Campo de datos asociado a `peso`.
   */
  @Column({
    name: "peso",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  peso?: number;

  /**
   * Campo de datos asociado a `comentario`.
   */
  @Column({ name: "comentario", type: "nvarchar", length: 200, nullable: true })
  comentario?: string;

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
