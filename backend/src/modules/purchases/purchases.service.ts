import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNo(tenantId: string): Promise<string> {
    const date = new Date();
    const prefix = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const count = await this.prisma.purchaseOrder.count({
      where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { supplier: true, warehouse: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('采购单不存在');
    return order;
  }

  async create(tenantId: string, userId: string, dto: CreatePurchaseDto) {
    const orderNo = await this.generateOrderNo(tenantId);
    const items = dto.items.map((item) => ({
      tenantId,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: item.quantity * item.unitCost,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId, orderNo, supplierId: dto.supplierId, warehouseId: dto.warehouseId,
        remark: dto.remark, totalAmount, status: 'DRAFT', createdBy: userId,
        items: { create: items },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });
  }

  async confirm(tenantId: string, id: string) {
    const result = await this.prisma.purchaseOrder.updateMany({ where: { id, tenantId }, data: { status: 'CONFIRMED' } });
    if (result.count === 0) throw new NotFoundException('采购单不存在');
    return this.findById(tenantId, id);
  }

  async receive(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, warehouse: true },
    });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('采购单未确认，无法入库');
    if (!order.warehouseId) throw new BadRequestException('采购单未指定仓库');

    // Update inventory for each item
    for (const item of order.items) {
      const inv = await this.prisma.inventory.findFirst({
        where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
      });

      if (inv) {
        const newQty = Number(inv.quantity) + Number(item.quantity);
        await this.prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: newQty },
        });
        await this.prisma.inventoryLog.create({
          data: {
            tenantId, productId: item.productId, warehouseId: order.warehouseId,
            type: 'PURCHASE_IN', quantity: item.quantity,
            beforeQty: Number(inv.quantity), afterQty: newQty,
            refId: order.id, refType: 'PURCHASE_ORDER',
          },
        });
      } else {
        await this.prisma.inventory.create({
          data: { tenantId, productId: item.productId, warehouseId: order.warehouseId!, quantity: item.quantity, unitCost: item.unitCost },
        });
        await this.prisma.inventoryLog.create({
          data: {
            tenantId, productId: item.productId, warehouseId: order.warehouseId,
            type: 'PURCHASE_IN', quantity: item.quantity, beforeQty: 0, afterQty: Number(item.quantity),
            refId: order.id, refType: 'PURCHASE_ORDER',
          },
        });
      }
    }

    await this.prisma.purchaseOrder.updateMany({
      where: { id, tenantId },
      data: { status: 'RECEIVED' },
    });
    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const result = await this.prisma.purchaseOrder.updateMany({ where: { id, tenantId }, data: { status: 'CANCELLED' } });
    if (result.count === 0) throw new NotFoundException('采购单不存在');
    return this.findById(tenantId, id);
  }
}
