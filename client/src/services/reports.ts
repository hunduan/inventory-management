import { api } from '../utils/request';

export const reportsApi = {
  purchases: (params: string) => api.get<any>(`/reports/purchases?${params}`),
  sales: (params: string) => api.get<any>(`/reports/sales?${params}`),
  profit: (params: string) => api.get<any>(`/reports/profit?${params}`),
};
