import { api } from '../utils/request';
import type { PaginatedResponse, PurchaseOrder } from '../types/api';

export const purchasesApi = {
  list: (params?: string) => api.get<PaginatedResponse<PurchaseOrder>>(`/purchases?${params || ''}`),
  getById: (id: string) => api.get<PurchaseOrder>(`/purchases/${id}`),
  create: (data: Partial<PurchaseOrder>) => api.post<PurchaseOrder>('/purchases', data),
  confirm: (id: string) => api.post<PurchaseOrder>(`/purchases/${id}/confirm`),
  receive: (id: string) => api.post<PurchaseOrder>(`/purchases/${id}/receive`),
  cancel: (id: string) => api.post<PurchaseOrder>(`/purchases/${id}/cancel`),
};
