import { api } from '../utils/request';

export const purchasesApi = {
  list: (params?: string) => api.get<any>(`/purchases?${params || ''}`),
  getById: (id: string) => api.get<any>(`/purchases/${id}`),
  create: (data: any) => api.post<any>('/purchases', data),
  confirm: (id: string) => api.post<any>(`/purchases/${id}/confirm`),
  receive: (id: string) => api.post<any>(`/purchases/${id}/receive`),
  cancel: (id: string) => api.post<any>(`/purchases/${id}/cancel`),
};
