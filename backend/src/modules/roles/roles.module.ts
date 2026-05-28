import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  providers: [RolesService, PrismaService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
