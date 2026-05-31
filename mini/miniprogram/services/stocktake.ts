import { api } from './request';

export interface StocktakeItem {
  id?: string;
  productId: string;
  productName?: string;
  bookQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
}

export interface StocktakeOrder {
  id: string;
  tenantId: string;
  warehouseId: string;
  warehouseName?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: StocktakeItem[];
}

export interface StocktakeListResponse {
  data: StocktakeOrder[];
  total: number;
  page: number;
  limit: number;
}

export const stocktakeApi = {
  list(params?: { status?: string; warehouseId?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.warehouseId) query.push(`warehouseId=${params.warehouseId}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<StocktakeListResponse>(`/stocktakes${qs}`);
  },
  getById(id: string) {
    return api.get<StocktakeOrder>(`/stocktakes/${id}`);
  },
  create(data: { warehouseId: string; remark?: string }) {
    return api.post<StocktakeOrder>('/stocktakes', data);
  },
  start(id: string) {
    return api.post<StocktakeOrder>(`/stocktakes/${id}/start`);
  },
  complete(id: string) {
    return api.post<StocktakeOrder>(`/stocktakes/${id}/complete`);
  },
  cancel(id: string) {
    return api.post<StocktakeOrder>(`/stocktakes/${id}/cancel`);
  },
};

export default stocktakeApi;
