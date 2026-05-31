import { api } from './request';

export interface SaleItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface SaleOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  customerId?: string;
  customerName?: string;
  warehouseId?: string;
  warehouseName?: string;
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
}

export interface SaleListResponse {
  data: SaleOrder[];
  total: number;
  page: number;
  limit: number;
}

export const salesApi = {
  list(params?: { status?: string; customerId?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.status) query.push(`status=${params.status}`);
    if (params?.customerId) query.push(`customerId=${params.customerId}`);
    if (params?.dateFrom) query.push(`dateFrom=${params.dateFrom}`);
    if (params?.dateTo) query.push(`dateTo=${params.dateTo}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<SaleListResponse>(`/sales${qs}`);
  },
  getById(id: string) {
    return api.get<SaleOrder>(`/sales/${id}`);
  },
  create(data: { customerId?: string; warehouseId?: string; remark?: string; items: { productId: string; quantity: number; unitPrice: number }[] }) {
    return api.post<SaleOrder>('/sales', data);
  },
  confirm(id: string) {
    return api.post<SaleOrder>(`/sales/${id}/confirm`);
  },
  deliver(id: string) {
    return api.post<SaleOrder>(`/sales/${id}/deliver`);
  },
  cancel(id: string) {
    return api.post<SaleOrder>(`/sales/${id}/cancel`);
  },
};

export default salesApi;
