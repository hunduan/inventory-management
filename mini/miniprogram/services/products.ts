import { api } from './request';

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  barcode?: string;
  sku?: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  imageUrl?: string;
  specs?: any;
  enabled: boolean;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsApi = {
  list(params?: { search?: string; categoryId?: string; page?: number; limit?: number }) {
    const query: string[] = [];
    if (params?.search) query.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.categoryId) query.push(`categoryId=${params.categoryId}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    const qs = query.length ? '?' + query.join('&') : '';
    return api.get<ProductListResponse>(`/products${qs}`);
  },
  getById(id: string) {
    return api.get<Product>(`/products/${id}`);
  },
  getByBarcode(barcode: string) {
    return api.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
  },
  create(data: { name: string; categoryId?: string; barcode?: string; sku?: string; unit?: string; salePrice?: number; costPrice?: number }) {
    return api.post<Product>('/products', data);
  },
  update(id: string, data: Partial<Product>) {
    return api.patch<Product>(`/products/${id}`, data);
  },
  delete(id: string) {
    return api.del<void>(`/products/${id}`);
  },
};

export default productsApi;
