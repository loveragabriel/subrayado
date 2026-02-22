import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { UpdateRoomDto } from './dto/update-room.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { cloudinaryStorage } from 'src/config/cloudinary/config';
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: cloudinaryStorage,
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return callback(new Error('Solo se permiten archivos PDF'), false);
        }
        callback(null, true);
      },
    }),
  ) 
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!file) {
      throw new NotFoundException('No se ha subido ningún archivo o el formato es inválido');
    }
    return this.roomsService.create({ title, bookUrl: (file as any).path }, file);
  }

  @Get('join/:pin')
  async joinRoom(@Param('pin') pin: string) {
    const room = await this.roomsService.findByPin(pin);
    console.log('Buscando sala con PIN:', pin);
    if (!room) {
      throw new NotFoundException(`La sala con el pin ${pin} no existe`);
    }
    return room;
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
