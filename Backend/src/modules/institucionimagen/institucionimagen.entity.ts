import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionimagen' })
export class Institucionimagen {
  @PrimaryGeneratedColumn({ name: 'institucionimagenid', type: 'int' })
  institucionImagenId!: number;

  @Column({ name: 'institucionsaludid', type: 'int', precision: 10 })
  institucionSaludId!: number;

  @Column({ name: 'tipoimagen', type: 'nvarchar', length: 30 })
  tipoImagen!: string;

  @Column({ name: 'titulo', type: 'nvarchar', length: 120, nullable: true })
  titulo?: string | null;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 250, nullable: true })
  descripcion?: string | null;

  @Column({ name: 'nombrearchivo', type: 'nvarchar', length: 180, nullable: true })
  nombreArchivo?: string | null;

  @Column({ name: 'mimetype', type: 'nvarchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'imagen', type: 'varbinary' })
  imagen!: Buffer;

  @Column({ name: 'esprincipal', type: 'bit' })
  esPrincipal!: boolean;

  @Column({ name: 'ordenvisual', type: 'int', precision: 10, nullable: true })
  ordenVisual?: number | null;

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
