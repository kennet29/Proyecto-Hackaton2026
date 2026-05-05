import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'catalogoservicio' })
export class Catalogoservicio {
  @PrimaryGeneratedColumn({ name: 'catalogoservicioid', type: 'int' })
  catalogoServicioId!: number;

  @Column({ name: 'codigo', type: 'nvarchar', length: 40, nullable: true })
  codigo?: string | null;

  @Column({ name: 'nombre', type: 'nvarchar', length: 150 })
  nombre!: string;

  @Column({ name: 'categoria', type: 'nvarchar', length: 80, nullable: true })
  categoria?: string | null;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 500, nullable: true })
  descripcion?: string | null;

  @Column({ name: 'requierepreparacion', type: 'bit' })
  requierePreparacion!: boolean;

  @Column({ name: 'requierereferencia', type: 'bit' })
  requiereReferencia!: boolean;

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
