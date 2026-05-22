import { api } from '../utils/request';

export const inventoryApi = {
  list: (params?: string) => api.get<any>(`/inventory?${params || ''}`),
  alerts: (threshold?: number) => api.get<any>(`/inventory/alerts?threshold=${threshold || 10}`),
  logs: (params?: string) => api.get<any>(`/inventory/logs?${params || ''}`),
  history: (params?: string) => api.get<any>(`/inventory/history?${params || ''}`),
};
