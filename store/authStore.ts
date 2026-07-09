import { create } from 'zustand';
import { User } from '@/types';
import { getAuthProvider } from '@/services/auth';
import { useFinanceStore } from '@/store/financeStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasUsers: boolean;
  biometricEnabled: boolean;
  authMode: 'supabase' | 'local';
  initialize: () => Promise<void>;
  register: (name: string, email: string, pin: string) => Promise<{ needsEmailVerification: boolean }>;
  loginWithEmailPin: (email: string, pin: string) => Promise<void>;
  changePassword: (currentPin: string, newPin: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  checkSession: () => Promise<boolean>;
  resendVerification: (email: string) => Promise<void>;
  refreshSession: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasUsers: false,
  biometricEnabled: false,
  authMode: 'local',

  initialize: async () => {
    set({ isLoading: true });
    const auth = getAuthProvider();
    await auth.init();

    const [user, biometric, hasUsers] = await Promise.all([
      auth.getCurrentUser(),
      auth.isBiometricEnabled(),
      auth.hasUsers(),
    ]);

    set({
      user: user ?? null,
      isAuthenticated: !!user,
      hasUsers,
      biometricEnabled: biometric,
      authMode: auth.mode,
      isLoading: false,
    });

    if (user) {
      await useFinanceStore.getState().initialize();
    } else {
      useFinanceStore.getState().clearSession();
    }
  },

  register: async (name, email, pin) => {
    const auth = getAuthProvider();
    const result = await auth.register(name, email, pin);

    if (result.user) {
      await useFinanceStore.getState().initialize();
      set({ user: result.user, isAuthenticated: true, hasUsers: true, authMode: auth.mode });
      return { needsEmailVerification: false };
    }

    set({ hasUsers: true, authMode: auth.mode });
    return { needsEmailVerification: result.needsEmailVerification };
  },

  loginWithEmailPin: async (email, pin) => {
    const auth = getAuthProvider();
    const user = await auth.login(email, pin);
    set({ user, isAuthenticated: true, authMode: auth.mode });
    await useFinanceStore.getState().initialize();
  },

  changePassword: async (currentPin, newPin) => {
    await getAuthProvider().changePassword(currentPin, newPin);
  },

  logout: async () => {
    await getAuthProvider().logout();
    useFinanceStore.getState().clearSession();
    set({ user: null, isAuthenticated: false, biometricEnabled: false });
  },

  loginWithBiometric: async () => {
    const user = await getAuthProvider().loginWithBiometric();
    if (!user) return false;
    await useFinanceStore.getState().initialize();
    set({ user, isAuthenticated: true });
    return true;
  },

  toggleBiometric: async (enabled) => {
    await getAuthProvider().setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  checkSession: async () => {
    const auth = getAuthProvider();
    const expired = await auth.checkInactivity();
    if (expired && get().isAuthenticated) {
      await get().logout();
      return false;
    }
    await auth.updateLastActivity();
    return get().isAuthenticated;
  },

  resendVerification: async (email) => {
    await getAuthProvider().resendVerificationEmail(email);
  },

  refreshSession: async () => {
    const user = await getAuthProvider().refreshSession();
    if (user) {
      set({ user, isAuthenticated: true });
      await useFinanceStore.getState().initialize();
    }
    return user;
  },
}));
