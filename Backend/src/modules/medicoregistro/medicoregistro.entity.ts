import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medicoregistro' })
export class Medicoregistro {
  @PrimaryGeneratedColumn({ name: 'medicoregistroid', type: 'int' })
  medicoregistroId!: number;

  @Column({ name: 'usuarioid', type: 'int', precision: 10 })
  usuarioId!: number;

  @Column({ name: 'hospitaltrabajo', type: 'nvarchar', length: 150 })
  hospitaltrabajo!: string;

  @Column({ name: 'titulo', type: 'nvarchar', length: 150 })
  titulo!: string;

  @Column({ name: 'codigominsa', type: 'nvarchar', length: 40, nullable: true })
  codigominsa?: string | null;

  @Column({ name: 'numerolicencia', type: 'nvarchar', length: 80 })
  numerolicencia!: string;

  @Column({ name: 'entidadcertificadora', type: 'nvarchar', length: 120, nullable: true })
  entidadcertificadora?: string | null;

  @Column({ name: 'especialidadprincipal', type: 'nvarchar', length: 120, nullable: true })
  especialidadprincipal?: string | null;

  @Column({ name: 'documentorespaldo', type: 'nvarchar', length: 260, nullable: true })
  documentorespaldo?: string | null;

  @Column({ name: 'fotocodigominsa', type: 'varbinary', nullable: true })
  fotocodigominsa?: Buffer | null;

  @Column({ name: 'fototitulo', type: 'varbinary', nullable: true })
  fototitulo?: Buffer | null;

  @Column({ name: 'estado', type: 'nvarchar', length: 30 })
  estado!: string;

  @Column({ name: 'fechasolicitud', type: 'datetime2', precision: 7 })
  fechasolicitud!: Date;

  @Column({ name: 'fecharevision', type: 'datetime2', precision: 7, nullable: true })
  fecharevision?: Date | null;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 400, nullable: true })
  observaciones?: string | null;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadopor?: string | null;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoen!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadopor?: string | null;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoen?: Date | null;
}
