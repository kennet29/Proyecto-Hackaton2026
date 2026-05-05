import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionhorario' })
export class Institucionhorario {
  @PrimaryGeneratedColumn({ name: 'institucionhorarioid', type: 'int' })
  institucionHorarioId!: number;

  @Column({ name: 'institucionsaludid', type: 'int', precision: 10 })
  institucionSaludId!: number;

  @Column({ name: 'diasemana', type: 'tinyint' })
  diaSemana!: number;

  @Column({ name: 'horainicio', type: 'time', precision: 0, nullable: true })
  horaInicio?: string | null;

  @Column({ name: 'horafin', type: 'time', precision: 0, nullable: true })
  horaFin?: string | null;

  @Column({ name: 'cerrado', type: 'bit' })
  cerrado!: boolean;

  @Column({ name: 'veinticuatrohoras', type: 'bit' })
  veinticuatroHoras!: boolean;

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
