export type TransactionType =
  | 'income'
  | 'expense'
  | 'investment'
  | 'debt'
  | 'salary'
  | 'transfer'
  | 'cash';

export type BankProvider = 'tinkoff' | 'sber' | 'ozon';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  type: 'income' | 'expense' | 'both';
}

export interface Attachment {
  id: string;
  type: 'receipt' | 'invoice' | 'contract' | 'payment' | 'pdf';
  uri: string;
  name: string;
  createdAt: string;
}

export type TransactionSource = 'manual' | 'bank' | 'siri' | 'voice' | 'notification' | 'bitrix24';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'bank';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  accountId: string;
  note?: string;
  attachments: Attachment[];
  aiCategorized: boolean;
  counterparty?: string;
  source: TransactionSource;
  paymentMethod: PaymentMethod;
  externalId?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'investment';
  balance: number;
  bankProvider?: BankProvider;
  currency: string;
  lastSynced?: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  monthlySalary: number;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebts: number;
  investmentPortfolio: number;
  cashBalance: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
export type FilterType = TransactionType | 'all';

export interface CreateTransactionInput {
  title: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  accountId?: string;
  note?: string;
  counterparty?: string;
  source?: TransactionSource;
  paymentMethod?: PaymentMethod;
  date?: string;
  attachments?: Attachment[];
}
