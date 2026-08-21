import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/** Expo push token registered by one authenticated user/device. */
@Entity({ name: "dispositivopush" })
export class PushDevice {
  @PrimaryGeneratedColumn({ name: "dispositivopushid", type: "int" }) id!: number;
  @Column({ name: "usuarioid", type: "int" }) usuarioId!: number;
  @Column({ name: "expopushtoken", type: "nvarchar", length: 255, unique: true }) expoPushToken!: string;
  @Column({ name: "plataforma", type: "nvarchar", length: 20 }) platform!: string;
  @Column({ name: "activo", type: "bit", default: true }) active!: boolean;
  @CreateDateColumn({ name: "creadoen", type: "datetime2", default: () => "SYSDATETIME()" }) createdAt!: Date;
  @UpdateDateColumn({ name: "actualizadoen", type: "datetime2", default: () => "SYSDATETIME()" }) updatedAt!: Date;
}
