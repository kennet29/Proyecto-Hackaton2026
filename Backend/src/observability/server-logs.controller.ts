import { Controller, Get, Query } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { getServerLogs } from "./server-log.store";

@Controller("server-logs")
@Roles("admin", "superadmin")
export class ServerLogsController {
  @Get()
  list(@Query("limit") limit?: string) {
    return { entries: getServerLogs(limit), retainedEntries: 500 };
  }
}
