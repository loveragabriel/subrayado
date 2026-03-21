import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { cloudinaryStorage } from 'src/config/cloudinary/config';
import { Throttle } from '@nestjs/throttler';
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Throttle({
    default: {
      ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
      limit: parseInt(process.env.THROTTLE_ROOMS_LIMIT ?? '5', 10),
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: cloudinaryStorage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|epub)$/i)) {
          return callback(
            new Error('Solo se permiten archivos PDF o ePub'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
  ) {
    if (!file) {
      throw new NotFoundException(
        'No se ha subido ningún archivo o el formato es inválido',
      );
    }
    const multerFile = file as Express.Multer.File & { path: string };
    return this.roomsService.create(
      { title, bookUrl: multerFile.path, startDate, endDate },
      file,
    );
  }

  @Get('join/:pin')
  async joinRoom(@Param('pin') pin: string) {
    const room = await this.roomsService.findByPin(pin);
    if (!room) {
      throw new NotFoundException(`La sala con el pin ${pin} no existe`);
    }
    return room;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }
}
