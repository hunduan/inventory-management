import api from './client';
import type { Supplier, PaginatedResponse } from '../types';

export const suppliersApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Supplier>>(`/suppliers?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data),

  create: (data: Partial<Supplier>) =>
    api.post<Supplier>('/suppliers', data).then((r) => r.data),

  update: (id: string, data: Partial<Supplier>) =>
    api.patch<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/suppliers/${id}`).then((r) => r.data),
};
