import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class PresupuestoMedicoSchemaService implements OnModuleInit {
  private readonly logger = new Logger(PresupuestoMedicoSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.query(`
      IF OBJECT_ID(N'dbo.presupuestomedico', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.presupuestomedico (
          presupuestomedicoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          usuarioid INT NOT NULL,
          mes CHAR(7) NOT NULL,
          limitemensual DECIMAL(12,2) NOT NULL CONSTRAINT DF_presupuestomedico_limite DEFAULT (0),
          creadoen DATETIME2 NOT NULL CONSTRAINT DF_presupuestomedico_creado DEFAULT (SYSDATETIME()),
          modificadoen DATETIME2 NOT NULL CONSTRAINT DF_presupuestomedico_modificado DEFAULT (SYSDATETIME()),
          CONSTRAINT FK_presupuestomedico_usuario FOREIGN KEY (usuarioid) REFERENCES dbo.usuario(usuarioid) ON DELETE CASCADE,
          CONSTRAINT UQ_presupuestomedico_usuario_mes UNIQUE (usuarioid, mes)
        );
      END;

      IF OBJECT_ID(N'dbo.gastomedicopresupuestado', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.gastomedicopresupuestado (
          gastomedicoid INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          presupuestomedicoid INT NOT NULL,
          descripcion NVARCHAR(180) NOT NULL,
          categoria NVARCHAR(30) NOT NULL,
          monto DECIMAL(12,2) NOT NULL,
          creadoen DATETIME2 NOT NULL CONSTRAINT DF_gastomedico_creado DEFAULT (SYSDATETIME()),
          modificadoen DATETIME2 NOT NULL CONSTRAINT DF_gastomedico_modificado DEFAULT (SYSDATETIME()),
          CONSTRAINT FK_gastomedico_presupuesto FOREIGN KEY (presupuestomedicoid) REFERENCES dbo.presupuestomedico(presupuestomedicoid) ON DELETE CASCADE
        );
        CREATE INDEX IX_gastomedico_presupuesto ON dbo.gastomedicopresupuestado(presupuestomedicoid);
      END;
    `);
    this.logger.log("Esquema de presupuestos médicos verificado");
  }
}
