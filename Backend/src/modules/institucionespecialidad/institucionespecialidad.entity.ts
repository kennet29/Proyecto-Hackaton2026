import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionespecialidad.
 */
@Entity({ name: "institucionespecialidad" })
export class Institucionespecialidad {
  /**
   * Identificador persistido para `institucionEspecialidadId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionespecialidadid", type: "int" })
  institucionEspecialidadId!: number;

  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @Column({ name: "institucionsaludid", type: "int", precision: 10 })
  institucionSaludId!: number;

  /**
   * Identificador persistido para `especialidadId`.
   */
  @Column({ name: "especialidadid", type: "int", precision: 10 })
  especialidadId!: number;

  /**
   * Campo de datos asociado a `destacada`.
   */
  @Column({ name: "destacada", type: "bit" })
  destacada!: boolean;

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
