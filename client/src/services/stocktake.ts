import { api } from '../utils/request';

export const stocktakeApi = {
  list: (params?: string) => api.get<any>(`/stocktakes?${params || ''}`),
  getById: (id: string) => api.get<any>(`/stocktakes/${id}`),
  create: (data: { warehouseId: string; remark?: string }) => api.post<any>('/stocktakes', data),
  start: (id: string) => api.post<any>(`/stocktakes/${id}/start`),
  complete: (id: string) => api.post<any>(`/stocktakes/${id}/complete`),
  cancel: (id: string) => api.post<any>(`/stocktakes/${id}/cancel`),
};
