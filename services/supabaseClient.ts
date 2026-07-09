import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAuthCallbackUrl, getSupabaseAnonKey, getSupabaseUrl, isSupabaseEnabled } from '@/lib/config';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return isSupabaseEnabled();
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase не настроен. Укажите EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        redirectTo: getAuthCallbackUrl(),
      },
    });
  }

  return client;
}

export function resetSupabaseClient(): void {
  client = null;
}
