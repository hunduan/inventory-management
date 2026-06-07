import api from './client';
import type { PurchaseOrder, PaginatedResponse } from '../types';

export const purchasesApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<PurchaseOrder>>(`/purchases?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) =>
    api.get<PurchaseOrder>(`/purchases/${id}`).then((r) => r.data),

  create: (data: {
    supplierId?: string;
    warehouseId?: string;
    remark?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
  }) => api.post<PurchaseOrder>('/purchases', data).then((r) => r.data),

  update: (id: string, data: {
    supplierId?: string;
    warehouseId?: string;
    remark?: string;
    items?: { productId: string; quantity: number; unitCost: number }[];
  }) => api.put<PurchaseOrder>(`/purchases/${id}`, data).then((r) => r.data),

  confirm: (id: string) =>
    api.post<PurchaseOrder>(`/purchases/${id}/confirm`).then((r) => r.data),

  receive: (id: string) =>
    api.post<PurchaseOrder>(`/purchases/${id}/receive`).then((r) => r.data),

  receiveItem: (id: string, itemId: string, quantity: number) =>
    api.post<PurchaseOrder>(`/purchases/${id}/receive-item`, { itemId, quantity }).then((r) => r.data),

  cancel: (id: string) =>
    api.post<PurchaseOrder>(`/purchases/${id}/cancel`).then((r) => r.data),

  exportExcel: (params?: string) =>
    api.get(`/purchases/export?${params ?? ''}`, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchases-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }),
};
