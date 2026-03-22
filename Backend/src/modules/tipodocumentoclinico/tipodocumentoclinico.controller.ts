import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TipodocumentoclinicoService } from './tipodocumentoclinico.service';
import { CreateTipodocumentoclinicoDto } from './dto/create-tipodocumentoclinico.dto';
import { UpdateTipodocumentoclinicoDto } from './dto/update-tipodocumentoclinico.dto';

@Controller('tipodocumentoclinico')
export class TipodocumentoclinicoController {
  constructor(private readonly tipodocumentoclinicoservice: TipodocumentoclinicoService) {}

  @Post()
  create(@Body() payload: CreateTipodocumentoclinicoDto) {
    return this.tipodocumentoclinicoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.tipodocumentoclinicoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipodocumentoclinicoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTipodocumentoclinicoDto) {
    return this.tipodocumentoclinicoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipodocumentoclinicoservice.remove(id);
  }
}

