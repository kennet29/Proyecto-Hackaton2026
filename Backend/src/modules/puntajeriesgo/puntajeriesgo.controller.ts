import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PuntajeriesgoService } from './puntajeriesgo.service';
import { CreatePuntajeriesgoDto } from './dto/create-puntajeriesgo.dto';
import { UpdatePuntajeriesgoDto } from './dto/update-puntajeriesgo.dto';

@Controller('puntajeriesgo')
export class PuntajeriesgoController {
  constructor(private readonly puntajeriesgoservice: PuntajeriesgoService) {}

  @Post()
  create(@Body() payload: CreatePuntajeriesgoDto) {
    return this.puntajeriesgoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.puntajeriesgoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.puntajeriesgoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdatePuntajeriesgoDto) {
    return this.puntajeriesgoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.puntajeriesgoservice.remove(id);
  }
}

