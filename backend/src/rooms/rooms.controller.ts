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
import { CreateRoomDto } from './dto/create-room.dto';
import { REST_ERRORS } from './constants/rest-errors.constants';
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
            new Error(REST_ERRORS.INVALID_FILE_FORMAT),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateRoomDto,
  ) {
    if (!file) {
      throw new NotFoundException(REST_ERRORS.MISSING_FILE);
    }
    return this.roomsService.create(body, file);
  }

  @Get('join/:pin')
  async joinRoom(@Param('pin') pin: string) {
    const room = await this.roomsService.findByPin(pin);
    if (!room) {
      throw new NotFoundException(`${REST_ERRORS.ROOM_NOT_FOUND} ${pin}`);
    }
    return room;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }
}
