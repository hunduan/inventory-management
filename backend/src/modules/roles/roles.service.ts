import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async create(tenantId: string, data: { name: string; permissions?: string[] }) {
    const existing = await this.prisma.role.findFirst({ where: { tenantId, name: data.name } });
    if (existing) throw new ConflictException('该角色名称已存在');

    return this.prisma.role.create({
      data: {
        tenantId, name: data.name,
        permissions: data.permissions || [],
      },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; permissions?: string[] }) {
    const result = await this.prisma.role.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('角色不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.role.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('角色不存在');
    return { deleted: true };
  }
}
