import api from './client';
import type { Warehouse, PaginatedResponse } from '../types';

export const warehousesApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Warehouse>>(`/warehouses?${params ?? ''}`).then((r) => r.data),

  tree: () => api.get<Warehouse[]>('/warehouses/tree').then((r) => r.data),

  getById: (id: string) => api.get<Warehouse>(`/warehouses/${id}`).then((r) => r.data),

  create: (data: { name: string; parentId?: string; address?: string }) =>
    api.post<Warehouse>('/warehouses', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parentId?: string; address?: string }) =>
    api.patch<Warehouse>(`/warehouses/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/warehouses/${id}`).then((r) => r.data),
};
