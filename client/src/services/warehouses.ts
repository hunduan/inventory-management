import { api } from '../utils/request';
import type { PaginatedResponse, Warehouse } from '../types/api';

export const warehousesApi = {
  list: (params?: string) => api.get<PaginatedResponse<Warehouse>>(`/warehouses?${params || ''}`),
  getById: (id: string) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data),
  update: (id: string, data: Partial<Warehouse>) => api.patch<Warehouse>(`/warehouses/${id}`, data),
  remove: (id: string) => api.delete(`/warehouses/${id}`),
};
