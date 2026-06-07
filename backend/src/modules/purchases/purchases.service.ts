import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

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
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async update(tenantId: string, id: string, dto: UpdatePurchaseDto) {
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status !== 'DRAFT' && order.status !== 'CONFIRMED') throw new BadRequestException('只有草稿或已确认的采购单可以编辑');

    const updateData: any = {};
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;
    if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
    if (dto.remark !== undefined) updateData.remark = dto.remark;

    if (dto.items && dto.items.length > 0) {
      const newItems = dto.items.map((item) => ({
        tenantId,
        productId: item.productId!,
        quantity: item.quantity!,
        unitCost: item.unitCost!,
        subtotal: item.quantity! * item.unitCost!,
      }));
      updateData.totalAmount = newItems.reduce((sum, item) => sum + item.subtotal, 0);

      await this.prisma.$transaction(async (tx) => {
        await tx.purchaseItem.deleteMany({ where: { purchaseOrderId: id } });
        await tx.purchaseOrder.update({
          where: { id },
          data: {
            ...updateData,
            items: { create: newItems },
          },
        });
      });
    } else {
      await this.prisma.purchaseOrder.updateMany({
        where: { id, tenantId },
        data: updateData,
      });
    }

    return this.findById(tenantId, id);
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

  async receiveItem(tenantId: string, id: string, itemId: string, quantity: number) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true, warehouse: true },
    });
    if (!order) throw new NotFoundException('采购单不存在');
    if (order.status !== 'CONFIRMED') throw new BadRequestException('只有已确认采购单可以入库');
    if (!order.warehouseId) throw new BadRequestException('采购单未指定仓库');

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('采购商品不存在');

    const remaining = Number(item.quantity) - Number(item.receivedQty || 0);
    if (quantity > remaining) throw new BadRequestException(`入库数量不能超过剩余未入库数量 ${remaining}`);

    await this.prisma.$transaction(async (tx) => {
      const itemResult = await tx.purchaseItem.updateMany({
        where: { id: itemId, purchaseOrderId: id },
        data: { receivedQty: { increment: quantity } },
      });
      if (itemResult.count === 0) throw new BadRequestException('商品行已变化，请刷新后重试');

      const inv = await tx.inventory.findFirst({
        where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
      });

      if (inv) {
        const newQty = Number(inv.quantity) + quantity;
        const updateResult = await tx.inventory.updateMany({
          where: { id: inv.id },
          data: { quantity: newQty },
        });
        if (updateResult.count === 0) throw new BadRequestException('库存记录已变化，请刷新后重试');
        await tx.inventoryLog.create({
          data: {
            tenantId, productId: item.productId, warehouseId: order.warehouseId,
            type: 'PURCHASE_IN', quantity,
            beforeQty: Number(inv.quantity), afterQty: newQty,
            refId: order.id, refType: 'PURCHASE_ORDER',
          },
        });
      } else {
        await tx.inventory.create({
          data: { tenantId, productId: item.productId, warehouseId: order.warehouseId!, quantity, unitCost: item.unitCost },
        });
        await tx.inventoryLog.create({
          data: {
            tenantId, productId: item.productId, warehouseId: order.warehouseId,
            type: 'PURCHASE_IN', quantity, beforeQty: 0, afterQty: quantity,
            refId: order.id, refType: 'PURCHASE_ORDER',
          },
        });
      }
    });

    // Check if all items are fully received → auto transition to RECEIVED
    const updatedOrder = await this.findById(tenantId, id);
    const allReceived = updatedOrder.items!.every((i) => Number(i.receivedQty || 0) >= Number(i.quantity));
    if (allReceived && updatedOrder.status === 'CONFIRMED') {
      await this.prisma.purchaseOrder.updateMany({
        where: { id, tenantId, status: 'CONFIRMED' },
        data: { status: 'RECEIVED' },
      });
    }

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
        const remaining = Number(item.quantity) - Number(item.receivedQty || 0);
        if (remaining <= 0) continue;

        await tx.purchaseItem.updateMany({
          where: { id: item.id, purchaseOrderId: id },
          data: { receivedQty: { increment: remaining } },
        });

        const inv = await tx.inventory.findFirst({
          where: { tenantId, productId: item.productId, warehouseId: order.warehouseId! },
        });

        if (inv) {
          const newQty = Number(inv.quantity) + remaining;
          const updateResult = await tx.inventory.updateMany({
            where: { id: inv.id },
            data: { quantity: newQty },
          });
          if (updateResult.count === 0) throw new BadRequestException('库存记录已变化，请刷新后重试');
          await tx.inventoryLog.create({
            data: {
              tenantId, productId: item.productId, warehouseId: order.warehouseId,
              type: 'PURCHASE_IN', quantity: remaining,
              beforeQty: Number(inv.quantity), afterQty: newQty,
              refId: order.id, refType: 'PURCHASE_ORDER',
            },
          });
        } else {
          await tx.inventory.create({
            data: { tenantId, productId: item.productId, warehouseId: order.warehouseId!, quantity: remaining, unitCost: item.unitCost },
          });
          await tx.inventoryLog.create({
            data: {
              tenantId, productId: item.productId, warehouseId: order.warehouseId,
              type: 'PURCHASE_IN', quantity: remaining, beforeQty: 0, afterQty: remaining,
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

  async exportExcel(tenantId: string, query: any): Promise<Buffer> {
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

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true, warehouse: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const statusLabels: Record<string, string> = {
      DRAFT: '草稿', CONFIRMED: '已确认', RECEIVED: '已入库', CANCELLED: '已作废',
    };

    const rows: any[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        rows.push({
          '单号': order.orderNo,
          '供应商': order.supplier?.name || '',
          '仓库': order.warehouse?.name || '',
          '商品名称': item.product?.name || '',
          '数量': Number(item.quantity),
          '单价': Number(item.unitCost),
          '小计': Number(item.subtotal),
          '总金额': Number(order.totalAmount),
          '状态': statusLabels[order.status] || order.status,
          '创建时间': order.createdAt.toISOString().replace('T', ' ').slice(0, 16),
        });
      }
    }

    const XLSX = require('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '采购单');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
}
