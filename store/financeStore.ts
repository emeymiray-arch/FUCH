import { create } from 'zustand';
import {
  Account,
  BankProvider,
  Category,
  CreateTransactionInput,
  FinanceSummary,
  FilterType,
  SortOption,
  Transaction,
} from '@/types';
import {
  BANK_ACCOUNTS,
  cacheData,
  clearAllFinanceData,
  computeSummary,
  getEmptyState,
  getFinanceUserId,
  loadCachedData,
  markInitialized,
  saveConnectedBanks,
  getLastSyncTime,
} from '@/services/financeData';
import { pullFinanceFromCloud, pushFinanceToCloud, isCloudSyncAvailable } from '@/services/cloudFinance';
import { syncAllBanks } from '@/services/bankSyncService';
import { applyTransactionToAccounts, buildTransaction } from '@/services/transactionService';
import { parseVoiceCommand } from '@/services/voiceCommandService';
import { getDemoState } from '@/services/demoData';

interface FinanceState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  connectedBanks: BankProvider[];
  summary: FinanceSummary;
  isLoading: boolean;
  isSyncing: boolean;
  searchQuery: string;
  filterType: FilterType;
  sortOption: SortOption;
  initialize: () => Promise<void>;
  resetAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Transaction;
  addFromVoiceCommand: (text: string) => { ok: boolean; message: string; transaction?: Transaction };
  deleteTransaction: (id: string) => void;
  updateAccountBalance: (accountId: string, balance: number) => void;
  connectBank: (provider: BankProvider) => Promise<void>;
  disconnectBank: (provider: BankProvider) => Promise<void>;
  syncBanks: () => Promise<{ added: number; errors: string[] }>;
  syncInBackground: () => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilterType: (f: FilterType) => void;
  setSortOption: (s: SortOption) => void;
  updateTransactionCategory: (id: string, categoryId: string) => void;
  updateTransaction: (id: string, updates: Partial<Pick<Transaction, 'note' | 'attachments' | 'categoryId'>>) => void;
  addCategory: (category: Omit<Category, 'id' | 'isDefault'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getFilteredTransactions: () => Transaction[];
  getCategoryById: (id: string) => Category | undefined;
  persist: () => Promise<void>;
  clearSession: () => void;
}

function migrateTx(t: Transaction): Transaction {
  return {
    ...t,
    source: t.source ?? 'manual',
    paymentMethod: t.paymentMethod ?? (t.accountId === 'acc-cash' ? 'cash' : 'bank'),
    attachments: t.attachments ?? [],
  };
}

function recalc(transactions: Transaction[], accounts: Account[]): FinanceSummary {
  return computeSummary(transactions, accounts);
}

export const useFinanceStore = create<FinanceState>((set, get) => {
  function persistState(state: Pick<FinanceState, 'transactions' | 'accounts' | 'categories'>) {
    const connectedBanks = get().connectedBanks;
    const userId = getFinanceUserId();
    const promise = cacheData({
      transactions: state.transactions,
      accounts: state.accounts,
      categories: state.categories,
    });

    if (isCloudSyncAvailable() && userId) {
      pushFinanceToCloud(userId, {
        transactions: state.transactions,
        accounts: state.accounts,
        categories: state.categories,
        connectedBanks,
      }).catch(() => {});
    }

    return promise;
  }

  return {
  transactions: [],
  accounts: [],
  categories: [],
  connectedBanks: [],
  summary: {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalDebts: 0,
    investmentPortfolio: 0,
    cashBalance: 0,
  },
  isLoading: true,
  isSyncing: false,
  searchQuery: '',
  filterType: 'all',
  sortOption: 'date_desc',

  initialize: async () => {
    set({ isLoading: true });
    let data = await loadCachedData();
    const userId = getFinanceUserId();

    if (isCloudSyncAvailable() && userId) {
      try {
        const cloud = await pullFinanceFromCloud(userId);
        const localSync = await getLastSyncTime();
        const localTs = localSync ? new Date(localSync).getTime() : 0;
        const cloudTs = cloud ? new Date(cloud.updatedAt).getTime() : 0;

        if (cloud && cloudTs >= localTs) {
          data = {
            transactions: cloud.data.transactions,
            accounts: cloud.data.accounts,
            categories: cloud.data.categories,
            connectedBanks: cloud.data.connectedBanks,
          };
          await cacheData(data);
          await saveConnectedBanks(data.connectedBanks);
        } else if (data.transactions.length > 0 || data.accounts.some((a) => a.balance !== 0)) {
          await pushFinanceToCloud(userId, {
            transactions: data.transactions,
            accounts: data.accounts,
            categories: data.categories,
            connectedBanks: data.connectedBanks,
          });
        }
      } catch {
        // офлайн — используем локальные данные
      }
    }

    const transactions = data.transactions.map(migrateTx);
    const summary = recalc(transactions, data.accounts);
    set({
      transactions,
      accounts: data.accounts,
      categories: data.categories,
      connectedBanks: data.connectedBanks,
      summary,
      isLoading: false,
    });
  },

  resetAllData: async () => {
    await clearAllFinanceData();
    const empty = getEmptyState();
    await cacheData(empty);
    await saveConnectedBanks([]);
    const summary = recalc(empty.transactions, empty.accounts);
    set({
      transactions: [],
      accounts: empty.accounts,
      categories: empty.categories,
      connectedBanks: [],
      summary,
    });
  },

  loadDemoData: async () => {
    const demo = getDemoState();
    await saveConnectedBanks(demo.connectedBanks);
    await cacheData({
      transactions: demo.transactions,
      accounts: demo.accounts,
      categories: demo.categories,
    });
    await markInitialized();
    const summary = recalc(demo.transactions, demo.accounts);
    set({
      transactions: demo.transactions,
      accounts: demo.accounts,
      categories: demo.categories,
      connectedBanks: demo.connectedBanks,
      summary,
    });
  },

  persist: async () => {
    const { transactions, accounts, categories } = get();
    await persistState({ transactions, accounts, categories });
  },

  addTransaction: (input) => {
    const transaction = buildTransaction(input);
    const accounts = applyTransactionToAccounts(get().accounts, transaction);
    const transactions = [transaction, ...get().transactions];
    const summary = recalc(transactions, accounts);
    set({ transactions, accounts, summary });
    persistState({ transactions, accounts, categories: get().categories });
    return transaction;
  },

  addFromVoiceCommand: (text) => {
    const input = parseVoiceCommand(text);
    if (!input) {
      return { ok: false, message: 'Не удалось распознать команду. Пример: «Запиши, наличными отдал долг 5000»' };
    }
    const transaction = get().addTransaction(input);
    return {
      ok: true,
      message: `Записано: ${transaction.title} — ${Math.abs(transaction.amount).toLocaleString('ru-RU')} ₽`,
      transaction,
    };
  },

  deleteTransaction: (id) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx) return;
    const accounts = applyTransactionToAccounts(get().accounts, { ...tx, amount: -tx.amount });
    const transactions = get().transactions.filter((t) => t.id !== id);
    const summary = recalc(transactions, accounts);
    set({ transactions, accounts, summary });
    persistState({ transactions, accounts, categories: get().categories });
  },

  updateAccountBalance: (accountId, balance) => {
    const accounts = get().accounts.map((a) => (a.id === accountId ? { ...a, balance } : a));
    const summary = recalc(get().transactions, accounts);
    set({ accounts, summary });
    persistState({ transactions: get().transactions, accounts, categories: get().categories });
  },

  connectBank: async (provider) => {
    const connectedBanks = [...new Set([...get().connectedBanks, provider])];
    await saveConnectedBanks(connectedBanks);
    const bankAccount = { ...BANK_ACCOUNTS[provider] };
    const existing = get().accounts.find((a) => a.id === bankAccount.id);
    const accounts = existing
      ? get().accounts
      : [...get().accounts, bankAccount];
    set({ connectedBanks, accounts });
    await persistState({ transactions: get().transactions, accounts, categories: get().categories });
  },

  disconnectBank: async (provider) => {
    const connectedBanks = get().connectedBanks.filter((b) => b !== provider);
    await saveConnectedBanks(connectedBanks);
    set({ connectedBanks });
  },

  syncBanks: async () => {
    set({ isSyncing: true });
    const { connectedBanks, transactions, accounts } = get();
    if (connectedBanks.length === 0) {
      set({ isSyncing: false });
      return { added: 0, errors: ['Подключите банки'] };
    }

    const since: Partial<Record<BankProvider, string>> = {};
    for (const provider of connectedBanks) {
      const accountId = BANK_ACCOUNTS[provider].id;
      const lastSync = accounts.find((a) => a.id === accountId)?.lastSynced;
      if (lastSync) since[provider] = lastSync;
    }

    const result = await syncAllBanks(connectedBanks, since);
    const existingIds = new Set(transactions.map((t) => t.externalId).filter(Boolean));
    const newOnes = result.transactions.filter(
      (t) => t.externalId && !existingIds.has(t.externalId)
    );

    let newTransactions = [...newOnes.map(migrateTx), ...transactions];
    let newAccounts = [...accounts];

    for (const tx of newOnes) {
      newAccounts = applyTransactionToAccounts(newAccounts, migrateTx(tx));
    }

    for (const [accountId, balance] of Object.entries(result.balances)) {
      newAccounts = newAccounts.map((a) =>
        a.id === accountId ? { ...a, balance, lastSynced: result.syncedAt } : a
      );
    }

    for (const provider of connectedBanks) {
      const accountId = BANK_ACCOUNTS[provider].id;
      newAccounts = newAccounts.map((a) =>
        a.id === accountId && !result.balances[accountId]
          ? { ...a, lastSynced: result.syncedAt }
          : a
      );
    }

    const summary = recalc(newTransactions, newAccounts);
    set({ transactions: newTransactions, accounts: newAccounts, summary, isSyncing: false });
    await persistState({ transactions: newTransactions, accounts: newAccounts, categories: get().categories });

    return { added: newOnes.length, errors: result.errors };
  },

  syncInBackground: async () => {
    const { connectedBanks } = get();
    if (connectedBanks.length > 0) {
      await get().syncBanks();
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterType: (f) => set({ filterType: f }),
  setSortOption: (s) => set({ sortOption: s }),

  updateTransactionCategory: (id, categoryId) => {
    const transactions = get().transactions.map((t) =>
      t.id === id ? { ...t, categoryId, aiCategorized: false } : t
    );
    const summary = recalc(transactions, get().accounts);
    set({ transactions, summary });
    persistState({ transactions, accounts: get().accounts, categories: get().categories });
  },

  updateTransaction: (id, updates) => {
    const transactions = get().transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ transactions });
    persistState({ transactions, accounts: get().accounts, categories: get().categories });
  },

  addCategory: (cat) => {
    const newCat: Category = { ...cat, id: `cat-custom-${Date.now()}`, isDefault: false };
    const categories = [...get().categories, newCat];
    set({ categories });
    persistState({ transactions: get().transactions, accounts: get().accounts, categories });
  },

  updateCategory: (id, updates) => {
    const categories = get().categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    set({ categories });
    persistState({ transactions: get().transactions, accounts: get().accounts, categories });
  },

  deleteCategory: (id) => {
    const cat = get().categories.find((c) => c.id === id);
    if (cat?.isDefault) return;
    const fallback = 'cat-shopping';
    const transactions = get().transactions.map((t) =>
      t.categoryId === id ? { ...t, categoryId: fallback } : t
    );
    const categories = get().categories.filter((c) => c.id !== id);
    const summary = recalc(transactions, get().accounts);
    set({ transactions, categories, summary });
    persistState({ transactions, accounts: get().accounts, categories });
  },

  getFilteredTransactions: () => {
    const { transactions, searchQuery, filterType, sortOption } = get();
    let result = [...transactions];

    if (filterType !== 'all') result = result.filter((t) => t.type === filterType);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.note?.toLowerCase().includes(q) ||
          t.counterparty?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount_desc':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'amount_asc':
          return Math.abs(a.amount) - Math.abs(b.amount);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  },

  getCategoryById: (id) => get().categories.find((c) => c.id === id),

  clearSession: () => {
    const empty = getEmptyState();
    set({
      transactions: [],
      accounts: empty.accounts,
      categories: empty.categories,
      connectedBanks: [],
      summary: recalc([], empty.accounts),
      isLoading: false,
      isSyncing: false,
      searchQuery: '',
      filterType: 'all',
      sortOption: 'date_desc',
    });
  },
  };
});
