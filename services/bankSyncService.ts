import { BankProvider, Transaction } from '@/types';
import { getApiKey, getApiUrl } from '@/services/apiConfig';

interface SyncResponse {
  transactions: Transaction[];
  balances: Record<string, number>;
  errors: string[];
  syncedAt: string;
}

export async function fetchBankTransactions(
  provider: BankProvider,
  since?: string
): Promise<Transaction[]> {
  const result = await syncFromBackend([provider], since ? { [provider]: since } : {});
  return result.transactions;
}

export async function fetchBankBalance(provider: BankProvider): Promise<number | null> {
  const result = await syncFromBackend([provider]);
  const accountMap: Record<BankProvider, string> = {
    tinkoff: 'acc-tinkoff',
    sber: 'acc-sber',
    ozon: 'acc-ozon',
  };
  const balance = result.balances[accountMap[provider]];
  return balance ?? null;
}

export async function syncAllBanks(
  banks: BankProvider[],
  since: Partial<Record<BankProvider, string>> = {}
): Promise<SyncResponse> {
  return syncFromBackend(banks, since);
}

async function syncFromBackend(
  banks: BankProvider[],
  since: Partial<Record<BankProvider, string>> = {}
): Promise<SyncResponse> {
  const [baseUrl, apiKey] = await Promise.all([getApiUrl(), getApiKey()]);

  try {
    const res = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({ banks, since }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        transactions: [],
        balances: {},
        errors: [`Сервер: ${res.status} ${text}`],
        syncedAt: new Date().toISOString(),
      };
    }

    return (await res.json()) as SyncResponse;
  } catch (e) {
    return {
      transactions: [],
      balances: {},
      errors: [
        `Не удалось подключиться к серверу (${baseUrl}). Запустите backend: cd backend && npm start`,
      ],
      syncedAt: new Date().toISOString(),
    };
  }
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  banks: Record<string, boolean>;
  error?: string;
}> {
  const baseUrl = await getApiUrl();
  try {
    const res = await fetch(`${baseUrl}/health`);
    if (!res.ok) return { ok: false, banks: {}, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: data.ok, banks: data.banks ?? {} };
  } catch {
    return { ok: false, banks: {}, error: 'Сервер не запущен' };
  }
}
