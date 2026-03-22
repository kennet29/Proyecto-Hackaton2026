import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DetalleevaluacionsaludService } from './detalleevaluacionsalud.service';
import { CreateDetalleevaluacionsaludDto } from './dto/create-detalleevaluacionsalud.dto';
import { UpdateDetalleevaluacionsaludDto } from './dto/update-detalleevaluacionsalud.dto';

@Controller('detalleevaluacionsalud')
export class DetalleevaluacionsaludController {
  constructor(private readonly detalleevaluacionsaludservice: DetalleevaluacionsaludService) {}

  @Post()
  create(@Body() payload: CreateDetalleevaluacionsaludDto) {
    return this.detalleevaluacionsaludservice.create(payload);
  }

  @Get()
  findAll() {
    return this.detalleevaluacionsaludservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detalleevaluacionsaludservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateDetalleevaluacionsaludDto) {
    return this.detalleevaluacionsaludservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detalleevaluacionsaludservice.remove(id);
  }
}

