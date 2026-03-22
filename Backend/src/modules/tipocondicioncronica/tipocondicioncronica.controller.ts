import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipocondicioncronicaService } from './tipocondicioncronica.service';
import { CreateTipocondicioncronicaDto } from './dto/create-tipocondicioncronica.dto';
import { UpdateTipocondicioncronicaDto } from './dto/update-tipocondicioncronica.dto';

@Controller('tipocondicioncronica')
export class TipocondicioncronicaController {
  constructor(private readonly tipocondicioncronicaservice: TipocondicioncronicaService) {}

  @Post()
  create(@Body() payload: CreateTipocondicioncronicaDto) {
    return this.tipocondicioncronicaservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipocondicioncronicaservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipocondicioncronicaservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipocondicioncronicaDto) {
    return this.tipocondicioncronicaservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipocondicioncronicaservice.remove(id);
  }
}

