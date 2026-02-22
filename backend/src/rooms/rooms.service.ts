import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto, file: any): Promise<Room> {
    const newRoom = await this.prisma.room.create({
      data: {
        title: createRoomDto.title,
        bookUrl: file.path,
        bookPublicId: file.filename,
        accessPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });
    console.log('Sala creada en DB:', newRoom);
    return newRoom;
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

  update(id: string, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: string) {
    return `This action removes a #${id} room`;
  }
}
