import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Define el tipo permiso tipo utilizado por el backend.
 */
export type PermisoTipo = "temporal" | "permanente";
/**
 * Define el tipo permiso estado utilizado por el backend.
 */
export type PermisoEstado = "activo" | "revocado" | "expirado";

/**
 * Entidad TypeORM que modela el recurso permiso acceso.
 */
@Entity({ name: "permisoacceso" })
export class PermisoAcceso {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn({ name: "permisoid" })
  id!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid" })
  pacienteId!: number;

  /**
   * Identificador persistido para `medicoId`.
   */
  @Column({ name: "medicoid" })
  medicoId!: number;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 20 })
  tipo!: PermisoTipo;

  /**
   * Campo de datos asociado a `duracion`.
   */
  @Column({ name: "duracion", type: "nvarchar", length: 5, nullable: true })
  duracion?: string | null;

  /**
   * Fecha asociada al campo `fechaInicio`.
   */
  @Column({ name: "fechainicio", type: "datetime2" })
  fechaInicio!: Date;

  /**
   * Fecha asociada al campo `fechaFin`.
   */
  @Column({ name: "fechafin", type: "datetime2", nullable: true })
  fechaFin?: Date | null;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 20 })
  estado!: PermisoEstado;

  /**
   * Campo de datos asociado a `notas`.
   */
  @Column({ name: "notas", type: "nvarchar", length: 200, nullable: true })
  notas?: string | null;

  /**
   * Campo de datos asociado a `creadoPor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadoPor?: string | null;

  /**
   * Campo de datos asociado a `creadoEn`.
   */
  @CreateDateColumn({
    name: "creadoen",
    type: "datetime2",
    default: () => "SYSDATETIME()",
  })
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
  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", nullable: true })
  modificadoEn?: Date | null;
}
