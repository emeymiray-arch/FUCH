import { Account, BankProvider, Transaction } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/Categories';
import { BANK_ACCOUNTS } from './financeData';

const now = new Date();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const DEMO_CONNECTED_BANKS: BankProvider[] = ['tinkoff', 'sber', 'ozon'];

export const DEMO_ACCOUNTS: Account[] = [
  { ...BANK_ACCOUNTS.tinkoff, balance: 487_320, lastSynced: now.toISOString() },
  { ...BANK_ACCOUNTS.sber, balance: 1_245_800, lastSynced: now.toISOString() },
  { ...BANK_ACCOUNTS.ozon, balance: 89_450, lastSynced: now.toISOString() },
  { id: 'acc-cash', name: 'Наличные', type: 'cash', balance: 35_000, currency: 'RUB' },
  { id: 'acc-invest', name: 'Инвестиции', type: 'investment', balance: 2_340_000, currency: 'RUB' },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Пятёрочка', amount: -3_420, type: 'expense', categoryId: 'cat-products', date: daysAgo(0), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-2', title: 'Яндекс Такси', amount: -890, type: 'expense', categoryId: 'cat-transport', date: daysAgo(0), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-3', title: 'Зарплата — ООО Альфа', amount: 185_000, type: 'salary', categoryId: 'cat-salary', date: daysAgo(1), accountId: 'acc-sber', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-4', title: 'Netflix', amount: -799, type: 'expense', categoryId: 'cat-subscriptions', date: daysAgo(2), accountId: 'acc-ozon', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-5', title: 'Кофемания', amount: -1_250, type: 'expense', categoryId: 'cat-cafe', date: daysAgo(2), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-6', title: 'Перевод Иванову И.', amount: -50_000, type: 'transfer', categoryId: 'cat-transfers', date: daysAgo(3), accountId: 'acc-sber', counterparty: 'Иванов И.', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'transfer' },
  { id: 'tx-7', title: 'Покупка ETF', amount: -100_000, type: 'investment', categoryId: 'cat-investments', date: daysAgo(5), accountId: 'acc-invest', aiCategorized: true, attachments: [], source: 'manual', paymentMethod: 'bank' },
  { id: 'tx-8', title: 'ЖКХ', amount: -8_750, type: 'expense', categoryId: 'cat-utilities', date: daysAgo(6), accountId: 'acc-sber', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-9', title: 'Зарплата — Петрова А.', amount: -95_000, type: 'salary', categoryId: 'cat-salary', date: daysAgo(7), accountId: 'acc-sber', counterparty: 'Петрова А.', aiCategorized: false, note: 'Выплата сотруднику', attachments: [], source: 'manual', paymentMethod: 'bank' },
  { id: 'tx-10', title: 'Кредит Сбер', amount: -42_500, type: 'debt', categoryId: 'cat-debts', date: daysAgo(8), accountId: 'acc-sber', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-11', title: 'Wildberries', amount: -12_890, type: 'expense', categoryId: 'cat-shopping', date: daysAgo(9), accountId: 'acc-ozon', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-12', title: 'Фриланс — проект X', amount: 75_000, type: 'income', categoryId: 'cat-salary', date: daysAgo(10), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-13', title: 'Снятие наличных', amount: -20_000, type: 'cash', categoryId: 'cat-transfers', date: daysAgo(12), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'cash' },
  { id: 'tx-14', title: 'Метро', amount: -65, type: 'expense', categoryId: 'cat-transport', date: daysAgo(14), accountId: 'acc-tinkoff', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'bank' },
  { id: 'tx-15', title: 'Долг наличными — Иванов', amount: -5_000, type: 'debt', categoryId: 'cat-debts', date: daysAgo(1), accountId: 'acc-cash', note: 'Демо: оплата долга наличными', aiCategorized: false, attachments: [], source: 'manual', paymentMethod: 'cash' },
  { id: 'tx-16', title: 'Перевод от партнёра', amount: 200_000, type: 'transfer', categoryId: 'cat-transfers', date: daysAgo(15), accountId: 'acc-sber', aiCategorized: true, attachments: [], source: 'bank', paymentMethod: 'transfer' },
];

export function getDemoState() {
  return {
    transactions: DEMO_TRANSACTIONS,
    accounts: DEMO_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    connectedBanks: DEMO_CONNECTED_BANKS,
  };
}
