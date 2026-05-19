import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso medicacion.
 */
@Entity({ name: "medicacion" })
export class Medicacion {
  /**
   * Identificador persistido para `medicacionId`.
   */
  @PrimaryGeneratedColumn({ name: "medicacionid", type: "int" })
  medicacionId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `consultaId`.
   */
  @Column({ name: "consultaid", type: "int", precision: 10, nullable: true })
  consultaId?: number;

  /**
   * Nombre descriptivo almacenado en `nombremedicamento`.
   */
  @Column({ name: "nombremedicamento", type: "nvarchar", length: 150 })
  nombremedicamento!: string;

  /**
   * Campo de datos asociado a `presentacion`.
   */
  @Column({
    name: "presentacion",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  presentacion?: string;

  /**
   * Campo de datos asociado a `dosis`.
   */
  @Column({ name: "dosis", type: "nvarchar", length: 80, nullable: true })
  dosis?: string;

  /**
   * Campo de datos asociado a `viaadministracion`.
   */
  @Column({
    name: "viaadministracion",
    type: "nvarchar",
    length: 60,
    nullable: true,
  })
  viaadministracion?: string;

  /**
   * Campo de datos asociado a `indicaciones`.
   */
  @Column({ name: "indicaciones", type: "nvarchar", nullable: true })
  indicaciones?: string;

  /**
   * Fecha asociada al campo `fechainicio`.
   */
  @Column({ name: "fechainicio", type: "date" })
  fechainicio!: Date;

  /**
   * Fecha asociada al campo `fechafin`.
   */
  @Column({ name: "fechafin", type: "date", nullable: true })
  fechafin?: Date;

  /**
   * Campo de datos asociado a `medicacionactiva`.
   */
  @Column({ name: "medicacionactiva", type: "bit" })
  medicacionactiva!: boolean;

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
