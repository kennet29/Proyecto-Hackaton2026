import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthenticatedUser } from "./auth.service";
import { PermisoAcceso } from "../modules/permisoacceso/permisoacceso.entity";
import { UsuarioPaciente } from "../modules/usuariopaciente/usuariopaciente.entity";

/**
 * Implementa la lógica de negocio y persistencia del dominio paciente access.
 */
@Injectable()
export class PacienteAccessService {
  constructor(
    @InjectRepository(PermisoAcceso)
    private readonly permisoRepository: Repository<PermisoAcceso>,
    @InjectRepository(UsuarioPaciente)
    private readonly usuarioPacienteRepository: Repository<UsuarioPaciente>,
  ) {}

  /**
   * Assert access.
   * @param user Usuario autenticado asociado a la solicitud.
   * @param pacienteId Identificador asociado a paciente.
   * @returns La promesa se resuelve cuando la validación se cumple.
   */
  async assertAccess(
    user: AuthenticatedUser,
    pacienteId: number,
  ): Promise<void> {
    if (!user) {
      throw new ForbiddenException("sesion invalida");
    }
    if (await this.canManagePaciente(user, pacienteId)) {
      return;
    }

    if (user.role?.toLowerCase() !== "medico") {
      throw new ForbiddenException("no tienes permisos para ver este paciente");
    }

    const permiso = await this.permisoRepository.findOne({
      where: {
        medicoId: user.userId,
        pacienteId,
        estado: "activo",
      },
    });

    if (!permiso) {
      throw new ForbiddenException("necesitas un permiso activo del paciente");
    }

    if (permiso.fechaFin && permiso.fechaFin.getTime() < Date.now()) {
      permiso.estado = "expirado";
      await this.permisoRepository.save(permiso);
      throw new ForbiddenException("el permiso ya expiro, solicita uno nuevo");
    }
  }

  /**
   * Can manage paciente.
   * @param user Usuario autenticado asociado a la solicitud.
   * @param pacienteId Identificador asociado a paciente.
   * @returns Indicador de si la condición evaluada se cumple.
   */
  async canManagePaciente(
    user: AuthenticatedUser,
    pacienteId: number,
  ): Promise<boolean> {
    if (
      user.role?.toLowerCase() === "admin" ||
      user.role?.toLowerCase() === "superadmin" ||
      (!!user.pacienteId && user.pacienteId === pacienteId)
    ) {
      return true;
    }
    if (!user.userId) {
      return false;
    }
    const relation = await this.usuarioPacienteRepository.findOne({
      where: { usuarioId: user.userId, pacienteId },
    });
    return !!relation;
  }
}
