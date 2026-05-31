import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuppliersService {
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
    const total = await this.prisma.supplier.count({ where });

    // 带往来金额的列表，按总金额降序
    const items = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT s.id, s.name, s.tenant_id, s.phone, s.contact, s.address, s.enabled, s.created_at, s.updated_at,
              COALESCE(SUM(po.total_amount), 0) as total_amount
       FROM suppliers s
       LEFT JOIN purchase_orders po ON po.supplier_id = s.id AND po.status != 'CANCELLED'
       WHERE s.tenant_id = $1 AND s.enabled = true
         AND ($2 = '' OR s.name ILIKE $2 OR s.phone ILIKE $2)
       GROUP BY s.id
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
        contact: item.contact,
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
