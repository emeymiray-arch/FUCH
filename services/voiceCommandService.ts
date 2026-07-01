import { BankProvider, CreateTransactionInput, Transaction, TransactionType } from '@/types';
import { parseNotificationText } from '@/services/notificationParser';
import { autoCategorize } from '@/services/aiService';
import { buildTransaction } from '@/services/transactionService';

function extractAmount(text: string): number | null {
  const match = text.match(/(\d[\d\s]*\d|\d+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/\s/g, ''), 10);
}

function detectType(text: string): TransactionType {
  if (text.includes('долг')) return 'debt';
  if (text.includes('перевод')) return 'transfer';
  if (text.includes('зарплат') || text.includes('сотрудник')) return 'salary';
  if (text.includes('инвест') || text.includes('вклад')) return 'investment';
  if (text.includes('доход') || text.includes('получил') || text.includes('поступил')) return 'income';
  if (text.includes('наличн') || text.includes('кэш')) return 'cash';
  if (text.includes('расход') || text.includes('потратил') || text.includes('купил') || text.includes('оплатил') || text.includes('отдал')) {
    return 'expense';
  }
  return 'expense';
}

function detectPaymentMethod(text: string): CreateTransactionInput['paymentMethod'] {
  if (text.includes('наличн') || text.includes('кэш') || text.includes('cash')) return 'cash';
  if (text.includes('перевод') || text.includes('карт')) return 'transfer';
  if (text.includes('банк') || text.includes('сбер') || text.includes('т-банк') || text.includes('ozon')) return 'bank';
  return 'cash';
}

function buildTitle(text: string, type: TransactionType, amount: number): string {
  if (text.includes('долг')) return `Долг (наличные) — ${amount.toLocaleString('ru-RU')} ₽`;
  if (type === 'transfer') return 'Перевод';
  if (type === 'income') return 'Доход';
  if (type === 'salary') return 'Выплата сотруднику';
  if (type === 'investment') return 'Инвестиция';
  const cleaned = text
    .replace(/запиши|записать|добавь|добавить|наличными|наличные|рублей|руб|₽|\d+/gi, '')
    .trim();
  return cleaned || 'Операция';
}

export function parseVoiceCommand(text: string): CreateTransactionInput | null {
  const q = text.toLowerCase().trim();
  const isRecord =
    q.includes('запиш') ||
    q.includes('добав') ||
    q.includes('отдал') ||
    q.includes('получил') ||
    q.includes('оплатил') ||
    q.includes('перевёл') ||
    q.includes('перевел') ||
    q.includes('выплатил');

  if (!isRecord) return null;

  const amount = extractAmount(q);
  if (!amount || amount <= 0) return null;

  const type = detectType(q);
  const paymentMethod = detectPaymentMethod(q);
  const title = buildTitle(q, type, amount);

  return {
    title,
    amount,
    type,
    paymentMethod,
    categoryId: autoCategorize(title),
    note: q,
    source: 'voice',
  };
}

export function parseSiriUrl(url: string): CreateTransactionInput | null {
  try {
    const parsed = new URL(url.replace('finotchet://', 'https://'));
    const path = parsed.hostname || parsed.pathname.replace('/', '');

    if (path !== 'add' && path !== 'record' && !url.includes('add') && !url.includes('record')) {
      const raw = decodeURIComponent(url.split('?text=')[1] ?? '');
      const notif = parseNotificationText(raw);
      if (notif) return notif;
      const voice = parseVoiceCommand(raw);
      if (voice) return { ...voice, source: 'siri' };
      return null;
    }

    const type = (parsed.searchParams.get('type') ?? 'expense') as TransactionType;
    const amount = parseInt(parsed.searchParams.get('amount') ?? '0', 10);
    const method = (parsed.searchParams.get('method') ?? 'cash') as CreateTransactionInput['paymentMethod'];
    const title = parsed.searchParams.get('title') ?? buildTitle('', type, amount);
    const note = parsed.searchParams.get('note') ?? undefined;
    const text = parsed.searchParams.get('text');

    if (text) {
      const decoded = decodeURIComponent(text);
      const notif = parseNotificationText(decoded);
      if (notif) return notif;
      const voice = parseVoiceCommand(decoded);
      if (voice) return { ...voice, source: 'siri' };
    }

    if (!amount || amount <= 0) return null;

    return {
      title: decodeURIComponent(title),
      amount,
      type,
      paymentMethod: method,
      note: note ? decodeURIComponent(note) : undefined,
      categoryId: autoCategorize(decodeURIComponent(title)),
      source: 'siri',
    };
  } catch {
    return null;
  }
}

export interface BankSyncResult {
  provider: BankProvider;
  newTransactions: Transaction[];
  balanceDelta: number;
}

export function createBankTransaction(
  provider: BankProvider,
  title: string,
  amount: number,
  type: TransactionType
): Transaction {
  const accountMap: Record<BankProvider, string> = {
    tinkoff: 'acc-tinkoff',
    sber: 'acc-sber',
    ozon: 'acc-ozon',
  };

  return buildTransaction({
    title,
    amount,
    type,
    accountId: accountMap[provider],
    paymentMethod: 'bank',
    source: 'bank',
  });
}
