import { Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const newRoom = await this.prisma.room.create({
      data: {
        title: createRoomDto.title,
        bookUrl: createRoomDto.bookUrl,
        accessPin: Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });
    console.log("Sala creada en DB:", newRoom);
  return newRoom;
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

  async findOne(id: string) {
  try {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room) {
      console.log(`Sala con ID ${id} no encontrada`);
      return null;
    }
    return room;
  } catch (error) {
    // Esto imprimirá el error real en la consola de tu BACKEND
    console.error("Error en Prisma findOne:", error.message);
    return null; 
  }
}

  update(id: string, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }

  remove(id: string) {
    return `This action removes a #${id} room`;
  }
}
