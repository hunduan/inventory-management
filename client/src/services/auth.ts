import { api } from '../utils/request';

export const authApi = {
  login: (data: { email: string; password: string }) => api.post<any>('/auth/login', data),
  register: (data: any) => api.post<any>('/auth/register', data),
};
