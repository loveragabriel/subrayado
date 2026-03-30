import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsGateway } from './gateway';
import { MailModule } from 'src/email/module.mail';

@Module({
  imports: [MailModule],
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, RoomsGateway],
})
export class RoomsModule {}
