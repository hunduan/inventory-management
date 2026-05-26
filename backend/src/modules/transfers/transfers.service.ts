import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where, include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } },
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transfer.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.transfer.findFirst({
      where: { id, tenantId },
      include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } },
    });
    if (!item) throw new NotFoundException('调拨单不存在');
    return item;
  }

  async create(tenantId: string, userId: string, data: { fromWarehouseId: string; toWarehouseId: string; remark?: string; items: { productId: string; quantity: number }[] }) {
    return this.prisma.transfer.create({
      data: {
        tenantId, fromWarehouseId: data.fromWarehouseId, toWarehouseId: data.toWarehouseId,
        remark: data.remark, status: 'DRAFT', createdBy: userId,
        items: { create: data.items },
      },
      include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } },
    });
  }

  async confirm(tenantId: string, id: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, tenantId },
    });
    if (!transfer) throw new NotFoundException('调拨单不存在');
    if (transfer.status !== 'DRAFT') throw new BadRequestException('调拨单状态不正确');

    const result = await this.prisma.transfer.updateMany({
      where: { id, tenantId, status: 'DRAFT' },
      data: { status: 'CONFIRMED' },
    });
    if (result.count === 0) throw new BadRequestException('调拨单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }

  async complete(tenantId: string, id: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundException('调拨单不存在');
    if (transfer.status !== 'CONFIRMED') throw new BadRequestException('调拨单未确认');

    await this.prisma.$transaction(async (tx) => {
      const statusResult = await tx.transfer.updateMany({
        where: { id, tenantId, status: 'CONFIRMED' },
        data: { status: 'COMPLETED' },
      });
      if (statusResult.count === 0) throw new BadRequestException('调拨单状态已变化，请刷新后重试');

      for (const item of transfer.items) {
        // Deduct from source
        const fromInv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: transfer.fromWarehouseId },
        });
        if (!fromInv || Number(fromInv.quantity) < Number(item.quantity)) {
          throw new BadRequestException(`源仓库库存不足，无法调拨`);
        }

        const fromOldQty = Number(fromInv.quantity);
        const fromNewQty = fromOldQty - Number(item.quantity);
        const fromUpdateResult = await tx.inventory.updateMany({
          where: { id: fromInv.id, quantity: { gte: item.quantity } },
          data: { quantity: fromNewQty },
        });
        if (fromUpdateResult.count === 0) throw new BadRequestException('源仓库库存不足或已变化，无法调拨');
        await tx.inventoryLog.create({
          data: { tenantId, productId: item.productId, warehouseId: transfer.fromWarehouseId,
            type: 'TRANSFER_OUT', quantity: -Number(item.quantity), beforeQty: fromOldQty, afterQty: fromNewQty,
            refId: transfer.id, refType: 'TRANSFER' },
        });

        // Add to target
        const toInv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId },
        });
        if (toInv) {
          const toOldQty = Number(toInv.quantity);
          const toNewQty = toOldQty + Number(item.quantity);
          const toUpdateResult = await tx.inventory.updateMany({
            where: { id: toInv.id },
            data: { quantity: toNewQty },
          });
          if (toUpdateResult.count === 0) throw new BadRequestException('目标仓库库存记录已变化，请刷新后重试');
          await tx.inventoryLog.create({
            data: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId,
              type: 'TRANSFER_IN', quantity: item.quantity, beforeQty: toOldQty, afterQty: toNewQty,
              refId: transfer.id, refType: 'TRANSFER' },
          });
        } else {
          await tx.inventory.create({
            data: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId, quantity: item.quantity, unitCost: 0 },
          });
          await tx.inventoryLog.create({
            data: { tenantId, productId: item.productId, warehouseId: transfer.toWarehouseId,
              type: 'TRANSFER_IN', quantity: item.quantity, beforeQty: 0, afterQty: Number(item.quantity),
              refId: transfer.id, refType: 'TRANSFER' },
          });
        }
      }
    });

    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, tenantId },
    });
    if (!transfer) throw new NotFoundException('调拨单不存在');
    if (transfer.status === 'COMPLETED') throw new BadRequestException('已完成的调拨单不能作废');

    const result = await this.prisma.transfer.updateMany({
      where: { id, tenantId, status: { in: ['DRAFT', 'CONFIRMED'] } },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) throw new BadRequestException('调拨单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }
}
