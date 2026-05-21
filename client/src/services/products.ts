import { api } from '../utils/request';

export const productsApi = {
  list: (params?: any) => api.get<any>(`/products?${new URLSearchParams(params || {})}`),
  getById: (id: string) => api.get<any>(`/products/${id}`),
  getByBarcode: (barcode: string) => api.get<any>(`/products/barcode/${barcode}`),
  create: (data: any) => api.post<any>('/products', data),
  update: (id: string, data: any) => api.patch<any>(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};
