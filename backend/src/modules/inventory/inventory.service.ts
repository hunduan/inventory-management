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

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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

  async getHistory(tenantId: string, query: { date: string; page?: number; limit?: number; warehouseId?: string; search?: string }) {
    const queryDate = new Date(query.date);
    if (isNaN(queryDate.getTime())) throw new Error('Invalid date');

    // Get current inventory as base
    const where: any = { tenantId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.search) {
      where.product = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [currentItems, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: { product: true, warehouse: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    // For each item, reverse-calculate stock at query date by subtracting changes after that date
    const items = await Promise.all(currentItems.map(async (item) => {
      const changesAfter = await this.prisma.inventoryLog.aggregate({
        where: {
          tenantId,
          productId: item.productId,
          warehouseId: item.warehouseId,
          createdAt: { gt: queryDate },
        },
        _sum: { quantity: true },
      });
      const netChange = Number(changesAfter._sum.quantity || 0);
      const quantityAtDate = Number(item.quantity) - netChange;

      return {
        ...item,
        quantityAtDate: String(quantityAtDate),
        quantity: item.quantity,
        netChangeSince: String(netChange),
      };
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
