import { api } from '../utils/request';

export const warehousesApi = {
  list: (params?: string) => api.get<any>(`/warehouses?${params || ''}`),
  getById: (id: string) => api.get<any>(`/warehouses/${id}`),
  create: (data: any) => api.post<any>('/warehouses', data),
  update: (id: string, data: any) => api.patch<any>(`/warehouses/${id}`, data),
  remove: (id: string) => api.delete(`/warehouses/${id}`),
};
