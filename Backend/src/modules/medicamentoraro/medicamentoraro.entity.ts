import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso medicamentoraro.
 */
@Entity({ name: "medicamentoraro" })
export class Medicamentoraro {
  /**
   * Identificador persistido para `medicamentoRaroId`.
   */
  @PrimaryGeneratedColumn({ name: "medicamentoraroid", type: "int" })
  medicamentoRaroId!: number;

  /**
   * Nombre descriptivo almacenado en `nombreGenerico`.
   */
  @Column({ name: "nombregenerico", type: "nvarchar", length: 160 })
  nombreGenerico!: string;

  /**
   * Nombre descriptivo almacenado en `nombreComercial`.
   */
  @Column({
    name: "nombrecomercial",
    type: "nvarchar",
    length: 160,
    nullable: true,
  })
  nombreComercial?: string | null;

  /**
   * Campo de datos asociado a `presentacion`.
   */
  @Column({
    name: "presentacion",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  presentacion?: string | null;

  /**
   * Campo de datos asociado a `concentracion`.
   */
  @Column({
    name: "concentracion",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  concentracion?: string | null;

  /**
   * Campo de datos asociado a `fabricante`.
   */
  @Column({ name: "fabricante", type: "nvarchar", length: 120, nullable: true })
  fabricante?: string | null;

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
   * Indicador booleano persistido en `requiereReceta`.
   */
  @Column({ name: "requierereceta", type: "bit" })
  requiereReceta!: boolean;

  /**
   * Campo de datos asociado a `controlado`.
   */
  @Column({ name: "controlado", type: "bit" })
  controlado!: boolean;

  /**
   * Campo de datos asociado a `notasAbastecimiento`.
   */
  @Column({
    name: "notasabastecimiento",
    type: "nvarchar",
    length: 400,
    nullable: true,
  })
  notasAbastecimiento?: string | null;

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
