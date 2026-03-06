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

 async addWordToGlossary( data: { term: string; roomId: string; page: number; coords: any }) {

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
