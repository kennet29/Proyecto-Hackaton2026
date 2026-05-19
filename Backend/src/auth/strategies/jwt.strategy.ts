import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { TokenRevocationService } from "../token-revocation.service";
import { AuthenticatedUser } from "../auth.service";

/**
 * Clase que implementa el flujo jwt strategy.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly tokenRevocationService: TokenRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "dev-secret"),
    });
  }

  /**
   * Validate.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  async validate(payload: {
    sub: number;
    username: string;
    role?: string;
    pacienteId?: number | null;
    pacienteIds?: number[];
    jti?: string;
    exp?: number;
  }): Promise<AuthenticatedUser> {
    await this.tokenRevocationService.ensureTokenIsActive(payload.jti);
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      pacienteId: payload.pacienteId ?? null,
      pacienteIds: payload.pacienteIds ?? [],
      tokenId: payload.jti,
      exp: payload.exp,
    };
  }
}
