import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    return this.prisma.room.create({
      data: {
        title: createRoomDto.title,
        bookUrl: createRoomDto.bookUrl,
        accessPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });
  }

  async findAll() {
    return this.prisma.room.findMany();
  }

  async findByPin(pin: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: {
        accessPin: pin.toUpperCase(),
      },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} room`;
  }

  update(id: string, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: string) {
    return `This action removes a #${id} room`;
  }
}
