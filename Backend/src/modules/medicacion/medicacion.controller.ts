import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MedicacionService } from './medicacion.service';
import { CreateMedicacionDto } from './dto/create-medicacion.dto';
import { UpdateMedicacionDto } from './dto/update-medicacion.dto';

@Controller('medicacion')
export class MedicacionController {
  constructor(private readonly medicacionservice: MedicacionService) {}

  @Post()
  create(@Body() payload: CreateMedicacionDto) {
    return this.medicacionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.medicacionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicacionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateMedicacionDto) {
    return this.medicacionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicacionservice.remove(id);
  }
}

