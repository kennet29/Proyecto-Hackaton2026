import { Controller, Get } from "@nestjs/common";
import { VersionService } from "./version.service";

/**
 * Expone los endpoints HTTP del dominio version.
 */
@Controller({
  path: "version",
  version: "1",
})
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  /**
   * Get version.
   * @returns Resultado de la consulta solicitada.
   */
  @Get()
  getVersion() {
    return this.versionService.getBackendVersion();
  }
}
