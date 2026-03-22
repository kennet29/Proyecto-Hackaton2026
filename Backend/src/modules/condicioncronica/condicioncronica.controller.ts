import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CondicioncronicaService } from './condicioncronica.service';
import { CreateCondicioncronicaDto } from './dto/create-condicioncronica.dto';
import { UpdateCondicioncronicaDto } from './dto/update-condicioncronica.dto';

@Controller('condicioncronica')
export class CondicioncronicaController {
  constructor(private readonly condicioncronicaservice: CondicioncronicaService) {}

  @Post()
  create(@Body() payload: CreateCondicioncronicaDto) {
    return this.condicioncronicaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.condicioncronicaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.condicioncronicaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateCondicioncronicaDto) {
    return this.condicioncronicaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.condicioncronicaservice.remove(id);
  }
}

