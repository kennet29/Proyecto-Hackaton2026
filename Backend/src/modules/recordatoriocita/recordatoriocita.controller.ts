import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RecordatoriocitaService } from './recordatoriocita.service';
import { CreateRecordatoriocitaDto } from './dto/create-recordatoriocita.dto';
import { UpdateRecordatoriocitaDto } from './dto/update-recordatoriocita.dto';

@Controller('recordatoriocita')
export class RecordatoriocitaController {
  constructor(private readonly recordatoriocitaservice: RecordatoriocitaService) {}

  @Post()
  create(@Body() payload: CreateRecordatoriocitaDto) {
    return this.recordatoriocitaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.recordatoriocitaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recordatoriocitaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateRecordatoriocitaDto) {
    return this.recordatoriocitaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recordatoriocitaservice.remove(id);
  }
}

