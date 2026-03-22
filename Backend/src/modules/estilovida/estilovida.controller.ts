import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EstilovidaService } from './estilovida.service';
import { CreateEstilovidaDto } from './dto/create-estilovida.dto';
import { UpdateEstilovidaDto } from './dto/update-estilovida.dto';

@Controller('estilovida')
export class EstilovidaController {
  constructor(private readonly estilovidaservice: EstilovidaService) {}

  @Post()
  create(@Body() payload: CreateEstilovidaDto) {
    return this.estilovidaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.estilovidaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estilovidaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateEstilovidaDto) {
    return this.estilovidaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estilovidaservice.remove(id);
  }
}

