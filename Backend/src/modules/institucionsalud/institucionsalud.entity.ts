import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionsalud' })
export class Institucionsalud {
  @PrimaryGeneratedColumn({ name: 'institucionsaludid', type: 'int' })
  institucionSaludId!: number;

  @Column({ name: 'nombre', type: 'nvarchar', length: 160 })
  nombre!: string;

  @Column({ name: 'tipo', type: 'nvarchar', length: 20 })
  tipo!: string;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 500, nullable: true })
  descripcion?: string | null;

  @Column({ name: 'telefono', type: 'nvarchar', length: 40, nullable: true })
  telefono?: string | null;

  @Column({ name: 'correo', type: 'nvarchar', length: 120, nullable: true })
  correo?: string | null;

  @Column({ name: 'sitioweb', type: 'nvarchar', length: 200, nullable: true })
  sitioWeb?: string | null;

  @Column({ name: 'direccion', type: 'nvarchar', length: 250, nullable: true })
  direccion?: string | null;

  @Column({ name: 'ciudad', type: 'nvarchar', length: 120, nullable: true })
  ciudad?: string | null;

  @Column({ name: 'departamento', type: 'nvarchar', length: 120, nullable: true })
  departamento?: string | null;

  @Column({ name: 'horarioatencion', type: 'nvarchar', length: 200, nullable: true })
  horarioAtencion?: string | null;

  @Column({ name: 'latitud', type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitud?: number | null;

  @Column({ name: 'longitud', type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitud?: number | null;

  @Column({ name: 'logoimagen', type: 'varbinary', nullable: true })
  logoImagen?: Buffer | null;

  @Column({ name: 'logomimetype', type: 'nvarchar', length: 120, nullable: true })
  logoMimeType?: string | null;

  @Column({ name: 'logonombrearchivo', type: 'nvarchar', length: 180, nullable: true })
  logoNombreArchivo?: string | null;

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
