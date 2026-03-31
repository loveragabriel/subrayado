import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Room } from '@prisma/client';
import { REST_ERRORS } from './constants/rest-errors.constants';
import { MailService } from 'src/email/mail.service';

const PIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 36 chars
const PIN_LENGTH = 8;
// 36 * 7 = 252 — bytes 0-251 map uniformly (7 values per char); 252-255 discarded
const PIN_MAX_BYTE = 252;

/**
 * Generates a cryptographically secure PIN of exactly PIN_LENGTH uppercase
 * alphanumeric characters (A-Z, 0-9) using rejection sampling to avoid
 * modulo bias.
 */
export function generatePin(): string {
  let pin = '';
  while (pin.length < PIN_LENGTH) {
    // Request extra bytes so the loop almost never iterates more than once
    const buf = randomBytes((PIN_LENGTH - pin.length) * 2);
    for (let i = 0; i < buf.length && pin.length < PIN_LENGTH; i++) {
      if (buf[i] < PIN_MAX_BYTE) {
        pin += PIN_ALPHABET[buf[i] % PIN_ALPHABET.length];
      }
    }
  }
  return pin;
}

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    file: Express.Multer.File,
  ): Promise<{ message: string; email: string }> {
    // Compare YYYY-MM-DD strings in local timezone — avoids UTC parsing shifting dates by one day
    const todayStr = new Date().toLocaleDateString('en-CA');

    if (createRoomDto.startDate) {
      const startStr = (createRoomDto.startDate as string).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
        throw new BadRequestException(REST_ERRORS.INVALID_START_DATE);
      }
      if (startStr < todayStr) {
        throw new BadRequestException(REST_ERRORS.START_DATE_IN_PAST);
      }

      if (createRoomDto.endDate) {
        const endStr = (createRoomDto.endDate as string).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
          throw new BadRequestException(REST_ERRORS.INVALID_END_DATE);
        }
        if (endStr <= startStr) {
          throw new BadRequestException(REST_ERRORS.END_DATE_BEFORE_START);
        }
      }
    } else if (createRoomDto.endDate) {
      throw new BadRequestException(REST_ERRORS.END_DATE_WITHOUT_START);
    }

    const room = await this.prisma.room.create({
      data: {
        title: createRoomDto.title,
        bookUrl: file.path,
        bookPublicId: file.filename,
        accessPin: generatePin(),
        adminToken: randomBytes(32).toString('hex'),
        startDate: createRoomDto.startDate
          ? new Date(createRoomDto.startDate as string)
          : null,
        endDate: createRoomDto.endDate
          ? new Date(createRoomDto.endDate as string)
          : null,
      },
    });

    const token = randomBytes(32).toString('hex');
    const expireAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min from now

    await this.prisma.magicToken.create({
      data: {
        email: createRoomDto.coordinatorEmail,
        token,
        roomId: room.id,
        expiresAt: expireAt,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/activate?token=${token}`;
    await this.mailService.sendMagicLinkEmail({
      email: createRoomDto.coordinatorEmail,
      verifyUrl,
      lang: createRoomDto.lang,
    });

    return { message: 'email_sent', email: createRoomDto.coordinatorEmail };
  }

  async verifyMagicToken(
    token: string,
  ): Promise<{ adminToken: string; roomId: string }> {
    const magicToken = await this.prisma.magicToken.findUnique({
      where: { token },
      include: { room: true },
    });

    if (!magicToken) {
      throw new NotFoundException(REST_ERRORS.INVALID_TOKEN);
    }
    if (magicToken.used) {
      throw new BadRequestException(REST_ERRORS.TOKEN_ALREADY_USED);
    }
    if (magicToken.expiresAt < new Date()) {
      throw new BadRequestException(REST_ERRORS.TOKEN_EXPIRED);
    }

    await this.prisma.$transaction([
      this.prisma.room.update({
        where: { id: magicToken.roomId },
        data: { verified: true },
      }),
      this.prisma.magicToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    return {
      adminToken: magicToken.room.adminToken!,
      roomId: magicToken.roomId,
    };
  }

  async createHighlight(data: {
    roomId: string;
    page: number;
    coords: unknown;
    content?: string;
  }) {
    return this.prisma.highlight.create({
      data: {
        roomId: data.roomId,
        page: data.page,
        coords: data.coords as Prisma.InputJsonValue,
        content: data.content,
      },
    });
  }

  async findByPin(
    pin: string,
  ): Promise<(Omit<Room, 'adminToken'> & { highlights: any[] }) | null> {
    return this.prisma.room.findUnique({
      where: {
        accessPin: pin.toUpperCase(),
      },
      select: {
        id: true,
        title: true,
        accessPin: true,
        bookUrl: true,
        bookPublicId: true,
        startDate: true,
        endDate: true,
        coordinatorEmail: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        highlights: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        accessPin: true,
        bookUrl: true,
        bookPublicId: true,
        createdAt: true,
        updatedAt: true,
        startDate: true,
        endDate: true,
        coordinatorEmail: true,
        verified: true,
        highlights: true,
        members: true,
        glossaries: true,
      },
    });
  }

  async findOneWithToken(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
    });
  }

  async addWordToGlossary(data: {
    term: string;
    roomId: string;
    page: number;
    coords: unknown;
  }) {
    const coordsJson = data.coords as Prisma.InputJsonValue;
    return this.prisma.$transaction(async (tempPrisma) => {
      const highlight = await tempPrisma.highlight.create({
        data: {
          content: data.term,
          type: 'glossary',
          page: data.page,
          coords: coordsJson,
          roomId: data.roomId,
        },
      });
      await tempPrisma.glossary.create({
        data: {
          term: data.term,
          page: data.page,
          coords: coordsJson,
          roomId: data.roomId,
        },
      });
      return highlight;
    });
  }

  async findByAdminToken(adminToken: string): Promise<Room | null> {
    if (!adminToken) return null;

    return this.prisma.room.findUnique({
      where: { adminToken },
    });
  }
}
