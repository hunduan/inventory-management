import { api } from '../utils/request';
import type { InventoryItem, PaginatedResponse } from '../types/api';

export const inventoryApi = {
  list: (params?: string) => api.get<PaginatedResponse<InventoryItem>>(`/inventory?${params || ''}`),
  alerts: (threshold?: number) => api.get<InventoryItem[]>(`/inventory/alerts?threshold=${threshold || 10}`),
  logs: (params?: string) => api.get<PaginatedResponse<unknown>>(`/inventory/logs?${params || ''}`),
  history: (params?: string) => api.get<PaginatedResponse<InventoryItem>>(`/inventory/history?${params || ''}`),
};
