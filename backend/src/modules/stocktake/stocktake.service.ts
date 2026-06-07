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
    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
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

  async updateItem(tenantId: string, stocktakeId: string, itemId: string, actualQuantity: number) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id: stocktakeId, tenantId, status: 'IN_PROGRESS' },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在或状态不正确');

    const item = await this.prisma.stocktakeItem.findFirst({
      where: { id: itemId, stocktakeId, tenantId },
    });
    if (!item) throw new NotFoundException('盘点项不存在');

    const diff = actualQuantity - Number(item.bookQuantity);

    await this.prisma.stocktakeItem.updateMany({
      where: { id: itemId, stocktakeId },
      data: { actualQuantity, diffQuantity: diff },
    });

    return this.findById(tenantId, stocktakeId);
  }

  async complete(tenantId: string, id: string, items?: Record<string, number>) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id, tenantId },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在');
    if (stocktake.status !== 'IN_PROGRESS') throw new BadRequestException('盘点单状态不正确');

    await this.prisma.$transaction(async (tx) => {
      // Apply actual quantities inside transaction (if provided)
      if (items && Object.keys(items).length > 0) {
        for (const [itemId, actualQty] of Object.entries(items)) {
          const existing = await tx.stocktakeItem.findFirst({
            where: { id: itemId, stocktakeId: id, tenantId },
          });
          if (!existing) continue;
          const diff = actualQty - Number(existing.bookQuantity);
          await tx.stocktakeItem.updateMany({
            where: { id: itemId, stocktakeId: id },
            data: { actualQuantity: actualQty, diffQuantity: diff },
          });
        }
      }

      // Re-read items inside transaction for fresh data
      const freshItems = await tx.stocktakeItem.findMany({
        where: { stocktakeId: id, tenantId },
      });

      for (const item of freshItems) {
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

      // Update status to COMPLETED after all items processed
      const statusResult = await tx.stocktake.updateMany({
        where: { id, tenantId, status: 'IN_PROGRESS' },
        data: { status: 'COMPLETED' },
      });
      if (statusResult.count === 0) throw new BadRequestException('盘点单状态已变化，请刷新后重试');
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

  async getImportTemplate(tenantId: string): Promise<Buffer> {
    const XLSX = require('xlsx');

    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
        include: { attributes: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.product.findMany({
        where: { tenantId, enabled: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const wb = XLSX.utils.book_new();
    const baseColumns = ['商品名称', '条码', 'SKU', '账面数量', '实盘数量'];

    const byCat = new Map<string, typeof products>();
    const uncategorized: typeof products = [];
    for (const p of products) {
      if (p.category?.name) {
        const list = byCat.get(p.category.name) || [];
        list.push(p);
        byCat.set(p.category.name, list);
      } else {
        uncategorized.push(p);
      }
    }

    for (const cat of categories) {
      const attrNames = cat.attributes.map((a) => a.name);
      const catProducts = byCat.get(cat.name) || [];

      const rows = catProducts.map((p) => {
        const specs = (p.specs as Record<string, any>) || {};
        const row: Record<string, any> = {
          '商品名称': p.name,
          '条码': p.barcode || '',
          'SKU': p.sku || '',
          '账面数量': '',
          '实盘数量': '',
        };
        for (const attr of cat.attributes) {
          row[attr.name] = specs[attr.name] ?? '';
        }
        return row;
      });

      const emptyRow: Record<string, any> = { '商品名称': '', '条码': '', 'SKU': '', '账面数量': '', '实盘数量': '' };
      for (const n of attrNames) emptyRow[n] = '';
      rows.push(emptyRow);

      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
      ws['!cols'] = [
        { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
        ...attrNames.map(() => ({ wch: 15 })),
      ];
      XLSX.utils.book_append_sheet(wb, ws, cat.name.substring(0, 31));
    }

    if (uncategorized.length > 0) {
      const rows = uncategorized.map((p) => ({
        '商品名称': p.name, '条码': p.barcode || '', 'SKU': p.sku || '',
        '账面数量': '', '实盘数量': '',
      }));
      rows.push({ '商品名称': '', '条码': '', 'SKU': '', '账面数量': '', '实盘数量': '' });
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
      ws['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, '未分类');
    }

    if (wb.SheetNames.length === 0) {
      const ws = XLSX.utils.json_to_sheet([
        { '商品名称': '', '条码': '', 'SKU': '', '账面数量': '', '实盘数量': '' },
      ]);
      ws['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, '盘点导入');
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  async importFromExcel(tenantId: string, stocktakeId: string, file: Express.Multer.File) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id: stocktakeId, tenantId, status: { in: ['DRAFT', 'IN_PROGRESS'] } },
      include: { items: { include: { product: true } } },
    });
    if (!stocktake) throw new NotFoundException('盘点单不存在或状态不正确');

    const XLSX = require('xlsx');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    let imported = 0;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
      if (rows.length === 0) continue;

      for (const row of rows) {
        const productName = String(row['商品名称'] || '').trim();
        const barcode = String(row['条码'] || '').trim();
        const actualQty = Number(row['实盘数量']);
        if (!productName || isNaN(actualQty)) continue;

        const product = await this.prisma.product.findFirst({
          where: {
            tenantId,
            OR: [{ name: productName }, ...(barcode ? [{ barcode }] : [])],
          },
        });
        if (!product) continue;

        const existingItem = stocktake.items.find((i) => i.productId === product.id);
        if (!existingItem) continue;

        const diff = actualQty - Number(existingItem.bookQuantity);
        await this.prisma.stocktakeItem.updateMany({
          where: { id: existingItem.id, stocktakeId },
          data: { actualQuantity: actualQty, diffQuantity: diff },
        });
        imported++;
      }
    }

    if (imported === 0) throw new BadRequestException('未从文件中导入任何有效数据');

    return this.findById(tenantId, stocktakeId);
  }
}
