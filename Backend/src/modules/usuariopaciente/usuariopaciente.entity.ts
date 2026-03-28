import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'usuariopaciente' })
export class UsuarioPaciente {
  @PrimaryGeneratedColumn({ name: 'usuariopacienteid' })
  id!: number;

  @Column({ name: 'usuarioid' })
  usuarioId!: number;

  @Column({ name: 'pacienteid' })
  pacienteId!: number;

  @Column({ name: 'parentesco', type: 'nvarchar', length: 80, nullable: true })
  parentesco?: string | null;

  @Column({ name: 'esprincipal', type: 'bit', default: false })
  esPrincipal!: boolean;

  @Column({ name: 'notas', type: 'nvarchar', length: 200, nullable: true })
  notas?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @CreateDateColumn({ name: 'creadoen', type: 'datetime2', default: () => 'SYSDATETIME()' })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @UpdateDateColumn({ name: 'modificadoen', type: 'datetime2', nullable: true })
  modificadoEn?: Date | null;
}
