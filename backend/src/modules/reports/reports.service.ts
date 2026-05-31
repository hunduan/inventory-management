import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async purchaseReport(tenantId: string, startDate: Date, endDate: Date) {
    const where = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: 'RECEIVED' as const,
    };

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true, items: true },
    });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Group by supplier
    const bySupplier: Record<string, { supplierName: string; orderCount: number; totalAmount: number }> = {};
    for (const order of orders) {
      const key = order.supplierId || 'unknown';
      if (!bySupplier[key]) {
        bySupplier[key] = { supplierName: order.supplier?.name || '未知', orderCount: 0, totalAmount: 0 };
      }
      bySupplier[key].orderCount++;
      bySupplier[key].totalAmount += Number(order.totalAmount);
    }

    return { totalOrders, totalAmount, bySupplier: Object.values(bySupplier) };
  }

  async saleReport(tenantId: string, startDate: Date, endDate: Date) {
    const where = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: 'DELIVERED' as const,
    };

    const orders = await this.prisma.saleOrder.findMany({
      where,
      include: { customer: true, items: true },
    });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // Group by customer
    const byCustomer: Record<string, { customerName: string; orderCount: number; totalAmount: number }> = {};
    for (const order of orders) {
      const key = order.customerId || 'unknown';
      if (!byCustomer[key]) {
        byCustomer[key] = { customerName: order.customer?.name || '未知', orderCount: 0, totalAmount: 0 };
      }
      byCustomer[key].orderCount++;
      byCustomer[key].totalAmount += Number(order.totalAmount);
    }

    return { totalOrders, totalAmount, byCustomer: Object.values(byCustomer) };
  }

  async profitReport(tenantId: string, startDate: Date, endDate: Date) {
    const where = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: 'DELIVERED' as const,
    };

    const orders = await this.prisma.saleOrder.findMany({
      where,
      include: { items: true },
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);
      for (const item of order.items) {
        totalCost += Number(item.unitCost) * Number(item.quantity);
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, grossProfit, totalProfit: grossProfit, margin: Math.round(margin * 100) / 100 };
  }

  async dashboard(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayPurchaseAmount,
      todaySaleAmount,
      monthPurchaseAmount,
      monthSaleAmount,
      lowStockItems,
      totalProducts,
      recentPurchases,
      recentSales,
    ] = await Promise.all([
      this.prisma.purchaseOrder.aggregate({ where: { tenantId, createdAt: { gte: todayStart }, status: 'RECEIVED' }, _sum: { totalAmount: true } }),
      this.prisma.saleOrder.aggregate({ where: { tenantId, createdAt: { gte: todayStart }, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
      this.prisma.purchaseOrder.aggregate({ where: { tenantId, createdAt: { gte: monthStart }, status: 'RECEIVED' }, _sum: { totalAmount: true } }),
      this.prisma.saleOrder.aggregate({ where: { tenantId, createdAt: { gte: monthStart }, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
      this.prisma.inventory.count({ where: { tenantId, quantity: { lt: 10 } } }),
      this.prisma.product.count({ where: { tenantId, enabled: true } }),
      this.prisma.purchaseOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { supplier: true },
      }),
      this.prisma.saleOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: true },
      }),
    ]);

    return {
      todaySales: Number(todaySaleAmount._sum.totalAmount || 0),
      todayPurchases: Number(todayPurchaseAmount._sum.totalAmount || 0),
      monthlySales: Number(monthSaleAmount._sum.totalAmount || 0),
      monthlyPurchases: Number(monthPurchaseAmount._sum.totalAmount || 0),
      totalProducts,
      lowStockCount: lowStockItems,
      recentPurchases,
      recentSales,
    };
  }

  async inventoryValue(tenantId: string) {
    const items = await this.prisma.inventory.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      include: { warehouse: true, product: true },
    });

    const byWarehouse: Record<string, { warehouseName: string; itemCount: number; totalValue: number }> = {};
    let grandTotal = 0;

    for (const item of items) {
      const whId = item.warehouseId;
      if (!byWarehouse[whId]) {
        byWarehouse[whId] = { warehouseName: item.warehouse?.name || '未知', itemCount: 0, totalValue: 0 };
      }
      const value = Number(item.quantity) * Number(item.unitCost);
      byWarehouse[whId].itemCount++;
      byWarehouse[whId].totalValue += value;
      grandTotal += value;
    }

    return { grandTotal, byWarehouse: Object.values(byWarehouse) };
  }
}
