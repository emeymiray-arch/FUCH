/**
 * @deprecated Используйте getAuthProvider() из services/auth
 */
export { getAuthProvider, getAuthMode, PIN_LENGTH } from '@/services/auth';
export { isSupabaseConfigured } from '@/services/supabaseClient';

import { getAuthProvider } from '@/services/auth';

const auth = () => getAuthProvider();

export function isCloudAuthEnabled(): boolean {
  return auth().mode === 'supabase';
}

export async function migrateLegacyAuth(): Promise<void> {
  await auth().init();
}

export async function hasRegisteredUsers(): Promise<boolean> {
  return auth().hasUsers();
}

export async function register(name: string, email: string, pin: string) {
  const result = await auth().register(name, email, pin);
  return result;
}

export async function loginWithEmailPin(email: string, pin: string) {
  return auth().login(email, pin);
}

export async function logout(): Promise<void> {
  return auth().logout();
}

export async function changePassword(currentPin: string, newPin: string): Promise<void> {
  return auth().changePassword(currentPin, newPin);
}

export async function getStoredUser() {
  return auth().getCurrentUser();
}

export async function isBiometricEnabled(): Promise<boolean> {
  return auth().isBiometricEnabled();
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  return auth().setBiometricEnabled(enabled);
}

export async function loginWithBiometric() {
  return auth().loginWithBiometric();
}

export async function updateLastActivity(): Promise<void> {
  return auth().updateLastActivity();
}

export async function checkInactivity(): Promise<boolean> {
  return auth().checkInactivity();
}

export async function resendVerificationEmail(email: string): Promise<void> {
  return auth().resendVerificationEmail(email);
}

export async function refreshAuthSession() {
  return auth().refreshSession();
}
