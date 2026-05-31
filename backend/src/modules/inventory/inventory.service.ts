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
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAlerts(tenantId: string, threshold: number = 10, page: number = 1, limit: number = 20) {
    const where = { tenantId, quantity: { lte: threshold } };
    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: { product: true, warehouse: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { quantity: 'asc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    const purchaseIds: string[] = [];
    const saleIds: string[] = [];
    const transferIds: string[] = [];
    const stocktakeIds: string[] = [];
    for (const item of items) {
      if (!item.refId || !item.refType) continue;
      if (item.refType === 'PURCHASE_ORDER') purchaseIds.push(item.refId);
      else if (item.refType === 'SALE_ORDER') saleIds.push(item.refId);
      else if (item.refType === 'TRANSFER') transferIds.push(item.refId);
      else if (item.refType === 'STOCKTAKE') stocktakeIds.push(item.refId);
    }

    const [purchases, sales, transfers, stocktakes] = await Promise.all([
      purchaseIds.length ? this.prisma.purchaseOrder.findMany({ where: { id: { in: purchaseIds }, tenantId }, include: { supplier: true } }) : [],
      saleIds.length ? this.prisma.saleOrder.findMany({ where: { id: { in: saleIds }, tenantId }, include: { customer: true } }) : [],
      transferIds.length ? this.prisma.transfer.findMany({ where: { id: { in: transferIds }, tenantId }, include: { fromWarehouse: true, toWarehouse: true } }) : [],
      stocktakeIds.length ? this.prisma.stocktake.findMany({ where: { id: { in: stocktakeIds }, tenantId }, include: { warehouse: true } }) : [],
    ]);

    const purchaseMap = new Map(purchases.map((p) => [p.id, p]));
    const saleMap = new Map(sales.map((s) => [s.id, s]));
    const transferMap = new Map(transfers.map((t) => [t.id, t]));
    const stocktakeMap = new Map(stocktakes.map((s) => [s.id, s]));

    const enrichedItems = items.map((item) => {
      let refOrder: any = null;
      if (item.refType === 'PURCHASE_ORDER' && item.refId) {
        const order = purchaseMap.get(item.refId);
        if (order) refOrder = { type: 'PURCHASE_ORDER', orderNo: order.orderNo, status: order.status, counterpartyName: order.supplier?.name || '-', totalAmount: order.totalAmount.toString() };
      } else if (item.refType === 'SALE_ORDER' && item.refId) {
        const order = saleMap.get(item.refId);
        if (order) refOrder = { type: 'SALE_ORDER', orderNo: order.orderNo, status: order.status, counterpartyName: order.customer?.name || '-', totalAmount: order.totalAmount.toString() };
      } else if (item.refType === 'TRANSFER' && item.refId) {
        const order = transferMap.get(item.refId);
        if (order) refOrder = { type: 'TRANSFER', orderNo: order.id.slice(0, 8), status: order.status, counterpartyName: `${order.fromWarehouse?.name || '-'} → ${order.toWarehouse?.name || '-'}`, totalAmount: '-' };
      } else if (item.refType === 'STOCKTAKE' && item.refId) {
        const order = stocktakeMap.get(item.refId);
        if (order) refOrder = { type: 'STOCKTAKE', orderNo: order.id.slice(0, 8), status: order.status, counterpartyName: order.warehouse?.name || '-', totalAmount: '-' };
      }
      return { ...item, refOrder };
    });

    return { data: enrichedItems, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
