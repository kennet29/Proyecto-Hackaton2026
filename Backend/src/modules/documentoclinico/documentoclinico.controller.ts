import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DocumentoclinicoService } from './documentoclinico.service';
import { CreateDocumentoclinicoDto } from './dto/create-documentoclinico.dto';
import { UpdateDocumentoclinicoDto } from './dto/update-documentoclinico.dto';

@Controller('documentoclinico')
export class DocumentoclinicoController {
  constructor(private readonly documentoclinicoservice: DocumentoclinicoService) {}

  @Post()
  create(@Body() payload: CreateDocumentoclinicoDto) {
    return this.documentoclinicoservice.create(payload);
  }

  @Get()
  findAll() {
    return this.documentoclinicoservice.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentoclinicoservice.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateDocumentoclinicoDto) {
    return this.documentoclinicoservice.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentoclinicoservice.remove(id);
  }
}

