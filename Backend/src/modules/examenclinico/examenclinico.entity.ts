import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso examenclinico.
 */
@Entity({ name: "examenclinico" })
export class Examenclinico {
  /**
   * Identificador persistido para `examenclinicoId`.
   */
  @PrimaryGeneratedColumn({ name: "examenclinicoid", type: "int" })
  examenclinicoId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid", type: "int", precision: 10 })
  pacienteId!: number;

  /**
   * Identificador persistido para `consultaId`.
   */
  @Column({ name: "consultaid", type: "int", precision: 10, nullable: true })
  consultaId?: number | null;

  /**
   * Nombre descriptivo almacenado en `nombreExamen`.
   */
  @Column({ name: "nombreexamen", type: "nvarchar", length: 160 })
  nombreExamen!: string;

  /**
   * Campo de datos asociado a `tipoExamen`.
   */
  @Column({ name: "tipoexamen", type: "nvarchar", length: 120, nullable: true })
  tipoExamen?: string | null;

  /**
   * Campo de datos asociado a `laboratorio`.
   */
  @Column({
    name: "laboratorio",
    type: "nvarchar",
    length: 160,
    nullable: true,
  })
  laboratorio?: string | null;

  /**
   * Fecha asociada al campo `fechaExamen`.
   */
  @Column({ name: "fechaexamen", type: "date" })
  fechaExamen!: Date;

  /**
   * Fecha asociada al campo `fechaResultado`.
   */
  @Column({ name: "fecharesultado", type: "date", nullable: true })
  fechaResultado?: Date | null;

  /**
   * Campo de datos asociado a `resultadoTexto`.
   */
  @Column({
    name: "resultadotexto",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  resultadoTexto?: string | null;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: "max",
    nullable: true,
  })
  observaciones?: string | null;

  /**
   * Campo de datos asociado a `archivoPdf`.
   */
  @Column({
    name: "archivopdf",
    type: "varbinary",
    nullable: true,
    select: false,
  })
  archivoPdf?: Buffer | null;

  /**
   * Nombre descriptivo almacenado en `nombreArchivoPdf`.
   */
  @Column({
    name: "nombrearchivopdf",
    type: "nvarchar",
    length: 260,
    nullable: true,
  })
  nombreArchivoPdf?: string | null;

  /**
   * Campo de datos asociado a `mimeArchivoPdf`.
   */
  @Column({
    name: "mimearchivopdf",
    type: "nvarchar",
    length: 100,
    nullable: true,
  })
  mimeArchivoPdf?: string | null;

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
