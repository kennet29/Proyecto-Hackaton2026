import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'medicamentoraro' })
export class Medicamentoraro {
  @PrimaryGeneratedColumn({ name: 'medicamentoraroid', type: 'int' })
  medicamentoRaroId!: number;

  @Column({ name: 'nombregenerico', type: 'nvarchar', length: 160 })
  nombreGenerico!: string;

  @Column({ name: 'nombrecomercial', type: 'nvarchar', length: 160, nullable: true })
  nombreComercial?: string | null;

  @Column({ name: 'presentacion', type: 'nvarchar', length: 120, nullable: true })
  presentacion?: string | null;

  @Column({ name: 'concentracion', type: 'nvarchar', length: 120, nullable: true })
  concentracion?: string | null;

  @Column({ name: 'fabricante', type: 'nvarchar', length: 120, nullable: true })
  fabricante?: string | null;

  @Column({ name: 'descripcion', type: 'nvarchar', length: 500, nullable: true })
  descripcion?: string | null;

  @Column({ name: 'requierereceta', type: 'bit' })
  requiereReceta!: boolean;

  @Column({ name: 'controlado', type: 'bit' })
  controlado!: boolean;

  @Column({ name: 'notasabastecimiento', type: 'nvarchar', length: 400, nullable: true })
  notasAbastecimiento?: string | null;

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
