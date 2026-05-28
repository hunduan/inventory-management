import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StocktakeService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.stocktake.findMany({
        where, include: { warehouse: true, items: { include: { product: true } } },
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stocktake.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.stocktake.findFirst({
      where: { id, tenantId },
      include: { warehouse: true, items: { include: { product: true } } },
    });
    if (!item) throw new NotFoundException('盘点单不存在');
    return item;
  }

  async create(tenantId: string, userId: string, data: { warehouseId: string; remark?: string }) {
    // Create stocktake with book quantities from current inventory
    const inventoryItems = await this.prisma.inventory.findMany({
      where: { tenantId, warehouseId: data.warehouseId },
    });

    return this.prisma.stocktake.create({
      data: {
        tenantId, warehouseId: data.warehouseId, remark: data.remark,
        status: 'DRAFT', createdBy: userId,
        items: {
          create: inventoryItems.map((inv) => ({
            tenantId,
            productId: inv.productId,
            bookQuantity: inv.quantity,
            actualQuantity: inv.quantity,
            diffQuantity: 0,
          })),
        },
      },
      include: { warehouse: true, items: { include: { product: true } } },
    });
  }

  async start(tenantId: string, id: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id, tenantId },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status !== 'DRAFT') throw new BadRequestException('盘点单状态不正确');

    const result = await this.prisma.stocktake.updateMany({
      where: { id, tenantId, status: 'DRAFT' },
      data: { status: 'IN_PROGRESS' },
    });
    if (result.count === 0) throw new BadRequestException('盘点单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }

  async complete(tenantId: string, id: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status !== 'IN_PROGRESS') throw new BadRequestException('盘点单状态不正确');

    await this.prisma.$transaction(async (tx) => {
      const statusResult = await tx.stocktake.updateMany({
        where: { id, tenantId, status: 'IN_PROGRESS' },
        data: { status: 'COMPLETED' },
      });
      if (statusResult.count === 0) throw new BadRequestException('盘点单状态已变化，请刷新后重试');

      for (const item of stocktake.items) {
        const diff = Number(item.actualQuantity) - Number(item.bookQuantity);
        if (diff === 0) continue;

        const inv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: stocktake.warehouseId },
        });
        if (inv) {
          const oldQty = Number(inv.quantity);
          const newQty = oldQty + diff;
          const updateResult = await tx.inventory.updateMany({
            where: { id: inv.id },
            data: { quantity: newQty },
          });
          if (updateResult.count === 0) throw new BadRequestException('库存记录已变化，请刷新后重试');
          await tx.inventoryLog.create({
            data: {
              tenantId, productId: item.productId, warehouseId: stocktake.warehouseId,
              type: 'STOCKTAKE', quantity: diff, beforeQty: oldQty, afterQty: newQty,
              refId: stocktake.id, refType: 'STOCKTAKE',
            },
          });
        }
      }
    });

    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id, tenantId },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status === 'COMPLETED') throw new BadRequestException('已完成的盘点单不能作废');

    const result = await this.prisma.stocktake.updateMany({
      where: { id, tenantId, status: { in: ['DRAFT', 'IN_PROGRESS'] } },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) throw new BadRequestException('盘点单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }
}
