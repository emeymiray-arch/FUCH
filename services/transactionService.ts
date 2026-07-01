import { Account, CreateTransactionInput, PaymentMethod, Transaction, TransactionType } from '@/types';
import { autoCategorize } from '@/services/aiService';

const TYPE_CATEGORY: Record<TransactionType, string> = {
  income: 'cat-salary',
  expense: 'cat-shopping',
  investment: 'cat-investments',
  debt: 'cat-debts',
  salary: 'cat-salary',
  transfer: 'cat-transfers',
  cash: 'cat-transfers',
};

export function normalizeAmount(amount: number, type: TransactionType): number {
  const abs = Math.abs(amount);
  if (type === 'income') return abs;
  if (['expense', 'debt', 'salary', 'investment', 'transfer', 'cash'].includes(type)) {
    return -abs;
  }
  return amount;
}

export function defaultAccountId(paymentMethod: PaymentMethod, accountId?: string): string {
  if (accountId) return accountId;
  if (paymentMethod === 'cash') return 'acc-cash';
  return 'acc-sber';
}

export function defaultPaymentMethod(type: TransactionType, method?: PaymentMethod): PaymentMethod {
  if (method) return method;
  if (type === 'cash') return 'cash';
  if (type === 'transfer') return 'transfer';
  return 'cash';
}

export function buildTransaction(input: CreateTransactionInput): Transaction {
  const type = input.type;
  const paymentMethod = defaultPaymentMethod(type, input.paymentMethod);
  const accountId = defaultAccountId(paymentMethod, input.accountId);
  const amount = normalizeAmount(input.amount, type);
  const categoryId = input.categoryId ?? autoCategorize(input.title) ?? TYPE_CATEGORY[type];

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    amount,
    type,
    categoryId,
    date: input.date ?? new Date().toISOString(),
    accountId,
    note: input.note,
    counterparty: input.counterparty,
    attachments: input.attachments ?? [],
    aiCategorized: !input.categoryId,
    source: input.source ?? 'manual',
    paymentMethod,
  };
}

export function applyTransactionToAccounts(accounts: Account[], transaction: Transaction): Account[] {
  return accounts.map((acc) => {
    if (acc.id !== transaction.accountId) return acc;
    return { ...acc, balance: acc.balance + transaction.amount };
  });
}
