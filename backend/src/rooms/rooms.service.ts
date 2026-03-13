import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Room } from '@prisma/client';

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
  constructor(private prisma: PrismaService) {}

  async create(
    createRoomDto: CreateRoomDto,
    file: Express.Multer.File,
  ): Promise<Room> {
    // Compare YYYY-MM-DD strings in local timezone — avoids UTC parsing shifting dates by one day
    const todayStr = new Date().toLocaleDateString('en-CA');

    if (createRoomDto.startDate) {
      const startStr = (createRoomDto.startDate as string).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
        throw new BadRequestException('La fecha de inicio no es válida.');
      }
      if (startStr < todayStr) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser anterior a hoy.',
        );
      }

      if (createRoomDto.endDate) {
        const endStr = (createRoomDto.endDate as string).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
          throw new BadRequestException('La fecha de cierre no es válida.');
        }
        if (endStr <= startStr) {
          throw new BadRequestException(
            'La fecha de cierre debe ser posterior a la fecha de inicio.',
          );
        }
      }
    } else if (createRoomDto.endDate) {
      throw new BadRequestException(
        'No puedes definir una fecha de cierre sin una fecha de inicio.',
      );
    }

    return this.prisma.room.create({
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
  }
  async createHighlight(data: {
    roomId: string;
    page: number;
    coords: Prisma.InputJsonValue;
    content?: string;
  }) {
    return this.prisma.highlight.create({
      data: {
        roomId: data.roomId,
        page: data.page,
        coords: data.coords,
        content: data.content,
      },
    });
  }

  async findAll() {
    return this.prisma.room.findMany({
      include: { highlights: true },
    });
  }

  async findByPin(pin: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: {
        accessPin: pin.toUpperCase(),
      },
      include: { highlights: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: { highlights: true },
    });
  }

  update(id: string, updateRoomDto: any) {
    return `This action updates a #${id} room`;
  }

  remove(id: string) {
    return `This action removes a #${id} room`;
  }

  async addWordToGlossary(data: {
    term: string;
    roomId: string;
    page: number;
    coords: Prisma.InputJsonValue;
  }) {
    return this.prisma.$transaction(async (tempPrisma) => {
      const highlight = await tempPrisma.highlight.create({
        data: {
          content: data.term,
          type: 'glossary',
          page: data.page,
          coords: data.coords,
          roomId: data.roomId,
        },
      });
      await tempPrisma.glossary.create({
        data: {
          term: data.term,
          page: data.page,
          coords: data.coords,
          roomId: data.roomId,
        },
      });
      return highlight;
    });
  }
}
