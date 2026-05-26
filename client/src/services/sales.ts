import { api } from '../utils/request';
import type { PaginatedResponse, SaleOrder } from '../types/api';

export const salesApi = {
  list: (params?: string) => api.get<PaginatedResponse<SaleOrder>>(`/sales?${params || ''}`),
  getById: (id: string) => api.get<SaleOrder>(`/sales/${id}`),
  create: (data: Partial<SaleOrder>) => api.post<SaleOrder>('/sales', data),
  confirm: (id: string) => api.post<SaleOrder>(`/sales/${id}/confirm`),
  deliver: (id: string) => api.post<SaleOrder>(`/sales/${id}/deliver`),
  cancel: (id: string) => api.post<SaleOrder>(`/sales/${id}/cancel`),
};
