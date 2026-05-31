import api from './client';
import type { Category } from '../types';

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),

  create: (data: { name: string; parentId?: string; sortOrder?: number }) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parentId?: string; sortOrder?: number }) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
};
