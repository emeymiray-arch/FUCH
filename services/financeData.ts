import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, BankProvider, Category, FinanceSummary, Transaction } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/Categories';

const CACHE_KEYS = {
  transactions: '@finotchet/transactions',
  accounts: '@finotchet/accounts',
  categories: '@finotchet/categories',
  connectedBanks: '@finotchet/connectedBanks',
  lastSync: '@finotchet/lastSync',
  initialized: '@finotchet/initialized_v2',
} as const;

export const BANK_ACCOUNTS: Record<BankProvider, Account> = {
  tinkoff: {
    id: 'acc-tinkoff',
    name: 'Т-Банк',
    type: 'bank',
    balance: 0,
    bankProvider: 'tinkoff',
    currency: 'RUB',
  },
  sber: {
    id: 'acc-sber',
    name: 'Сбер',
    type: 'bank',
    balance: 0,
    bankProvider: 'sber',
    currency: 'RUB',
  },
  ozon: {
    id: 'acc-ozon',
    name: 'Ozon Банк',
    type: 'bank',
    balance: 0,
    bankProvider: 'ozon',
    currency: 'RUB',
  },
};

export const EMPTY_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Наличные', type: 'cash', balance: 0, currency: 'RUB' },
  { id: 'acc-invest', name: 'Инвестиции', type: 'investment', balance: 0, currency: 'RUB' },
];

export function getEmptyState(connectedBanks: BankProvider[] = []) {
  const accounts = [
    ...EMPTY_ACCOUNTS,
    ...connectedBanks.map((b) => ({ ...BANK_ACCOUNTS[b] })),
  ];
  return {
    transactions: [] as Transaction[],
    accounts,
    categories: DEFAULT_CATEGORIES,
    connectedBanks,
  };
}

export function computeSummary(transactions: Transaction[], accounts: Account[]): FinanceSummary {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthly = transactions.filter((t) => new Date(t.date) >= monthStart);

  const monthlyIncome = monthly.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthly
    .filter((t) => t.amount < 0 && t.type !== 'investment' && t.type !== 'transfer')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const totalDebts = transactions
    .filter((t) => t.type === 'debt' && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const investmentPortfolio = accounts
    .filter((a) => a.type === 'investment')
    .reduce((s, a) => s + a.balance, 0);

  const cashBalance = accounts
    .filter((a) => a.type === 'cash')
    .reduce((s, a) => s + a.balance, 0);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return { totalBalance, monthlyIncome, monthlyExpenses, totalDebts, investmentPortfolio, cashBalance };
}

export async function loadConnectedBanks(): Promise<BankProvider[]> {
  const raw = await AsyncStorage.getItem(CACHE_KEYS.connectedBanks);
  return raw ? (JSON.parse(raw) as BankProvider[]) : [];
}

export async function saveConnectedBanks(banks: BankProvider[]) {
  await AsyncStorage.setItem(CACHE_KEYS.connectedBanks, JSON.stringify(banks));
}

export async function loadCachedData() {
  try {
    const connectedBanks = await loadConnectedBanks();
    const [txRaw, accRaw, catRaw, initFlag] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.transactions),
      AsyncStorage.getItem(CACHE_KEYS.accounts),
      AsyncStorage.getItem(CACHE_KEYS.categories),
      AsyncStorage.getItem(CACHE_KEYS.initialized),
    ]);

    if (!initFlag) {
      const empty = getEmptyState(connectedBanks);
      await cacheData(empty);
      await AsyncStorage.setItem(CACHE_KEYS.initialized, 'true');
      return empty;
    }

    const empty = getEmptyState(connectedBanks);
    const savedAccounts = accRaw ? (JSON.parse(accRaw) as Account[]) : empty.accounts;

    const accounts = mergeAccounts(savedAccounts, connectedBanks);

    return {
      transactions: txRaw ? (JSON.parse(txRaw) as Transaction[]) : [],
      accounts,
      categories: catRaw ? (JSON.parse(catRaw) as Category[]) : DEFAULT_CATEGORIES,
      connectedBanks,
    };
  } catch {
    return getEmptyState();
  }
}

function mergeAccounts(saved: Account[], connectedBanks: BankProvider[]): Account[] {
  const map = new Map(saved.map((a) => [a.id, a]));
  for (const base of EMPTY_ACCOUNTS) {
    if (!map.has(base.id)) map.set(base.id, { ...base });
  }
  for (const provider of connectedBanks) {
    const bank = BANK_ACCOUNTS[provider];
    if (!map.has(bank.id)) {
      map.set(bank.id, { ...bank });
    }
  }
  return Array.from(map.values());
}

export async function cacheData(data: {
  transactions?: Transaction[];
  accounts?: Account[];
  categories?: Category[];
}) {
  const ops: Promise<void>[] = [];
  if (data.transactions !== undefined) {
    ops.push(AsyncStorage.setItem(CACHE_KEYS.transactions, JSON.stringify(data.transactions)));
  }
  if (data.accounts !== undefined) {
    ops.push(AsyncStorage.setItem(CACHE_KEYS.accounts, JSON.stringify(data.accounts)));
  }
  if (data.categories !== undefined) {
    ops.push(AsyncStorage.setItem(CACHE_KEYS.categories, JSON.stringify(data.categories)));
  }
  await Promise.all(ops);
  await AsyncStorage.setItem(CACHE_KEYS.lastSync, new Date().toISOString());
}

export async function clearAllFinanceData() {
  await Promise.all([
    AsyncStorage.removeItem(CACHE_KEYS.transactions),
    AsyncStorage.removeItem(CACHE_KEYS.accounts),
    AsyncStorage.removeItem(CACHE_KEYS.categories),
    AsyncStorage.removeItem(CACHE_KEYS.connectedBanks),
    AsyncStorage.removeItem(CACHE_KEYS.lastSync),
    AsyncStorage.removeItem(CACHE_KEYS.initialized),
  ]);
}

export async function markInitialized() {
  await AsyncStorage.setItem(CACHE_KEYS.initialized, 'true');
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(CACHE_KEYS.lastSync);
}
