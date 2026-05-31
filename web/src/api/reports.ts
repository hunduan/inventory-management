import api from './client';
import type { DashboardData } from '../types';

export const reportsApi = {
  dashboard: () => api.get<DashboardData>('/reports/dashboard').then((r) => r.data),

  purchases: (startDate: string, endDate: string) =>
    api
      .get(`/reports/purchases?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.data),

  sales: (startDate: string, endDate: string) =>
    api
      .get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.data),

  profit: (startDate: string, endDate: string) =>
    api
      .get(`/reports/profit?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.data),

  inventoryValue: () => api.get('/reports/inventory-value').then((r) => r.data),
};
