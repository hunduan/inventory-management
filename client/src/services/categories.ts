import { api } from '../utils/request';

export const categoriesApi = {
  list: (params?: any) => api.get<any>(`/categories?${new URLSearchParams(params || {})}`),
  getById: (id: string) => api.get<any>(`/categories/${id}`),
  create: (data: any) => api.post<any>('/categories', data),
  update: (id: string, data: any) => api.patch<any>(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
};
