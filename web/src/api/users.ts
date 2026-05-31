import api from './client';
import type { User, PaginatedResponse } from '../types';

export const usersApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<User>>(`/users?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    roleId?: string;
  }) => api.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),

  assignRole: (id: string, roleId: string) =>
    api.post<User>(`/users/${id}/role`, { roleId }).then((r) => r.data),

  // Super admin endpoints
  adminList: (tenantId: string, params?: string) =>
    api.get<PaginatedResponse<User>>(`/users/admin/all?tenantId=${tenantId}&${params ?? ''}`).then((r) => r.data),

  adminCreate: (tenantId: string, data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    roleId?: string;
  }) => api.post<User>('/users/admin', { ...data, tenantId }).then((r) => r.data),

  adminUpdate: (tenantId: string, id: string, data: Partial<User>) =>
    api.patch<User>(`/users/admin/${id}?tenantId=${tenantId}`, data).then((r) => r.data),

  adminRemove: (tenantId: string, id: string) =>
    api.delete(`/users/admin/${id}?tenantId=${tenantId}`).then((r) => r.data),

  adminAssignRole: (tenantId: string, id: string, roleId: string) =>
    api.post<User>(`/users/admin/${id}/role?tenantId=${tenantId}`, { roleId }).then((r) => r.data),
};
