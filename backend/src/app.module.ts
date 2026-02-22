import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [RoomsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
