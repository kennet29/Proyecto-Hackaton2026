import { Controller, Get } from "@nestjs/common";
import { VersionService } from "./version.service";

@Controller({
  path: "version",
  version: "1",
})
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get()
  getVersion() {
    return this.versionService.getBackendVersion();
  }
}
