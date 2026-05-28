import { api } from '../utils/request';

export const transfersApi = {
  list: (params?: string) => api.get<any>(`/transfers?${params || ''}`),
  getById: (id: string) => api.get<any>(`/transfers/${id}`),
  create: (data: { fromWarehouseId: string; toWarehouseId: string; remark?: string; items: Array<{ productId: string; quantity: number }> }) => api.post<any>('/transfers', data),
  confirm: (id: string) => api.post<any>(`/transfers/${id}/confirm`),
  complete: (id: string) => api.post<any>(`/transfers/${id}/complete`),
  cancel: (id: string) => api.post<any>(`/transfers/${id}/cancel`),
};
