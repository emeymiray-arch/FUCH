import { isSupabaseConfigured } from '@/services/supabaseClient';
import { AuthMode, AuthProvider } from '@/services/auth/types';
import { SupabaseAuthProvider } from '@/services/auth/SupabaseAuthProvider';
import { LocalAuthProvider } from '@/services/auth/LocalAuthProvider';

let provider: AuthProvider | null = null;

export function getAuthMode(): AuthMode {
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

export function getAuthProvider(): AuthProvider {
  if (!provider) {
    provider = isSupabaseConfigured() ? new SupabaseAuthProvider() : new LocalAuthProvider();
  }
  return provider;
}

export function resetAuthProvider(): void {
  provider = null;
}

export { PIN_LENGTH } from '@/lib/config';
