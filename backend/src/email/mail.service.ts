import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { SendMagicLinkDto } from 'src/email/dto/send-magic-link.dto';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    sgMail.setApiKey(this.config.getOrThrow<string>('SENDGRID_API_KEY'));
    this.fromEmail = this.config.getOrThrow<string>('SENDGRID_FROM_EMAIL');
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
      await sgMail.send({
        from: this.fromEmail,
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
