import { api } from './request';

export interface TransferItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
}

export interface TransferOrder {
  id: string;
  tenantId: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: TransferItem[];
}

export interface TransferListResponse {
  data: TransferOrder[];
  total: number;
  page: number;
  limit: number;
}

export const transfersApi = {
  list(params?: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.dateFrom) query.push(`dateFrom=${params.dateFrom}`);
    if (params?.dateTo) query.push(`dateTo=${params.dateTo}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<TransferListResponse>(`/transfers${qs}`);
  },
  getById(id: string) {
    return api.get<TransferOrder>(`/transfers/${id}`);
  },
  create(data: { fromWarehouseId: string; toWarehouseId: string; remark?: string; items: { productId: string; quantity: number }[] }) {
    return api.post<TransferOrder>('/transfers', data);
  },
  confirm(id: string) {
    return api.post<TransferOrder>(`/transfers/${id}/confirm`);
  },
  complete(id: string) {
    return api.post<TransferOrder>(`/transfers/${id}/complete`);
  },
  cancel(id: string) {
    return api.post<TransferOrder>(`/transfers/${id}/cancel`);
  },
};

export default transfersApi;
