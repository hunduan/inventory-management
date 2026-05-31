import api from './client';
import type { Customer, PaginatedResponse } from '../types';

export const customersApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Customer>>(`/customers?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),

  create: (data: Partial<Customer>) =>
    api.post<Customer>('/customers', data).then((r) => r.data),

  update: (id: string, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
};
