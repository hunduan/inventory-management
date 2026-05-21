import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; limit?: number; productId?: string; warehouseId?: string; search?: string }) {
    const where: any = { tenantId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.search) {
      where.product = {
        name: { contains: query.search, mode: 'insensitive' },
      };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: { product: true, warehouse: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAlerts(tenantId: string, threshold: number = 10) {
    return this.prisma.inventory.findMany({
      where: { tenantId, quantity: { lte: threshold } },
      include: { product: true, warehouse: true },
      orderBy: { quantity: 'asc' },
    });
  }

  async getLogs(tenantId: string, query: { page?: number; limit?: number; productId?: string }) {
    const where: any = { tenantId };
    if (query.productId) where.productId = query.productId;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [items, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: { product: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
