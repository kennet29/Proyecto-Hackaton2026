import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { RevokedToken } from "./entities/revoked-token.entity";

/**
 * Implementa la lógica de negocio y persistencia del dominio token revocation.
 */
@Injectable()
export class TokenRevocationService {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly revokedRepository: Repository<RevokedToken>,
  ) {}

  /**
   * Ensure token is active.
   * @param jwtId Identificador asociado a jwt.
   * @returns La operación se completa sin devolver contenido.
   */
  async ensureTokenIsActive(jwtId?: string): Promise<void> {
    if (!jwtId) {
      throw new UnauthorizedException(
        "token sin identificador, vuelve a iniciar sesion",
      );
    }
    const revoked = await this.revokedRepository.findOne({ where: { jwtId } });
    if (revoked) {
      throw new UnauthorizedException(
        "token revocado, vuelve a iniciar sesion",
      );
    }
  }

  /**
   * Revoke.
   * @param jwtId Identificador asociado a jwt.
   * @param usuarioId Identificador asociado a usuario.
   * @param expiresAt Valor del parámetro `expiresAt`.
   * @param reason Valor del parámetro `reason`.
   * @returns La operación se completa sin devolver contenido.
   */
  async revoke(
    jwtId: string,
    usuarioId: number,
    expiresAt: Date,
    reason = "logout",
  ): Promise<void> {
    await this.revokedRepository.upsert(
      {
        jwtId,
        usuarioId,
        expiresAt,
        reason,
      },
      ["jwtId"],
    );
    await this.cleanupExpired();
  }

  /**
   * Cleanup expired.
   * @returns La operación se completa sin devolver contenido.
   */
  private async cleanupExpired(): Promise<void> {
    const limit = new Date();
    await this.revokedRepository.delete({ expiresAt: LessThan(limit) });
  }
}
