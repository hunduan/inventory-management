import { api } from '../utils/request';

export const reportsApi = {
  purchases: (params: string) => api.get<any>(`/reports/purchases?${params}`),
  sales: (params: string) => api.get<any>(`/reports/sales?${params}`),
  profit: (params: string) => api.get<any>(`/reports/profit?${params}`),
  dashboard: () => api.get<any>('/reports/dashboard'),
  inventoryValue: () => api.get<any>('/reports/inventory-value'),
};
