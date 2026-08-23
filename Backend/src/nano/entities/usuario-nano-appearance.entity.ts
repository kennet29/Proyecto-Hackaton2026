/**
 * @file Backend/src/nano/entities/usuario-nano-appearance.entity.ts
 * @description TypeScript module implementation.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "usuarioapariencianano" })
@Index("UQ_usuarioapariencianano_usuario_apariencia", ["usuarioId", "appearanceId"], {
  unique: true,
})
export class UsuarioNanoAppearance {
  @PrimaryGeneratedColumn({ name: "usuarioaparienciananoid" })
  id!: number;

  @Column({ name: "usuarioid", type: "int" })
  usuarioId!: number;

  @Column({ name: "aparienciaid", type: "nvarchar", length: 40 })
  appearanceId!: string;

  @Column({ name: "fechadesbloqueo", type: "datetime2" })
  unlockedAt!: Date;

  @Column({ name: "seleccionada", type: "bit", default: false })
  selected!: boolean;

  @CreateDateColumn({
    name: "creadoen",
    type: "datetime2",
    default: () => "SYSDATETIME()",
  })
  createdAt!: Date;

  @UpdateDateColumn({ name: "modificadoen", type: "datetime2", nullable: true })
  updatedAt?: Date;
}
