import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { RoomsModule } from './rooms/rooms.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsGateway } from './rooms/gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    RoomsModule,
    PrismaModule,
  ],
  providers: [RoomsGateway],
})
export class AppModule {}
