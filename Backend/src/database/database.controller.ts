import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('tables')
  listTables(): string[] {
    return this.databaseService.listTables();
  }

  @Get(':table')
  findAll(@Param('table') table: string): Promise<Record<string, any>[]> {
    return this.databaseService.findAll(table);
  }

  @Get(':table/:id')
  findOne(
    @Param('table') table: string,
    @Param('id') id: string,
  ): Promise<Record<string, any>> {
    return this.databaseService.findOne(table, id);
  }

  @Post(':table')
  create(
    @Param('table') table: string,
    @Body() payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    return this.databaseService.create(table, payload ?? {});
  }

  @Patch(':table/:id')
  update(
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    return this.databaseService.update(table, id, payload ?? {});
  }

  @Delete(':table/:id')
  remove(@Param('table') table: string, @Param('id') id: string): Promise<void> {
    return this.databaseService.remove(table, id);
  }
}
