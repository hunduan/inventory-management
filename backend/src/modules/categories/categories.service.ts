import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(tenantId: string, data: { name: string; parentId?: string; sortOrder?: number }) {
    return this.prisma.category.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; parentId?: string; sortOrder?: number }) {
    const result = await this.prisma.category.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('分类不存在');
    return this.findById(tenantId, id);
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('分类不存在');
    return item;
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.category.deleteMany({ where: { id, tenantId } });
    if (result.count === 0) throw new NotFoundException('分类不存在');
  }
}
