import api from './client';
import type { Product, PaginatedResponse } from '../types';

export const productsApi = {
  list: (params?: string) =>
    api.get<PaginatedResponse<Product>>(`/products?${params ?? ''}`).then((r) => r.data),

  getById: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (data: Partial<Product>) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    api.get<Product>(`/products/barcode/${barcode}`).then((r) => r.data),
};
