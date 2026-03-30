import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendMagicLinkDto } from 'src/email/dto/send-magic-link.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.getOrThrow<string>('GMAIL_USER'),
        pass: this.config.getOrThrow<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendMagicLinkEmail(dto: SendMagicLinkDto): Promise<void> {
    const lang = dto.lang ?? 'es';
    const subject =
      lang === 'en'
        ? 'Activate your reading room'
        : 'Activá la sala de lectura';

    const html =
      lang === 'en'
        ? `<h2>Your room is ready</h2>
           <p>Click to activate it:</p>
           <a href="${dto.verifyUrl}">Activate room</a>
           <p>This link expires in 15 minutes.</p>`
        : `<h2>Sala lista</h2>
           <p>Hacé click para activarla:</p>
           <a href="${dto.verifyUrl}">Activar sala</a>
           <p>Este link expira en 15 minutos.</p>`;

    try {
      await this.transporter.sendMail({
        from: `"Subrayado" <${this.config.getOrThrow<string>('GMAIL_USER')}>`,
        to: dto.email,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error('Failed to send magic link email', error);
      throw error;
    }
  }
}
