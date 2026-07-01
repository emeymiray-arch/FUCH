import { CreateTransactionInput, TransactionType } from '@/types';
import { autoCategorize } from '@/services/aiService';

function extractAmount(text: string): number | null {
  const patterns = [
    /(\d[\d\s]*[.,]\d{2})\s*(?:₽|руб|rub)/i,
    /(\d[\d\s]+)\s*(?:₽|руб|rub)/i,
    /(?:сумма|на)\s*(\d[\d\s]+)/i,
    /(\d[\d\s]{2,})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1].replace(/[\s.,]/g, '').slice(0, 12), 10);
      if (n > 0 && n < 100_000_000) return n;
    }
  }
  return null;
}

function detectBank(text: string): string | undefined {
  const l = text.toLowerCase();
  if (l.includes('t-bank') || l.includes('т-банк') || l.includes('tinkoff') || l.includes('тинькофф')) return 'acc-tinkoff';
  if (l.includes('сбер') || l.includes('sber')) return 'acc-sber';
  if (l.includes('ozon') || l.includes('озон')) return 'acc-ozon';
  return undefined;
}

function detectType(text: string, isIncome: boolean): TransactionType {
  const l = text.toLowerCase();
  if (l.includes('перевод') || l.includes('сбп') || l.includes('p2p')) return 'transfer';
  if (l.includes('зарплат')) return 'salary';
  if (l.includes('долг') || l.includes('кредит')) return 'debt';
  if (isIncome) return 'income';
  return 'expense';
}

function extractTitle(text: string): string {
  const cleaned = text
    .replace(/t-bank|т-банк|tinkoff|сбербанк|сбер|ozon|озон/gi, '')
    .replace(/списание|покупка|оплата|перевод|зачисление|поступление|перевод\s*на|перевод\s*с/gi, '')
    .replace(/\d[\d\s.,]*\s*(?:₽|руб|rub)/gi, '')
    .replace(/карта\s*\*?\d+/gi, '')
    .replace(/баланс.*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length >= 3) return cleaned.slice(0, 80);
  return 'Операция из уведомления';
}

export function looksLikeBankNotification(text: string): boolean {
  const l = text.toLowerCase();
  const hasAmount = !!extractAmount(text);
  const hasBank =
    /t-bank|т-банк|tinkoff|сбер|sber|ozon|озон|списан|зачисл|покупк|перевод|сбп|₽|руб/i.test(l);
  return hasAmount && hasBank;
}

export function parseNotificationText(text: string): CreateTransactionInput | null {
  const raw = text.trim();
  if (!looksLikeBankNotification(raw)) return null;

  const amount = extractAmount(raw);
  if (!amount) return null;

  const l = raw.toLowerCase();
  const isIncome = /зачисл|поступил|пополнен|перевод от|входящ|\+/.test(l);
  const type = detectType(raw, isIncome);
  const title = extractTitle(raw);
  const accountId = detectBank(raw);

  return {
    title,
    amount,
    type,
    paymentMethod: type === 'transfer' ? 'transfer' : 'bank',
    accountId,
    categoryId: autoCategorize(title),
    note: raw,
    source: 'notification',
  };
}
