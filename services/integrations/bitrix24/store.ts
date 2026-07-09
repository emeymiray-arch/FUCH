import { Bitrix24Config } from '@/services/integrations/bitrix24/types';
import { getSupabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { getFinanceUserId } from '@/services/financeData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_KEY = '@finotchet/bitrix24';

interface IntegrationRow {
  bitrix24: Bitrix24Config | null;
}

export async function loadBitrix24Config(): Promise<Bitrix24Config | null> {
  const userId = getFinanceUserId();

  if (isSupabaseConfigured() && userId) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('user_integrations')
      .select('bitrix24')
      .eq('user_id', userId)
      .maybeSingle();

    return (data as IntegrationRow | null)?.bitrix24 ?? null;
  }

  const raw = await AsyncStorage.getItem(LOCAL_KEY);
  return raw ? (JSON.parse(raw) as Bitrix24Config) : null;
}

export async function saveBitrix24Config(config: Bitrix24Config): Promise<void> {
  const userId = getFinanceUserId();
  const payload: Bitrix24Config = {
    ...config,
    isActive: true,
    connectedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && userId) {
    const supabase = getSupabase();
    const { error } = await supabase.from('user_integrations').upsert({
      user_id: userId,
      bitrix24: payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
}

export async function clearBitrix24Config(): Promise<void> {
  const userId = getFinanceUserId();

  if (isSupabaseConfigured() && userId) {
    const supabase = getSupabase();
    await supabase.from('user_integrations').upsert({
      user_id: userId,
      bitrix24: null,
      updated_at: new Date().toISOString(),
    });
  }

  await AsyncStorage.removeItem(LOCAL_KEY);
}

export function isBitrix24Configured(config: Bitrix24Config | null): boolean {
  return !!config?.webhookUrl && config.isActive;
}
