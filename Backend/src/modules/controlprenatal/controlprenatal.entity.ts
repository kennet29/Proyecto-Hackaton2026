import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso controlprenatal.
 */
@Entity({ name: "controlprenatal" })
export class Controlprenatal {
  /**
   * Identificador persistido para `controlId`.
   */
  @PrimaryGeneratedColumn({ name: "controlid", type: "int" })
  controlId!: number;

  /**
   * Identificador persistido para `embarazoId`.
   */
  @Column({ name: "embarazoid", type: "int", precision: 10 })
  embarazoId!: number;

  /**
   * Fecha asociada al campo `fechacontrol`.
   */
  @Column({ name: "fechacontrol", type: "date" })
  fechacontrol!: Date;

  /**
   * Campo de datos asociado a `semanagestacion`.
   */
  @Column({
    name: "semanagestacion",
    type: "int",
    precision: 10,
    nullable: true,
  })
  semanagestacion?: number;

  /**
   * Campo de datos asociado a `presionarterial`.
   */
  @Column({
    name: "presionarterial",
    type: "nvarchar",
    length: 20,
    nullable: true,
  })
  presionarterial?: string;

  /**
   * Campo de datos asociado a `peso`.
   */
  @Column({
    name: "peso",
    type: "decimal",
    precision: 6,
    scale: 2,
    nullable: true,
  })
  peso?: number;

  /**
   * Campo de datos asociado a `fetalheartrate`.
   */
  @Column({
    name: "fetalheartrate",
    type: "int",
    precision: 10,
    nullable: true,
  })
  fetalheartrate?: number;

  /**
   * Campo de datos asociado a `intervenciones`.
   */
  @Column({ name: "intervenciones", type: "nvarchar", nullable: true })
  intervenciones?: string;

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
