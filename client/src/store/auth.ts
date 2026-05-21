import { create } from 'zustand';
import Taro from '@tarojs/taro';

interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    set({ token, user });
  },
  logout: () => {
    set({ token: null, user: null });
  },
  init: () => {
    const token = Taro.getStorageSync('token');
    const user = Taro.getStorageSync('user');
    if (token && user) {
      set({ token, user: JSON.parse(user) });
    }
  },
}));
