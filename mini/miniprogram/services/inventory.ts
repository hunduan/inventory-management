import { api } from './request';

export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  productName?: string;
  productBarcode?: string;
  productSku?: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  unitCost: number;
  updatedAt: string;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryLog {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string;
  type: 'PURCHASE_IN' | 'SALE_OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'STOCKTAKE_ADJUST';
  quantity: number;
  beforeQty: number;
  afterQty: number;
  refId?: string;
  refType?: string;
  remark?: string;
  createdAt: string;
}

export const inventoryApi = {
  list(params?: { productId?: string; warehouseId?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.productId) query.push(`productId=${params.productId}`);
    if (params?.warehouseId) query.push(`warehouseId=${params.warehouseId}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<InventoryListResponse>(`/inventory${qs}`);
  },
  alerts(threshold: number = 10) {
    return api.get<InventoryItem[]>(`/inventory/alerts?threshold=${threshold}`);
  },
  logs(params?: { productId?: string; warehouseId?: string; type?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.productId) query.push(`productId=${params.productId}`);
    if (params?.warehouseId) query.push(`warehouseId=${params.warehouseId}`);
    if (params?.type) query.push(`type=${params.type}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<{ data: InventoryLog[]; total: number; page: number; limit: number }>(`/inventory/logs${qs}`);
  },
};

export default inventoryApi;
