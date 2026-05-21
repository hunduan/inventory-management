import { api } from '../utils/request';

export const salesApi = {
  list: (params?: string) => api.get<any>(`/sales?${params || ''}`),
  getById: (id: string) => api.get<any>(`/sales/${id}`),
  create: (data: any) => api.post<any>('/sales', data),
  confirm: (id: string) => api.post<any>(`/sales/${id}/confirm`),
  deliver: (id: string) => api.post<any>(`/sales/${id}/deliver`),
  cancel: (id: string) => api.post<any>(`/sales/${id}/cancel`),
};
