import { api } from '../utils/request';

export const tenantsApi = {
  getProfile: () => api.get<any>('/tenants'),
  update: (data: { name?: string; logo?: string }) => api.patch<any>('/tenants', data),
  adminList: (params?: string) => api.get<any>(`/tenants/admin/all?${params || ''}`),
  adminCreate: (data: { name: string; slug: string; logo?: string }) => api.post<any>('/tenants/admin', data),
  adminRemove: (id: string) => api.delete(`/tenants/admin/${id}`),
};
