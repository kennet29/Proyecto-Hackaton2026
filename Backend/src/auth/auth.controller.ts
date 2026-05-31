import { Body, Controller, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RequestResetDto } from "./dto/request-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "./decorators/public.decorator";
import { AuthenticatedUser } from "./auth.service";
import { Request } from "express";

/**
 * Expone los endpoints HTTP del dominio auth.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Public()
  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  /**
   * Request reset.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Public()
  @Post("forgot-password")
  requestReset(@Body() payload: RequestResetDto) {
    return this.authService.requestPasswordReset(payload);
  }

  /**
   * Reset password.
   * @param payload Datos validados que recibe la operación.
   * @returns Resultado de la operación.
   */
  @Public()
  @Post("reset-password")
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  /**
   * Logout.
   * @param req Solicitud HTTP actual.
   * @returns Resultado de la operación.
   */
  @Post("logout")
  logout(@Req() req: Request) {
    return this.authService.logout(req.user as AuthenticatedUser);
  }
}
