import { api } from '../utils/request';

export const suppliersApi = {
  list: (params?: string) => api.get<any>(`/suppliers?${params || ''}`),
  getById: (id: string) => api.get<any>(`/suppliers/${id}`),
  create: (data: any) => api.post<any>('/suppliers', data),
  update: (id: string, data: any) => api.patch<any>(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};
