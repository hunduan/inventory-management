import api from './client';
import type { Category, CategoryAttribute } from '../types';

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),

  create: (data: { name: string; parentId?: string; sortOrder?: number }) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parentId?: string; sortOrder?: number }) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),

  // === Attribute APIs ===

  getAttributes: (categoryId: string) =>
    api.get<CategoryAttribute[]>(`/categories/${categoryId}/attributes`).then((r) => r.data),

  createAttribute: (categoryId: string, data: { name: string; fieldType?: string; options?: string[]; required?: boolean; sortOrder?: number }) =>
    api.post<CategoryAttribute>(`/categories/${categoryId}/attributes`, data).then((r) => r.data),

  updateAttribute: (categoryId: string, id: string, data: { name?: string; fieldType?: string; options?: string[]; required?: boolean; sortOrder?: number }) =>
    api.patch<CategoryAttribute>(`/categories/${categoryId}/attributes/${id}`, data).then((r) => r.data),

  removeAttribute: (categoryId: string, id: string) =>
    api.delete(`/categories/${categoryId}/attributes/${id}`).then((r) => r.data),
};
