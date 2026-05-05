import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionespecialidad' })
export class Institucionespecialidad {
  @PrimaryGeneratedColumn({ name: 'institucionespecialidadid', type: 'int' })
  institucionEspecialidadId!: number;

  @Column({ name: 'institucionsaludid', type: 'int', precision: 10 })
  institucionSaludId!: number;

  @Column({ name: 'especialidadid', type: 'int', precision: 10 })
  especialidadId!: number;

  @Column({ name: 'destacada', type: 'bit' })
  destacada!: boolean;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 200, nullable: true })
  observaciones?: string | null;

  @Column({ name: 'activo', type: 'bit' })
  activo!: boolean;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date | null;
}
