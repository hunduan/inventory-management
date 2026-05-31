import api from './client';
import type { Transfer, PaginatedResponse } from '../types';

export const transfersApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Transfer>>(`/transfers?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<Transfer>(`/transfers/${id}`).then((r) => r.data),

  create: (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    remark?: string;
    items: { productId: string; quantity: number }[];
  }) => api.post<Transfer>('/transfers', data).then((r) => r.data),

  confirm: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/confirm`).then((r) => r.data),

  complete: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/complete`).then((r) => r.data),

  cancel: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/cancel`).then((r) => r.data),
};
