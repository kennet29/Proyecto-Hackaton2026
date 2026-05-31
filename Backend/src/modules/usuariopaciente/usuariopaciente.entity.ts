import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Entidad TypeORM que modela el recurso usuario paciente.
 */
@Entity({ name: "usuariopaciente" })
export class UsuarioPaciente {
  /**
   * Identificador persistido para `id`.
   */
  @PrimaryGeneratedColumn({ name: "usuariopacienteid" })
  id!: number;

  /**
   * Identificador persistido para `usuarioId`.
   */
  @Column({ name: "usuarioid" })
  usuarioId!: number;

  /**
   * Identificador persistido para `pacienteId`.
   */
  @Column({ name: "pacienteid" })
  pacienteId!: number;

  /**
   * Campo de datos asociado a `parentesco`.
   */
  @Column({ name: "parentesco", type: "nvarchar", length: 80, nullable: true })
  parentesco?: string | null;

  /**
   * Indicador booleano persistido en `esPrincipal`.
   */
  @Column({ name: "esprincipal", type: "bit", default: false })
  esPrincipal!: boolean;

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
