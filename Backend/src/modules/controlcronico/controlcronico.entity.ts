import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso controlcronico.
 */
@Entity({ name: "controlcronico" })
export class Controlcronico {
  /**
   * Identificador persistido para `controlcronicoId`.
   */
  @PrimaryGeneratedColumn({ name: "controlcronicoid", type: "int" })
  controlcronicoId!: number;

  /**
   * Identificador persistido para `condicioncronicaId`.
   */
  @Column({ name: "condicioncronicaid", type: "int", precision: 10 })
  condicioncronicaId!: number;

  /**
   * Fecha asociada al campo `fechacontrol`.
   */
  @Column({ name: "fechacontrol", type: "datetime2", precision: 7 })
  fechacontrol!: Date;

  /**
   * Campo de datos asociado a `indicador`.
   */
  @Column({ name: "indicador", type: "nvarchar", length: 120, nullable: true })
  indicador?: string;

  /**
   * Campo de datos asociado a `valor`.
   */
  @Column({
    name: "valor",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valor?: number;

  /**
   * Campo de datos asociado a `unidad`.
   */
  @Column({ name: "unidad", type: "nvarchar", length: 40, nullable: true })
  unidad?: string;

  /**
   * Campo de datos asociado a `resultado`.
   */
  @Column({ name: "resultado", type: "nvarchar", length: 150, nullable: true })
  resultado?: string;

  /**
   * Campo de datos asociado a `conclusiones`.
   */
  @Column({ name: "conclusiones", type: "nvarchar", nullable: true })
  conclusiones?: string;

  /**
   * Campo de datos asociado a `proximocontrol`.
   */
  @Column({ name: "proximocontrol", type: "date", nullable: true })
  proximocontrol?: Date;

  /**
   * Campo de datos asociado a `medico`.
   */
  @Column({ name: "medico", type: "nvarchar", length: 120, nullable: true })
  medico?: string;

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
