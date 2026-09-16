import { Module } from "@nestjs/common";
import { ServerLogsController } from "./server-logs.controller";

@Module({ controllers: [ServerLogsController] })
export class ObservabilityModule {}
