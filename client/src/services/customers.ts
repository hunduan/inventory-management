import { api } from '../utils/request';

export const customersApi = {
  list: (params?: string) => api.get<any>(`/customers?${params || ''}`),
  getById: (id: string) => api.get<any>(`/customers/${id}`),
  create: (data: any) => api.post<any>('/customers', data),
  update: (id: string, data: any) => api.patch<any>(`/customers/${id}`, data),
  remove: (id: string) => api.delete(`/customers/${id}`),
};
