import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso institucionimagen.
 */
@Entity({ name: "institucionimagen" })
export class Institucionimagen {
  /**
   * Identificador persistido para `institucionImagenId`.
   */
  @PrimaryGeneratedColumn({ name: "institucionimagenid", type: "int" })
  institucionImagenId!: number;

  /**
   * Identificador persistido para `institucionSaludId`.
   */
  @Column({ name: "institucionsaludid", type: "int", precision: 10 })
  institucionSaludId!: number;

  /**
   * Campo de datos asociado a `tipoImagen`.
   */
  @Column({ name: "tipoimagen", type: "nvarchar", length: 30 })
  tipoImagen!: string;

  /**
   * Nombre descriptivo almacenado en `titulo`.
   */
  @Column({ name: "titulo", type: "nvarchar", length: 120, nullable: true })
  titulo?: string | null;

  /**
   * Texto descriptivo del campo `descripcion`.
   */
  @Column({
    name: "descripcion",
    type: "nvarchar",
    length: 250,
    nullable: true,
  })
  descripcion?: string | null;

  /**
   * Nombre descriptivo almacenado en `nombreArchivo`.
   */
  @Column({
    name: "nombrearchivo",
    type: "nvarchar",
    length: 180,
    nullable: true,
  })
  nombreArchivo?: string | null;

  /**
   * Campo de datos asociado a `mimeType`.
   */
  @Column({ name: "mimetype", type: "nvarchar", length: 120 })
  mimeType!: string;

  /**
   * Campo de datos asociado a `imagen`.
   */
  @Column({ name: "imagen", type: "varbinary" })
  imagen!: Buffer;

  /**
   * Indicador booleano persistido en `esPrincipal`.
   */
  @Column({ name: "esprincipal", type: "bit" })
  esPrincipal!: boolean;

  /**
   * Campo de datos asociado a `ordenVisual`.
   */
  @Column({ name: "ordenvisual", type: "int", precision: 10, nullable: true })
  ordenVisual?: number | null;

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
