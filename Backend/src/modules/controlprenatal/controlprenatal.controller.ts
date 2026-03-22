import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ControlprenatalService } from './controlprenatal.service';
import { CreateControlprenatalDto } from './dto/create-controlprenatal.dto';
import { UpdateControlprenatalDto } from './dto/update-controlprenatal.dto';

@Controller('controlprenatal')
export class ControlprenatalController {
  constructor(private readonly controlprenatalservice: ControlprenatalService) {}

  @Post()
  create(@Body() payload: CreateControlprenatalDto) {
    return this.controlprenatalservice.create(payload);
  }

  @Get()
  findAll() {
    return this.controlprenatalservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.controlprenatalservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateControlprenatalDto) {
    return this.controlprenatalservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.controlprenatalservice.remove(id);
  }
}

