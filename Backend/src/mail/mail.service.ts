import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string | undefined;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT') ?? 587;
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    this.fromAddress = this.config.get<string>('MAIL_FROM');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('correo smtp no configurado (variables MAIL_* faltantes)');
    }
  }

  async sendPasswordResetMail(to: string, token: string, expiresAt: Date) {
    if (!this.transporter || !this.fromAddress) {
      this.logger.warn(`no se envio correo a ${to}: transporter o remitente no configurados`);
      return;
    }
    const subject = 'codigo para restablecer tu contrasena';
    const text = `Hola,

Recibimos una solicitud para restablecer tu contrasena.

Codigo: ${token}
Expira: ${expiresAt.toLocaleString()}

Si no solicitaste el cambio, ignora este correo.`;

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      text,
    });
  }
}
