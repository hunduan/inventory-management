import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNo(tenantId: string): Promise<string> {
    const date = new Date();
    const prefix = `SO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;
    const count = await this.prisma.saleOrder.count({
      where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: string; warehouseId?: string; productId?: string; startDate?: string; endDate?: string }) {
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    if (query.productId) {
      where.items = { some: { productId: query.productId } };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [items, total] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where,
        include: { customer: true, warehouse: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.saleOrder.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.saleOrder.findFirst({
      where: { id, tenantId },
      include: { customer: true, warehouse: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('销售单不存在');
    return order;
  }

  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    const orderNo = await this.generateOrderNo(tenantId);
    const items = await Promise.all(dto.items.map(async (item) => {
      const inv = await this.prisma.inventory.findFirst({
        where: { tenantId, productId: item.productId, warehouseId: dto.warehouseId },
      });
      const unitCost = inv ? Number(inv.unitCost) : 0;
      return {
        tenantId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost,
        subtotal: item.quantity * item.unitPrice,
      };
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return this.prisma.saleOrder.create({
      data: {
        tenantId, orderNo, customerId: dto.customerId, warehouseId: dto.warehouseId,
        remark: dto.remark, totalAmount, status: 'DRAFT', createdBy: userId,
        items: { create: items },
      },
      include: { customer: true, items: { include: { product: true } } },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSaleDto) {
    const order = await this.prisma.saleOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('销售单不存在');
    if (order.status !== 'DRAFT' && order.status !== 'CONFIRMED') throw new BadRequestException('只有草稿或已确认的销售单可以编辑');

    const updateData: any = {};
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.remark !== undefined) updateData.remark = dto.remark;

    if (dto.items && dto.items.length > 0) {
      const newItems = await Promise.all(dto.items.map(async (item) => {
        const wid = dto.warehouseId || order.warehouseId || undefined;
        const inv = wid ? await this.prisma.inventory.findFirst({
          where: { tenantId, productId: item.productId!, warehouseId: wid },
        }) : null;
        const unitCost = inv ? Number(inv.unitCost) : 0;
        return {
          tenantId,
          productId: item.productId!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          unitCost,
          subtotal: item.quantity! * item.unitPrice!,
        };
      }));
      updateData.totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      await this.prisma.$transaction(async (tx) => {
        await tx.saleItem.deleteMany({ where: { saleOrderId: id } });
        await tx.saleOrder.update({
          where: { id },
          data: {
            ...updateData,
            items: { create: newItems },
          },
        });
      });
    } else {
      await this.prisma.saleOrder.updateMany({
        where: { id, tenantId },
        data: updateData,
      });
    }

    return this.findById(tenantId, id);
  }

  async confirm(tenantId: string, id: string) {
    const order = await this.prisma.saleOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('销售单不存在');
    if (order.status !== 'DRAFT') throw new BadRequestException('只有草稿销售单可以确认');

    const result = await this.prisma.saleOrder.updateMany({
      where: { id, tenantId, status: 'DRAFT' },
      data: { status: 'CONFIRMED' },
    });
    if (result.count === 0) throw new BadRequestException('销售单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }

  async deliverItem(tenantId: string, id: string, itemId: string, quantity: number) {
    const order = await this.prisma.saleOrder.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, warehouse: true },
    });
    if (!order) throw new NotFoundException('销售单不存在');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('只有已确认销售单可以出库');
    if (!order.warehouseId) throw new BadRequestException('销售单未指定仓库');

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('销售商品不存在');

    const remaining = Number(item.quantity) - Number(item.deliveredQty || 0);
    if (quantity > remaining) throw new BadRequestException(`出库数量不能超过剩余未出库数量 ${remaining}`);

    await this.prisma.$transaction(async (tx) => {
      const itemResult = await tx.saleItem.updateMany({
        where: { id: itemId, saleOrderId: id },
        data: { deliveredQty: { increment: quantity } },
      });
      if (itemResult.count === 0) throw new BadRequestException('商品行已变化，请刷新后重试');

      const inv = await tx.inventory.findFirst({
        where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
      });

      if (!inv || Number(inv.quantity) < quantity) {
        throw new BadRequestException(`商品 ${item.product.name} 库存不足`);
      }

      const newQty = Number(inv.quantity) - quantity;
      const updateResult = await tx.inventory.updateMany({
        where: { id: inv.id, quantity: { gte: quantity } },
        data: { quantity: newQty },
      });
      if (updateResult.count === 0) {
        throw new BadRequestException(`商品 ${item.product.name} 库存不足或已变化`);
      }
      await tx.inventoryLog.create({
        data: {
          tenantId, productId: item.productId, warehouseId: order.warehouseId,
          type: 'SALE_OUT', quantity,
          beforeQty: Number(inv.quantity), afterQty: newQty,
          refId: order.id, refType: 'SALE_ORDER',
        },
      });
    });

    // Check if all items are fully delivered → auto transition to DELIVERED
    const updatedOrder = await this.findById(tenantId, id);
    const allDelivered = updatedOrder.items!.every((i) => Number(i.deliveredQty || 0) >= Number(i.quantity));
    if (allDelivered && updatedOrder.status === 'CONFIRMED') {
      await this.prisma.saleOrder.updateMany({
        where: { id, tenantId, status: 'CONFIRMED' },
        data: { status: 'DELIVERED' },
      });
    }

    return this.findById(tenantId, id);
  }

  async deliver(tenantId: string, id: string) {
    const order = await this.prisma.saleOrder.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } }, warehouse: true },
    });
    if (!order) throw new NotFoundException('销售单不存在');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('销售单未确认，无法发货');
    if (!order.warehouseId) throw new BadRequestException('销售单未指定仓库');

    await this.prisma.$transaction(async (tx) => {
      const statusResult = await tx.saleOrder.updateMany({
        where: { id, tenantId, status: 'CONFIRMED' },
        data: { status: 'DELIVERED' },
      });
      if (statusResult.count === 0) throw new BadRequestException('销售单状态已变化，请刷新后重试');

      for (const item of order.items) {
        const remaining = Number(item.quantity) - Number(item.deliveredQty || 0);
        if (remaining <= 0) continue;

        await tx.saleItem.updateMany({
          where: { id: item.id, saleOrderId: id },
          data: { deliveredQty: { increment: remaining } },
        });

        const inv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
        });

        if (!inv || Number(inv.quantity) < remaining) {
          throw new BadRequestException(`商品 ${item.product.name} 库存不足`);
        }

        const newQty = Number(inv.quantity) - remaining;
        const updateResult = await tx.inventory.updateMany({
          where: { id: inv.id, quantity: { gte: remaining } },
          data: { quantity: newQty },
        });
        if (updateResult.count === 0) {
          throw new BadRequestException(`商品 ${item.product.name} 库存不足或已变化`);
        }
        await tx.inventoryLog.create({
          data: {
            tenantId, productId: item.productId, warehouseId: order.warehouseId,
            type: 'SALE_OUT', quantity: remaining,
            beforeQty: Number(inv.quantity), afterQty: newQty,
            refId: order.id, refType: 'SALE_ORDER',
          },
        });
      }
    });

    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const order = await this.prisma.saleOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('销售单不存在');
    if (order.status === 'DELIVERED') throw new BadRequestException('已出库销售单不能取消');
    if (order.status === 'CANCELLED') throw new BadRequestException('销售单已取消');

    const result = await this.prisma.saleOrder.updateMany({
      where: { id, tenantId, status: { in: ['DRAFT', 'CONFIRMED'] } },
      data: { status: 'CANCELLED' },
    });
    if (result.count === 0) throw new BadRequestException('销售单状态已变化，请刷新后重试');
    return this.findById(tenantId, id);
  }
}
