import { api } from '../utils/request';

export const usersApi = {
  list: (params?: string) => api.get<any>(`/users?${params || ''}`),
  getById: (id: string) => api.get<any>(`/users/${id}`),
  create: (data: { email: string; password: string; name: string; phone?: string; roleId?: string }) => api.post<any>('/users', data),
  update: (id: string, data: { name?: string; email?: string; phone?: string; roleId?: string; enabled?: boolean }) => api.patch<any>(`/users/${id}`, data),
  remove: (id: string) => api.delete(`/users/${id}`),
  assignRole: (id: string, roleId: string) => api.post<any>(`/users/${id}/role`, { roleId }),
};
