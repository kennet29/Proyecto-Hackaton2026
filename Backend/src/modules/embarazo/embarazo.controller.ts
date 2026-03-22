import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EmbarazoService } from './embarazo.service';
import { CreateEmbarazoDto } from './dto/create-embarazo.dto';
import { UpdateEmbarazoDto } from './dto/update-embarazo.dto';

@Controller('embarazo')
export class EmbarazoController {
  constructor(private readonly embarazoservice: EmbarazoService) {}

  @Post()
  create(@Body() payload: CreateEmbarazoDto) {
    return this.embarazoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.embarazoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.embarazoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateEmbarazoDto) {
    return this.embarazoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.embarazoservice.remove(id);
  }
}

