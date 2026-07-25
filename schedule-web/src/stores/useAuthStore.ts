import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

interface User {
  username: string;
  nickname: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username: string, password: string) => {
        const res = await authApi.login({ username, password });
        set({ token: res.token, user: { username: res.username, nickname: res.nickname } });
      },
      logout: () => {
        set({ token: null, user: null });
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
