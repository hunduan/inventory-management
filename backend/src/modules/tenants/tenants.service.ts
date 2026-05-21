import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; logo?: string }) {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
