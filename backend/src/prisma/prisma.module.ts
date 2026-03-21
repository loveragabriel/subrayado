import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // This makes PrismaService available globally without importing it in each module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
