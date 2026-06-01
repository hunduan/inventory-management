import { api } from './request';

export interface PurchaseItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitCost: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseItem[];
}

export interface PurchaseListResponse {
  data: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
}

export const purchasesApi = {
  list(params?: { status?: string; supplierId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.supplierId) query.push(`supplierId=${params.supplierId}`);
    if (params?.dateFrom) query.push(`dateFrom=${params.dateFrom}`);
    if (params?.dateTo) query.push(`dateTo=${params.dateTo}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<PurchaseListResponse>(`/purchases${qs}`);
  },
  getById(id: string) {
    return api.get<PurchaseOrder>(`/purchases/${id}`);
  },
  create(data: { supplierId?: string; warehouseId?: string; remark?: string; items: { productId: string; quantity: number; unitCost: number }[] }) {
    return api.post<PurchaseOrder>('/purchases', data);
  },
  update(id: string, data: { supplierId?: string; warehouseId?: string; remark?: string; items: { productId: string; quantity: number; unitCost: number }[] }) {
    return api.patch<PurchaseOrder>(`/purchases/${id}`, data);
  },
  receiveItem(id: string, itemId: string, quantity: number) {
    return api.post<PurchaseOrder>(`/purchases/${id}/receive-item`, { itemId, quantity });
  },
  confirm(id: string) {
    return api.post<PurchaseOrder>(`/purchases/${id}/confirm`);
  },
  receive(id: string) {
    return api.post<PurchaseOrder>(`/purchases/${id}/receive`);
  },
  cancel(id: string) {
    return api.post<PurchaseOrder>(`/purchases/${id}/cancel`);
  },
};

export default purchasesApi;
