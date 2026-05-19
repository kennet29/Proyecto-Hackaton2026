import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entidad TypeORM que modela el recurso medicoregistro.
 */
@Entity({ name: "medicoregistro" })
export class Medicoregistro {
  /**
   * Identificador persistido para `medicoregistroId`.
   */
  @PrimaryGeneratedColumn({ name: "medicoregistroid", type: "int" })
  medicoregistroId!: number;

  /**
   * Identificador persistido para `usuarioId`.
   */
  @Column({ name: "usuarioid", type: "int", precision: 10 })
  usuarioId!: number;

  /**
   * Campo de datos asociado a `hospitaltrabajo`.
   */
  @Column({ name: "hospitaltrabajo", type: "nvarchar", length: 150 })
  hospitaltrabajo!: string;

  /**
   * Nombre descriptivo almacenado en `titulo`.
   */
  @Column({ name: "titulo", type: "nvarchar", length: 150 })
  titulo!: string;

  /**
   * Campo de datos asociado a `codigominsa`.
   */
  @Column({ name: "codigominsa", type: "nvarchar", length: 40, nullable: true })
  codigominsa?: string | null;

  /**
   * Campo de datos asociado a `numerolicencia`.
   */
  @Column({ name: "numerolicencia", type: "nvarchar", length: 80 })
  numerolicencia!: string;

  /**
   * Campo de datos asociado a `entidadcertificadora`.
   */
  @Column({
    name: "entidadcertificadora",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  entidadcertificadora?: string | null;

  /**
   * Indicador booleano persistido en `especialidadprincipal`.
   */
  @Column({
    name: "especialidadprincipal",
    type: "nvarchar",
    length: 120,
    nullable: true,
  })
  especialidadprincipal?: string | null;

  /**
   * Campo de datos asociado a `documentorespaldo`.
   */
  @Column({
    name: "documentorespaldo",
    type: "nvarchar",
    length: 260,
    nullable: true,
  })
  documentorespaldo?: string | null;

  /**
   * Campo de datos asociado a `fotocodigominsa`.
   */
  @Column({ name: "fotocodigominsa", type: "varbinary", nullable: true })
  fotocodigominsa?: Buffer | null;

  /**
   * Nombre descriptivo almacenado en `fototitulo`.
   */
  @Column({ name: "fototitulo", type: "varbinary", nullable: true })
  fototitulo?: Buffer | null;

  /**
   * Estado actual registrado en `estado`.
   */
  @Column({ name: "estado", type: "nvarchar", length: 30 })
  estado!: string;

  /**
   * Fecha asociada al campo `fechasolicitud`.
   */
  @Column({ name: "fechasolicitud", type: "datetime2", precision: 7 })
  fechasolicitud!: Date;

  /**
   * Fecha asociada al campo `fecharevision`.
   */
  @Column({
    name: "fecharevision",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  fecharevision?: Date | null;

  /**
   * Texto descriptivo del campo `observaciones`.
   */
  @Column({
    name: "observaciones",
    type: "nvarchar",
    length: 400,
    nullable: true,
  })
  observaciones?: string | null;

  /**
   * Campo de datos asociado a `creadopor`.
   */
  @Column({ name: "creadopor", type: "nvarchar", length: 60, nullable: true })
  creadopor?: string | null;

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
  modificadopor?: string | null;

  /**
   * Campo de datos asociado a `modificadoen`.
   */
  @Column({
    name: "modificadoen",
    type: "datetime2",
    precision: 7,
    nullable: true,
  })
  modificadoen?: Date | null;
}
