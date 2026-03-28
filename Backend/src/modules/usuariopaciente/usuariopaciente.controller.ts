import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/auth.service';
import { CreateUsuarioPacienteDto } from './dto/create-usuariopaciente.dto';
import { UpdateUsuarioPacienteDto } from './dto/update-usuariopaciente.dto';
import { UsuarioPacienteService } from './usuariopaciente.service';

@Controller('usuario-paciente')
export class UsuarioPacienteController {
  constructor(private readonly usuarioPacienteService: UsuarioPacienteService) {}

  @Post()
  create(@Body() payload: CreateUsuarioPacienteDto, @Req() req: Request) {
    return this.usuarioPacienteService.link(req.user as AuthenticatedUser, payload);
  }

  @Get('mis-pacientes')
  findMine(@Req() req: Request) {
    return this.usuarioPacienteService.listMine(req.user as AuthenticatedUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUsuarioPacienteDto,
    @Req() req: Request,
  ) {
    return this.usuarioPacienteService.update(id, payload, req.user as AuthenticatedUser);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.usuarioPacienteService.remove(id, req.user as AuthenticatedUser);
  }
}
