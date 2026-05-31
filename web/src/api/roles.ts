import api from './client';
import type { Role } from '../types';

export const rolesApi = {
  list: () => api.get<Role[]>('/roles').then((r) => r.data),

  getById: (id: string) => api.get<Role>(`/roles/${id}`).then((r) => r.data),

  create: (data: { name: string; permissions?: string[] }) =>
    api.post<Role>('/roles', data).then((r) => r.data),

  update: (id: string, data: { name?: string; permissions?: string[] }) =>
    api.patch<Role>(`/roles/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/roles/${id}`).then((r) => r.data),

  // Super admin endpoints
  adminList: (tenantId: string) =>
    api.get<Role[]>(`/roles/admin/all?tenantId=${tenantId}`).then((r) => r.data),

  adminCreate: (tenantId: string, data: { name: string; permissions?: string[] }) =>
    api.post<Role>(`/roles/admin?tenantId=${tenantId}`, data).then((r) => r.data),

  adminUpdate: (tenantId: string, id: string, data: { name?: string; permissions?: string[] }) =>
    api.patch<Role>(`/roles/admin/${id}?tenantId=${tenantId}`, data).then((r) => r.data),

  adminRemove: (tenantId: string, id: string) =>
    api.delete(`/roles/admin/${id}?tenantId=${tenantId}`).then((r) => r.data),
};
