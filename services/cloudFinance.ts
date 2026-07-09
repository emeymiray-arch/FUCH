import { BankProvider, Account, Category, Transaction } from '@/types';
import { getSupabase, isSupabaseConfigured } from '@/services/supabaseClient';

export interface FinanceCloudData {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  connectedBanks: BankProvider[];
}

interface CloudRow {
  data: FinanceCloudData;
  updated_at: string;
}

export async function pullFinanceFromCloud(userId: string): Promise<{
  data: FinanceCloudData;
  updatedAt: string;
} | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('user_finance')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as CloudRow;
  const blob = row.data ?? {};
  return {
    data: {
      transactions: blob.transactions ?? [],
      accounts: blob.accounts ?? [],
      categories: blob.categories ?? [],
      connectedBanks: blob.connectedBanks ?? [],
    },
    updatedAt: row.updated_at,
  };
}

export async function pushFinanceToCloud(userId: string, payload: FinanceCloudData): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  const { error } = await supabase.from('user_finance').upsert({
    user_id: userId,
    data: payload,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export function isCloudSyncAvailable(): boolean {
  return isSupabaseConfigured();
}
