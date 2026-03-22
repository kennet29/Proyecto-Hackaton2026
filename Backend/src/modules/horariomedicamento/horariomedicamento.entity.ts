import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'horariomedicamento' })
export class Horariomedicamento {
  @PrimaryGeneratedColumn({ name: 'horariomedicamentoid', type: 'int' })
  horariomedicamentoId!: number;

  @Column({ name: 'medicacionid', type: 'int', precision: 10 })
  medicacionId!: number;

  @Column({ name: 'horaprogramada', type: 'time', precision: 7 })
  horaprogramada!: Date;

  @Column({ name: 'frecuencia', type: 'nvarchar', length: 80, nullable: true })
  frecuencia?: string;

  @Column({ name: 'diasemana', type: 'tinyint', precision: 3, nullable: true })
  diasemana?: number;

  @Column({ name: 'generarecordatorio', type: 'bit' })
  generarecordatorio!: boolean;

  @Column({ name: 'proximaalarma', type: 'datetime2', precision: 7, nullable: true })
  proximaalarma?: Date;

  @Column({ name: 'estadorecordatorio', type: 'nvarchar', length: 30 })
  estadorecordatorio!: string;

  @Column({ name: 'ultimoenvio', type: 'datetime2', precision: 7, nullable: true })
  ultimoenvio?: Date;

  @Column({ name: 'observaciones', type: 'nvarchar', length: 300, nullable: true })
  observaciones?: string;

  @Column({ name: 'creadopor', type: 'nvarchar', length: 60, nullable: true })
  creadopor?: string;

  @Column({ name: 'creadoen', type: 'datetime2', precision: 7 })
  creadoen!: Date;

  @Column({ name: 'modificadopor', type: 'nvarchar', length: 60, nullable: true })
  modificadopor?: string;

  @Column({ name: 'modificadoen', type: 'datetime2', precision: 7, nullable: true })
  modificadoen?: Date;

  @Column({ name: 'campoprueba01', type: 'nvarchar', length: 200, nullable: true })
  campoprueba01?: string;

  @Column({ name: 'campoprueba02', type: 'nvarchar', length: 200, nullable: true })
  campoprueba02?: string;

  @Column({ name: 'campoprueba03', type: 'nvarchar', length: 200, nullable: true })
  campoprueba03?: string;

  @Column({ name: 'campoprueba04', type: 'nvarchar', length: 200, nullable: true })
  campoprueba04?: string;

  @Column({ name: 'campoprueba05', type: 'nvarchar', length: 200, nullable: true })
  campoprueba05?: string;

}
