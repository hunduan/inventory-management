import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    tenantName: string;
    role: string;
    permissions: string[];
  } | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  setAuth: (data: { accessToken: string; user: AuthState['user'] }) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isSuperAdmin: false,

  setAuth: (data) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({
      token: data.accessToken,
      user: data.user,
      isAuthenticated: true,
      isSuperAdmin: data.user?.email === 'admin@demo.com',
    });
  },

  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    set({ token: null, user: null, isAuthenticated: false, isSuperAdmin: false });
  },

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Ensure backwards compatibility with stored data that lacks permissions
        if (!user.permissions) user.permissions = [];
        set({ token, user, isAuthenticated: true, isSuperAdmin: user.email === 'admin@demo.com' });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
