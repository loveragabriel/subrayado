import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createRoomDto: CreateRoomDto,
    file: Express.Multer.File,
  ): Promise<Room> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (createRoomDto.startDate) {
      const start = new Date(createRoomDto.startDate as string);
      if (isNaN(start.getTime())) {
        throw new BadRequestException('La fecha de inicio no es válida.');
      }
      if (start < today) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser anterior a hoy.',
        );
      }

      if (createRoomDto.endDate) {
        const end = new Date(createRoomDto.endDate as string);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('La fecha de cierre no es válida.');
        }
        if (end <= start) {
          throw new BadRequestException(
            'La fecha de cierre debe ser posterior a la fecha de inicio.',
          );
        }
        const diffDays =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 1) {
          throw new BadRequestException(
            'El periodo mínimo entre inicio y cierre es de 1 día.',
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
        accessPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
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
