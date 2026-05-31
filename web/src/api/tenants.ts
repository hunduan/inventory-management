import api from './client';
import type { Tenant } from '../types';

export const tenantsApi = {
  get: () => api.get<Tenant>('/tenants').then((r) => r.data),

  update: (data: { name?: string; logo?: string }) =>
    api.patch<Tenant>('/tenants', data).then((r) => r.data),

  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/tenants/admin/all', { params }).then((r) => r.data),

  create: (data: { name: string; slug: string }) =>
    api.post('/tenants/admin', data).then((r) => r.data),

  remove: (id: string) => api.delete(`/tenants/admin/${id}`).then((r) => r.data),

  adminUpdate: (id: string, data: { name?: string; enabled?: boolean }) =>
    api.patch(`/tenants/admin/${id}`, data).then((r) => r.data),
};
