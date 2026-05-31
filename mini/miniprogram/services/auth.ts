import { api } from './request';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    tenantName: string;
    role: string;
  };
}

export interface RegisterData {
  tenantName: string;
  tenantSlug: string;
  email: string;
  name: string;
  password: string;
}

export const authApi = {
  login(email: string, password: string) {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },
  register(data: RegisterData) {
    return api.post<LoginResponse>('/auth/register', data);
  },
};

export default authApi;
