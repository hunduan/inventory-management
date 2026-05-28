import { api } from '../utils/request';

export const rolesApi = {
  list: () => api.get<any>('/roles'),
  getById: (id: string) => api.get<any>(`/roles/${id}`),
  create: (data: { name: string; permissions?: string[] }) => api.post<any>('/roles', data),
  update: (id: string, data: { name?: string; permissions?: string[] }) => api.patch<any>(`/roles/${id}`, data),
  remove: (id: string) => api.delete(`/roles/${id}`),
};
