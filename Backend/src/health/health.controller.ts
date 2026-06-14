import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import { VersionService } from "../version/version.service";

/**
 * Expone un endpoint simple para health checks de infraestructura.
 */
@Controller({
  path: "health",
  version: "1",
})
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly versionService: VersionService,
  ) {}

  /**
   * Get health.
   * @returns Estado operativo del backend.
   */
  @Get()
  getHealth() {
    const version = this.versionService.getBackendVersion();
    const databaseName =
      typeof this.dataSource.options.database === "string"
        ? this.dataSource.options.database
        : null;

    return {
      status: this.dataSource.isInitialized ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      service: version.name,
      version: version.version,
      apiVersion: version.apiVersion,
      database: {
        status: this.dataSource.isInitialized ? "up" : "down",
        name: databaseName,
      },
    };
  }
}
