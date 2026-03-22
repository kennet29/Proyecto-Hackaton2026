import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'controlcronico' })
export class Controlcronico {
  @PrimaryGeneratedColumn({ name: 'controlcronicoid', type: 'int' })
  controlcronicoId!: number;

  @Column({ name: 'condicioncronicaid', type: 'int', precision: 10 })
  condicioncronicaId!: number;

  @Column({ name: 'fechacontrol', type: 'datetime2', precision: 7 })
  fechacontrol!: Date;

  @Column({ name: 'indicador', type: 'nvarchar', length: 120, nullable: true })
  indicador?: string;

  @Column({ name: 'valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor?: number;

  @Column({ name: 'unidad', type: 'nvarchar', length: 40, nullable: true })
  unidad?: string;

  @Column({ name: 'resultado', type: 'nvarchar', length: 150, nullable: true })
  resultado?: string;

  @Column({ name: 'conclusiones', type: 'nvarchar', nullable: true })
  conclusiones?: string;

  @Column({ name: 'proximocontrol', type: 'date', nullable: true })
  proximocontrol?: Date;

  @Column({ name: 'medico', type: 'nvarchar', length: 120, nullable: true })
  medico?: string;

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
