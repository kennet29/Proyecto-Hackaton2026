import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { dirname, resolve } from "path";
import { AuthService, AuthenticatedUser } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RequestResetDto } from "./dto/request-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "./decorators/public.decorator";

const ALTCHA_SCRIPT_PATH = resolve(
  dirname(require.resolve("altcha")),
  "altcha.min.js",
);

/** Expone los endpoints HTTP del dominio auth. */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Public()
  @Get("altcha-challenge")
  altchaChallenge() {
    return this.authService.createAltchaChallenge();
  }

  @Public()
  @Get("altcha.js")
  altchaScript(@Res() response: Response) {
    return response
      .set({
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      })
      .sendFile(ALTCHA_SCRIPT_PATH);
  }

  @Public()
  @Get("altcha-widget")
  altchaWidget(@Res() response: Response) {
    return response
      .status(200)
      .set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' blob:",
          "worker-src 'self' blob:",
          "connect-src 'self'",
          "style-src 'unsafe-inline'",
          "img-src data:",
        ].join("; "),
      })
      .send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; min-height: 100%; background: #132238; color-scheme: dark; }
    body { display: flex; align-items: center; justify-content: center; overflow: hidden; font-family: system-ui, sans-serif; }
    altcha-widget { width: 100%; --altcha-max-width: 100%; --altcha-color-base: #132238; --altcha-color-base-content: #f4f8ff; --altcha-color-primary: #29b6ff; --altcha-color-success: #38f28e; }
  </style>
  <script src="./altcha.js" defer></script>
</head>
<body>
  <altcha-widget challenge="./altcha-challenge" type="checkbox" language="es" hidefooter></altcha-widget>
  <script>
    const send = (payload) => {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    };
    window.onload = () => {
      const widget = document.querySelector('altcha-widget');
      widget.addEventListener('load', () => send({ type: 'ready' }));
      widget.addEventListener('verified', (event) => send({ type: 'verified', payload: event.detail.payload }));
      widget.addEventListener('expired', () => send({ type: 'expired' }));
      widget.addEventListener('statechange', (event) => {
        if (event.detail.state === 'error') send({ type: 'error' });
      });
      send({ type: 'ready' });
    };
  </script>
</body>
</html>`);
  }

  @Public()
  @Post("forgot-password")
  requestReset(@Body() payload: RequestResetDto) {
    return this.authService.requestPasswordReset(payload);
  }

  @Public()
  @Post("reset-password")
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @Post("logout")
  logout(@Req() req: Request) {
    return this.authService.logout(req.user as AuthenticatedUser);
  }
}
