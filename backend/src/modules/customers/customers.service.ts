import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    const where: any = { tenantId, enabled: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    const total = await this.prisma.customer.count({ where });

    const items = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT c.id, c.name, c.tenant_id, c.phone, c.address, c.enabled, c.created_at, c.updated_at,
              COALESCE(SUM(so.total_amount), 0) as total_amount
       FROM customers c
       LEFT JOIN sale_orders so ON so.customer_id = c.id AND so.status != 'CANCELLED'
       WHERE c.tenant_id = $1 AND c.enabled = true
         AND ($2 = '' OR c.name ILIKE $2 OR c.phone ILIKE $2)
       GROUP BY c.id
       ORDER BY total_amount DESC
       LIMIT $3 OFFSET $4`,
      tenantId, `%${search}%`, limit, skip,
    );

    return {
      data: items.map((item: any) => ({
        id: item.id,
        tenantId: item.tenant_id,
        name: item.name,
        phone: item.phone,
        address: item.address,
        enabled: item.enabled,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        totalAmount: Number(item.total_amount),
      })),
      total, page, limit, totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('客户不存在');
    return item;
  }

  async create(tenantId: string, data: { name: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    return this.prisma.customer.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: { name?: string; phone?: string; email?: string; address?: string; contact?: string; remark?: string }) {
    const result = await this.prisma.customer.updateMany({ where: { id, tenantId }, data });
    if (result.count === 0) throw new NotFoundException('客户不存在');
    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.customer.updateMany({ where: { id, tenantId }, data: { enabled: false } });
    if (result.count === 0) throw new NotFoundException('客户不存在');
    return this.findById(tenantId, id);
  }
}
