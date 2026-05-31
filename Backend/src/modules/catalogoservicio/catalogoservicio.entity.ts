import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso catalogoservicio.
 */
@Entity({ name: "catalogoservicio" })
export class Catalogoservicio {
  /**
   * Identificador persistido para `catalogoServicioId`.
   */
  @PrimaryGeneratedColumn({ name: "catalogoservicioid", type: "int" })
  catalogoServicioId!: number;

  /**
   * Campo de datos asociado a `codigo`.
   */
  @Column({ name: "codigo", type: "nvarchar", length: 40, nullable: true })
  codigo?: string | null;

  /**
   * Nombre descriptivo almacenado en `nombre`.
   */
  @Column({ name: "nombre", type: "nvarchar", length: 150 })
  nombre!: string;

  /**
   * Campo de datos asociado a `categoria`.
   */
  @Column({ name: "categoria", type: "nvarchar", length: 80, nullable: true })
  categoria?: string | null;

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
   * Indicador booleano persistido en `requierePreparacion`.
   */
  @Column({ name: "requierepreparacion", type: "bit" })
  requierePreparacion!: boolean;

  /**
   * Indicador booleano persistido en `requiereReferencia`.
   */
  @Column({ name: "requierereferencia", type: "bit" })
  requiereReferencia!: boolean;

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
