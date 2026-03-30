import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { SendMagicLinkDto } from 'src/email/dto/send-magic-link.dto';
@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMagicLinkEmail(dto: SendMagicLinkDto): Promise<void> {
    const subject =
      dto.lang === 'en'
        ? 'Activate your reading room'
        : 'Activá la sala de lectura';

    const html =
      dto.lang === 'en'
        ? `<h2>Your room is ready</h2>
           <p>Click to activate it:</p>
           <a href="${dto.verifyUrl}">Activate room</a>
           <p>This link expires in 15 minutes.</p>`
        : `<h2>Tu sala está lista</h2>
           <p>Hacé click para activarla:</p>
           <a href="${dto.verifyUrl}">Activar sala</a>
           <p>Este link expira en 15 minutos.</p>`;

    await (this.resend.emails.send({
      from: 'Subrayado <onboarding@resend.dev>',
      to: dto.email,
      subject,
      html,
    }) as Promise<unknown>);
  }
}
