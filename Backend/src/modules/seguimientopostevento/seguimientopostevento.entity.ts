import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso seguimientopostevento.
 */
@Entity({ name: "seguimientopostevento" })
export class Seguimientopostevento {
  /**
   * Identificador persistido para `seguimientoPosteventoId`.
   */
  @PrimaryGeneratedColumn({ name: "seguimientoposteventoid", type: "int" })
  seguimientoPosteventoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Campo de datos asociado a `tipoEvento`.
   */
  @Column({ name: "tipoevento", type: "nvarchar", length: 30 })
  tipoEvento!: string;

  /**
   * Identificador persistido para `operacionId`.
   */
  @Column({ name: "operacionid", type: "int", precision: 10, nullable: true })
  operacionId?: number | null;

  /**
   * Identificador persistido para `lesionId`.
   */
  @Column({ name: "lesionid", type: "int", precision: 10, nullable: true })
  lesionId?: number | null;

  /**
   * Nombre descriptivo almacenado en `tituloEvento`.
   */
  @Column({ name: "tituloevento", type: "nvarchar", length: 160 })
  tituloEvento!: string;

  /**
   * Fecha asociada al campo `fechaEvento`.
   */
  @Column({ name: "fechaevento", type: "date" })
  fechaEvento!: Date;

  /**
   * Fecha asociada al campo `fechaSeguimiento`.
   */
  @Column({ name: "fechaseguimiento", type: "datetime2", precision: 7 })
  fechaSeguimiento!: Date;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 40 })
  estado!: string;

  /**
   * Campo de datos asociado a `evolucion`.
   */
  @Column({
    name: "evolucion",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  evolucion?: string | null;

  /**
   * Campo de datos asociado a `sintomas`.
   */
  @Column({ name: "sintomas", type: "nvarchar", length: "max", nullable: true })
  sintomas?: string | null;

  /**
   * Campo de datos asociado a `nivelDolor`.
   */
  @Column({ name: "niveldolor", type: "int", precision: 10, nullable: true })
  nivelDolor?: number | null;

  /**
   * Campo de datos asociado a `medicacionActual`.
   */
  @Column({
    name: "medicacionactual",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  medicacionActual?: string | null;

  /**
   * Campo de datos asociado a `cuidadosHogar`.
   */
  @Column({
    name: "cuidadoshogar",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  cuidadosHogar?: string | null;

  /**
   * Campo de datos asociado a `notas`.
   */
  @Column({ name: "notas", type: "nvarchar", length: "max", nullable: true })
  notas?: string | null;

  /**
   * Campo de datos asociado a `compartirConMedico`.
   */
  @Column({ name: "compartirconmedico", type: "bit" })
  compartirConMedico!: boolean;

  /**
   * Indicador booleano persistido en `requiereAtencion`.
   */
  @Column({ name: "requiereatencion", type: "bit" })
  requiereAtencion!: boolean;

  /**
   * Campo de datos asociado a `proximoControl`.
   */
  @Column({ name: "proximocontrol", type: "date", nullable: true })
  proximoControl?: Date | null;

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

  /**
   * Campo de datos asociado a `campoPrueba01`.
   */
  @Column({
    name: "campoprueba01",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba01?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba02`.
   */
  @Column({
    name: "campoprueba02",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba02?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba03`.
   */
  @Column({
    name: "campoprueba03",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba03?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba04`.
   */
  @Column({
    name: "campoprueba04",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba04?: string | null;

  /**
   * Campo de datos asociado a `campoPrueba05`.
   */
  @Column({
    name: "campoprueba05",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  campoPrueba05?: string | null;
}
