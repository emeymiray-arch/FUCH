import { Platform } from 'react-native';

export const PIN_LENGTH = 5;
export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

/** Публичный URL приложения (Vercel / localhost). Нужен для писем Supabase. */
export function getAppUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:8081';
}

export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}

export function getSupabaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  );
}

export function isSupabaseEnabled(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return url.length > 0 && key.length > 0 && url.includes('supabase');
}
