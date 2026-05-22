import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.supplier.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('供应商不存在');
    return item;
  }

  async create(tenantId: string, data: { name: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    return this.prisma.supplier.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    const result = await this.prisma.supplier.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('供应商不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.supplier.updateMany({ where: { id, tenantId }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('供应商不存在');
    return this.findById(tenantId, id);
  }
}
