import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionhorario.
 */
@Entity({ name: "institucionhorario" })
export class Institucionhorario {
  /**
   * Identificador persistido para `institucionHorarioId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionhorarioid", type: "int" })
  institucionHorarioId!: number;

  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @Column({ name: "institucionsaludid", type: "int", precision: 10 })
  institucionSaludId!: number;

  /**
   * Campo de datos asociado a `diaSemana`.
   */
  @Column({ name: "diasemana", type: "tinyint" })
  diaSemana!: number;

  /**
   * Campo de datos asociado a `horaInicio`.
   */
  @Column({ name: "horainicio", type: "time", precision: 0, nullable: true })
  horaInicio?: string | null;

  /**
   * Campo de datos asociado a `horaFin`.
   */
  @Column({ name: "horafin", type: "time", precision: 0, nullable: true })
  horaFin?: string | null;

  /**
   * Campo de datos asociado a `cerrado`.
   */
  @Column({ name: "cerrado", type: "bit" })
  cerrado!: boolean;

  /**
   * Campo de datos asociado a `veinticuatroHoras`.
   */
  @Column({ name: "veinticuatrohoras", type: "bit" })
  veinticuatroHoras!: boolean;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  observaciones?: string | null;

  /**
   * Campo de datos asociado a `activo`.
   */
  @Column({ name: "activo", type: "bit" })
  activo!: boolean;

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
