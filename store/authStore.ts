import { create } from 'zustand';
import { User } from '@/types';
import * as authService from '@/services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPassword: boolean;
  biometricEnabled: boolean;
  initialize: () => Promise<void>;
  setupPassword: (pin: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
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
  hasPassword: false,
  biometricEnabled: false,

  initialize: async () => {
    set({ isLoading: true });
    const [user, biometric, hasPassword] = await Promise.all([
      authService.getStoredUser(),
      authService.isBiometricEnabled(),
      authService.hasPassword(),
    ]);
    set({
      user: user ?? null,
      isAuthenticated: !!user,
      hasPassword,
      biometricEnabled: biometric,
      isLoading: false,
    });
  },

  setupPassword: async (pin) => {
    const user = await authService.setupPassword(pin);
    set({ user, isAuthenticated: true, hasPassword: true });
  },

  loginWithPin: async (pin) => {
    const user = await authService.loginWithPin(pin);
    set({ user, isAuthenticated: true });
  },

  changePassword: async (currentPin, newPin) => {
    await authService.changePassword(currentPin, newPin);
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loginWithBiometric: async () => {
    const user = await authService.loginWithBiometric();
    if (user) {
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
