import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionsalud.
 */
@Entity({ name: "institucionsalud" })
export class Institucionsalud {
  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionsaludid", type: "int" })
  institucionSaludId!: number;

  /**
   * Nombre descriptivo almacenado en `nombre`.
   */
  @Column({ name: "nombre", type: "nvarchar", length: 160 })
  nombre!: string;

  /**
   * Campo de datos asociado a `tipo`.
   */
  @Column({ name: "tipo", type: "nvarchar", length: 20 })
  tipo!: string;

  /**
   * Texto descriptivo del campo `descripcion`.
   */
  @Column({
    name: "descripcion",
    type: "nvarchar",
    length: 500,
    nullable: true,
  })
  descripcion?: string | null;

  /**
   * Número de contacto asociado a `telefono`.
   */
  @Column({ name: "telefono", type: "nvarchar", length: 40, nullable: true })
  telefono?: string | null;

  /**
   * Campo de datos asociado a `correo`.
   */
  @Column({ name: "correo", type: "nvarchar", length: 120, nullable: true })
  correo?: string | null;

  /**
   * Campo de datos asociado a `sitioWeb`.
   */
  @Column({ name: "sitioweb", type: "nvarchar", length: 200, nullable: true })
  sitioWeb?: string | null;

  /**
   * Campo de datos asociado a `direccion`.
   */
  @Column({ name: "direccion", type: "nvarchar", length: 250, nullable: true })
  direccion?: string | null;

  /**
   * Campo de datos asociado a `ciudad`.
   */
  @Column({ name: "ciudad", type: "nvarchar", length: 120, nullable: true })
  ciudad?: string | null;

  /**
   * Campo de datos asociado a `departamento`.
   */
  @Column({
    name: "departamento",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  departamento?: string | null;

  /**
   * Campo de datos asociado a `horarioAtencion`.
   */
  @Column({
    name: "horarioatencion",
    type: "nvarchar",
    length: 200,
    nullable: true,
  })
  horarioAtencion?: string | null;

  /**
   * Campo de datos asociado a `latitud`.
   */
  @Column({
    name: "latitud",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
  })
  latitud?: number | null;

  /**
   * Campo de datos asociado a `longitud`.
   */
  @Column({
    name: "longitud",
    type: "decimal",
    precision: 10,
    scale: 6,
    nullable: true,
  })
  longitud?: number | null;

  /**
   * Campo de datos asociado a `logoImagen`.
   */
  @Column({ name: "logoimagen", type: "varbinary", nullable: true })
  logoImagen?: Buffer | null;

  /**
   * Campo de datos asociado a `logoMimeType`.
   */
  @Column({
    name: "logomimetype",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  logoMimeType?: string | null;

  /**
   * Nombre descriptivo almacenado en `logoNombreArchivo`.
   */
  @Column({
    name: "logonombrearchivo",
    type: "nvarchar",
    length: 180,
    nullable: true,
  })
  logoNombreArchivo?: string | null;

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
