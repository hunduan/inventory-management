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
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status !== 'DRAFT') throw new BadRequestException('只有草稿采购单可以确认');

    const result = await this.prisma.purchaseOrder.updateMany({
      where: { id, tenantId, status: 'DRAFT' },
      data: { status: 'CONFIRMED' },
    });
    if (result.count === 0) throw new BadRequestException('采购单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }

  async receive(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, warehouse: true },
    });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('只有已确认采购单可以入库');
    if (!order.warehouseId) throw new BadRequestException('采购单未指定仓库');

    await this.prisma.$transaction(async (tx) => {
      const statusResult = await tx.purchaseOrder.updateMany({
        where: { id, tenantId, status: 'CONFIRMED' },
        data: { status: 'RECEIVED' },
      });
      if (statusResult.count === 0) throw new BadRequestException('采购单状态已变化，请刷新后重试');

      for (const item of order.items) {
        const inv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
        });

        if (inv) {
          const newQty = Number(inv.quantity) + Number(item.quantity);
          const updateResult = await tx.inventory.updateMany({
            where: { id: inv.id },
            data: { quantity: newQty },
          });
          if (updateResult.count === 0) throw new BadRequestException('库存记录已变化，请刷新后重试');
          await tx.inventoryLog.create({
            data: {
              tenantId, productId: item.productId, warehouseId: order.warehouseId,
              type: 'PURCHASE_IN', quantity: item.quantity,
              beforeQty: Number(inv.quantity), afterQty: newQty,
              refId: order.id, refType: 'PURCHASE_ORDER',
            },
          });
        } else {
          await tx.inventory.create({
            data: { tenantId, productId: item.productId, warehouseId: order.warehouseId!, quantity: item.quantity, unitCost: item.unitCost },
          });
          await tx.inventoryLog.create({
            data: {
              tenantId, productId: item.productId, warehouseId: order.warehouseId,
              type: 'PURCHASE_IN', quantity: item.quantity, beforeQty: 0, afterQty: Number(item.quantity),
              refId: order.id, refType: 'PURCHASE_ORDER',
            },
          });
        }
      }
    });

    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status === 'RECEIVED') throw new BadRequestException('已入库采购单不能取消');
    if (order.status === 'CANCELLED') throw new BadRequestException('采购单已取消');

    const result = await this.prisma.purchaseOrder.updateMany({
      where: { id, tenantId, status: { in: ['DRAFT', 'CONFIRMED'] } },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) throw new BadRequestException('采购单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }
}
