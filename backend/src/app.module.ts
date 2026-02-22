import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { RoomsModule } from './rooms/rooms.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    RoomsModule,
    PrismaModule,
  ],
})
export class AppModule {}
