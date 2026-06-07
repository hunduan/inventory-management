import { api } from './request';

export interface CategoryAttribute {
  id: string;
  categoryId: string;
  name: string;
  fieldType: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  required: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  sortOrder: number;
  children?: Category[];
  attributes?: CategoryAttribute[];
}

export const categoriesApi = {
  list() {
    return api.get<Category[]>('/categories');
  },

  getAttributes(categoryId: string) {
    return api.get<CategoryAttribute[]>(`/categories/${categoryId}/attributes`);
  },
};

export default categoriesApi;
