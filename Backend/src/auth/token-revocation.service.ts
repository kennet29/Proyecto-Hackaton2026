import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';

@Injectable()
export class TokenRevocationService {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly revokedRepository: Repository<RevokedToken>,
  ) {}

  async ensureTokenIsActive(jwtId?: string): Promise<void> {
    if (!jwtId) {
      throw new UnauthorizedException('token sin identificador, vuelve a iniciar sesion');
    }
    const revoked = await this.revokedRepository.findOne({ where: { jwtId } });
    if (revoked) {
      throw new UnauthorizedException('token revocado, vuelve a iniciar sesion');
    }
  }

  async revoke(jwtId: string, usuarioId: number, expiresAt: Date, reason = 'logout'): Promise<void> {
    await this.revokedRepository.upsert(
      {
        jwtId,
        usuarioId,
        expiresAt,
        reason,
      },
      ['jwtId'],
    );
    await this.cleanupExpired();
  }

  private async cleanupExpired(): Promise<void> {
    const limit = new Date();
    await this.revokedRepository.delete({ expiresAt: LessThan(limit) });
  }
}
