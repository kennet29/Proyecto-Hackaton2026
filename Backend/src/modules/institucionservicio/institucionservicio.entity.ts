import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionservicio' })
export class Institucionservicio {
  @PrimaryGeneratedColumn({ name: 'institucionservicioid', type: 'int' })
  institucionServicioId!: number;

  @Column({ name: 'institucionsaludid', type: 'int', precision: 10 })
  institucionSaludId!: number;

  @Column({ name: 'catalogoservicioid', type: 'int', precision: 10 })
  catalogoServicioId!: number;

  @Column({ name: 'precioreferencia', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioReferencia?: number | null;

  @Column({ name: 'moneda', type: 'nvarchar', length: 10, nullable: true })
  moneda?: string | null;

  @Column({ name: 'tiempoentrega', type: 'nvarchar', length: 120, nullable: true })
  tiempoEntrega?: string | null;

  @Column({ name: 'disponible', type: 'bit' })
  disponible!: boolean;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 400, nullable: true })
  observaciones?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadoPor?: string | null;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoEn!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadoPor?: string | null;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoEn?: Date | null;
}
