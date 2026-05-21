import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.warehouse.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('仓库不存在');
    return item;
  }

  async create(tenantId: string, data: { name: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    return this.prisma.warehouse.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    await this.findById(tenantId, id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.warehouse.update({ where: { id }, data: { enabled: false } });
  }
}
