import { create } from 'zustand';
import { User } from '@/types';
import * as authService from '@/services/authService';
import { useFinanceStore } from '@/store/financeStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasUsers: boolean;
  biometricEnabled: boolean;
  initialize: () => Promise<void>;
  register: (name: string, email: string, pin: string) => Promise<void>;
  loginWithEmailPin: (email: string, pin: string) => Promise<void>;
  changePassword: (currentPin: string, newPin: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  checkSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasUsers: false,
  biometricEnabled: false,

  initialize: async () => {
    set({ isLoading: true });
    await authService.migrateLegacyAuth();
    const [user, biometric, hasUsers] = await Promise.all([
      authService.getStoredUser(),
      authService.isBiometricEnabled(),
      authService.hasRegisteredUsers(),
    ]);
    set({
      user: user ?? null,
      isAuthenticated: !!user,
      hasUsers,
      biometricEnabled: biometric,
      isLoading: false,
    });
  },

  register: async (name, email, pin) => {
    const user = await authService.register(name, email, pin);
    await useFinanceStore.getState().initialize();
    set({ user, isAuthenticated: true, hasUsers: true });
  },

  loginWithEmailPin: async (email, pin) => {
    const user = await authService.loginWithEmailPin(email, pin);
    await useFinanceStore.getState().initialize();
    set({ user, isAuthenticated: true });
  },

  changePassword: async (currentPin, newPin) => {
    await authService.changePassword(currentPin, newPin);
  },

  logout: async () => {
    await authService.logout();
    useFinanceStore.getState().clearSession();
    set({ user: null, isAuthenticated: false, biometricEnabled: false });
  },

  loginWithBiometric: async () => {
    const user = await authService.loginWithBiometric();
    if (user) {
      await useFinanceStore.getState().initialize();
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  toggleBiometric: async (enabled) => {
    await authService.setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  checkSession: async () => {
    const expired = await authService.checkInactivity();
    if (expired && get().isAuthenticated) {
      await get().logout();
      return false;
    }
    await authService.updateLastActivity();
    return get().isAuthenticated;
  },
}));
