import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ObjetivocronicoService } from './objetivocronico.service';
import { CreateObjetivocronicoDto } from './dto/create-objetivocronico.dto';
import { UpdateObjetivocronicoDto } from './dto/update-objetivocronico.dto';

@Controller('objetivocronico')
export class ObjetivocronicoController {
  constructor(private readonly objetivocronicoservice: ObjetivocronicoService) {}

  @Post()
  create(@Body() payload: CreateObjetivocronicoDto) {
    return this.objetivocronicoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.objetivocronicoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.objetivocronicoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateObjetivocronicoDto) {
    return this.objetivocronicoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.objetivocronicoservice.remove(id);
  }
}

