import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { LesionService } from './lesion.service';
import { CreateLesionDto } from './dto/create-lesion.dto';
import { UpdateLesionDto } from './dto/update-lesion.dto';

@Controller('lesion')
export class LesionController {
  constructor(private readonly lesionservice: LesionService) {}

  @Post()
  create(@Body() payload: CreateLesionDto) {
    return this.lesionservice.create(payload);
  }

  @Get()
  findAll() {
    return this.lesionservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lesionservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateLesionDto) {
    return this.lesionservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lesionservice.remove(id);
  }
}

