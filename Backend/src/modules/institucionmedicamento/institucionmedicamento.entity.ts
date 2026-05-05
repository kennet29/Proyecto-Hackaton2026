import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'institucionmedicamento' })
export class Institucionmedicamento {
  @PrimaryGeneratedColumn({ name: 'institucionmedicamentoid', type: 'int' })
  institucionMedicamentoId!: number;

  @Column({ name: 'institucionsaludid', type: 'int', precision: 10 })
  institucionSaludId!: number;

  @Column({ name: 'medicamentoraroid', type: 'int', precision: 10 })
  medicamentoRaroId!: number;

  @Column({ name: 'disponibilidad', type: 'nvarchar', length: 20 })
  disponibilidad!: string;

  @Column({ name: 'cantidadestimada', type: 'int', precision: 10, nullable: true })
  cantidadEstimada?: number | null;

  @Column({ name: 'precioreferencia', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioReferencia?: number | null;

  @Column({ name: 'moneda', type: 'nvarchar', length: 10, nullable: true })
  moneda?: string | null;

  @Column({ name: 'fechaultimaactualizacion', type: 'datetime2', precision: 7 })
  fechaUltimaActualizacion!: Date;

  @Column({ name: 'contactoabastecimiento', type: 'nvarchar', length: 160, nullable: true })
  contactoAbastecimiento?: string | null;

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
