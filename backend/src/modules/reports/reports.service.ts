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
      include: { items: { include: { product: true } } },
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);
      for (const item of order.items) {
        const costPrice = Number(item.product.costPrice);
        totalCost += costPrice * Number(item.quantity);
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, grossProfit, margin: Math.round(margin * 100) / 100 };
  }
}
