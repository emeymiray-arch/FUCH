import { User } from '@/types';

export type AuthMode = 'supabase' | 'local';

export interface RegisterResult {
  user: User | null;
  needsEmailVerification: boolean;
}

export interface AuthProvider {
  readonly mode: AuthMode;
  init(): Promise<void>;
  hasUsers(): Promise<boolean>;
  getCurrentUser(): Promise<User | null>;
  register(name: string, email: string, pin: string): Promise<RegisterResult>;
  login(email: string, pin: string): Promise<User>;
  logout(): Promise<void>;
  changePassword(currentPin: string, newPin: string): Promise<void>;
  isBiometricEnabled(): Promise<boolean>;
  setBiometricEnabled(enabled: boolean): Promise<void>;
  loginWithBiometric(): Promise<User | null>;
  updateLastActivity(): Promise<void>;
  checkInactivity(): Promise<boolean>;
  resendVerificationEmail(email: string): Promise<void>;
  refreshSession(): Promise<User | null>;
}
