import { api } from '../utils/request';
import type { PaginatedResponse, Product } from '../types/api';

export const productsApi = {
  list: (params?: string | Record<string, string | number | undefined>) => {
    const query = typeof params === 'string'
      ? params
      : new URLSearchParams(
        Object.entries(params || {}).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value !== undefined) acc[key] = String(value);
          return acc;
        }, {}),
      ).toString();
    return api.get<PaginatedResponse<Product>>(`/products?${query}`);
  },
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};
