import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { Usuario } from "./entities/user.entity";
import { Public } from "../auth/decorators/public.decorator";
import { Roles } from "../auth/decorators/roles.decorator";

/**
 * Expone los endpoints HTTP del dominio users.
 */
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  @Roles("admin", "superadmin")
  @Post()
  create(@Body() payload: CreateUserDto): Promise<Usuario> {
    return this.usersService.create(payload);
  }

  /**
   * Get registration status.
   * @returns Resultado de la consulta solicitada.
   */
  @Public()
  @Get("registration-status")
  getRegistrationStatus() {
    return this.usersService.getRegistrationStatus();
  }

  /**
   * Register.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Public()
  @Post("register")
  register(@Body() payload: CreateUserDto) {
    return this.usersService.registerPublicUser(payload);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  @Roles("admin", "superadmin")
  @Get()
  findAll(): Promise<Usuario[]> {
    return this.usersService.findAll();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  @Roles("admin", "superadmin")
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<Usuario> {
    return this.usersService.findOne(id);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  @Roles("admin", "superadmin")
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
  ): Promise<Usuario> {
    return this.usersService.update(id, payload);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  @Roles("admin", "superadmin")
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number): Promise<{
    /**
     * Campo de datos asociado a `deleted`.
     */
    deleted: boolean;
  }> {
    await this.usersService.remove(id);
    return { deleted: true };
  }
}
