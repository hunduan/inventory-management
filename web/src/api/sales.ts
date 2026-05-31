import api from './client';
import type { SaleOrder, PaginatedResponse } from '../types';

export const salesApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<SaleOrder>>(`/sales?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<SaleOrder>(`/sales/${id}`).then((r) => r.data),

  create: (data: {
    customerId?: string;
    warehouseId?: string;
    remark?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) => api.post<SaleOrder>('/sales', data).then((r) => r.data),

  update: (id: string, data: {
    customerId?: string;
    warehouseId?: string;
    remark?: string;
    items?: { productId: string; quantity: number; unitPrice: number }[];
  }) => api.put<SaleOrder>(`/sales/${id}`, data).then((r) => r.data),

  confirm: (id: string) =>
    api.post<SaleOrder>(`/sales/${id}/confirm`).then((r) => r.data),

  deliver: (id: string) =>
    api.post<SaleOrder>(`/sales/${id}/deliver`).then((r) => r.data),

  deliverItem: (id: string, itemId: string, quantity: number) =>
    api.post<SaleOrder>(`/sales/${id}/deliver-item`, { itemId, quantity }).then((r) => r.data),

  cancel: (id: string) =>
    api.post<SaleOrder>(`/sales/${id}/cancel`).then((r) => r.data),
};
