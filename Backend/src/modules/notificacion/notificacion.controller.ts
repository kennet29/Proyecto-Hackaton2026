import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NotificacionService } from './notificacion.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';

@Controller('notificacion')
export class NotificacionController {
  constructor(private readonly notificacionservice: NotificacionService) {}

  @Post()
  create(@Body() payload: CreateNotificacionDto) {
    return this.notificacionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.notificacionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificacionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateNotificacionDto) {
    return this.notificacionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificacionservice.remove(id);
  }
}

