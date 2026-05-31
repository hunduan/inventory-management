import api from './client';
import type { Stocktake, PaginatedResponse } from '../types';

export const stocktakeApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Stocktake>>(`/stocktakes?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) =>
    api.get<Stocktake>(`/stocktakes/${id}`).then((r) => r.data),

  create: (data: { warehouseId: string; remark?: string }) =>
    api.post<Stocktake>('/stocktakes', data).then((r) => r.data),

  start: (id: string) =>
    api.post<Stocktake>(`/stocktakes/${id}/start`).then((r) => r.data),

  complete: (id: string, items?: Record<string, number>) =>
    api.post<Stocktake>('/stocktakes/' + id + '/complete', { items }).then((r) => r.data),

  updateItem: (id: string, itemId: string, actualQuantity: number) =>
    api.patch<Stocktake>('/stocktakes/' + id + '/items/' + itemId, { actualQuantity }).then((r) => r.data),

  cancel: (id: string) =>
    api.post<Stocktake>(`/stocktakes/${id}/cancel`).then((r) => r.data),
};
