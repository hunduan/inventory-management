import { api } from './request';

export interface DashboardData {
  todayPurchaseTotal: number;
  todaySaleTotal: number;
  alertCount: number;
  recentOrders: {
    id: string;
    orderNo: string;
    type: 'PURCHASE' | 'SALE';
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
}

export interface ReportData {
  totalAmount: number;
  count: number;
  data: any[];
}

export const reportsApi = {
  dashboard() {
    return api.get<DashboardData>('/reports/dashboard');
  },
  purchases(params?: { startDate?: string; endDate?: string }) {
    const query: string[] = [];
    if (params?.startDate) query.push(`startDate=${params.startDate}`);
    if (params?.endDate) query.push(`endDate=${params.endDate}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<ReportData>(`/reports/purchases${qs}`);
  },
  sales(params?: { startDate?: string; endDate?: string }) {
    const query: string[] = [];
    if (params?.startDate) query.push(`startDate=${params.startDate}`);
    if (params?.endDate) query.push(`endDate=${params.endDate}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<ReportData>(`/reports/sales${qs}`);
  },
  profit(params?: { startDate?: string; endDate?: string }) {
    const query: string[] = [];
    if (params?.startDate) query.push(`startDate=${params.startDate}`);
    if (params?.endDate) query.push(`endDate=${params.endDate}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<ReportData>(`/reports/profit${qs}`);
  },
  inventoryValue() {
    return api.get<{ totalValue: number }>('/reports/inventory-value');
  },
};

export default reportsApi;
