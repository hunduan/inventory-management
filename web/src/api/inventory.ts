import api from './client';
import type {
  Inventory,
  InventoryLog,
  PaginatedResponse,
} from '../types';

export const inventoryApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Inventory>>(`/inventory?${params ?? ''}`).then((r) => r.data),

  alerts: (params?: string) =>
    api
      .get<PaginatedResponse<Inventory>>(`/inventory/alerts?${params ?? ''}`)
      .then((r) => r.data),

  logs: (params?: string) =>
    api
      .get<PaginatedResponse<InventoryLog>>(`/inventory/logs?${params ?? ''}`)
      .then((r) => r.data),

  history: (date: string) =>
    api.get<Inventory[]>(`/inventory/history?date=${date}`).then((r) => r.data),
};
