import { FinanceSummary, Transaction, TransactionType } from '@/types';
import { computeSummary } from './financeData';
import { useFinanceStore } from '@/store/financeStore';

interface AIResponse {
  text: string;
  analytics?: { label: string; value: string }[];
}

function getMonthTransactions(transactions: Transaction[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return transactions.filter((t) => new Date(t.date) >= monthStart);
}

function getWeekTransactions(transactions: Transaction[]) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return transactions.filter((t) => new Date(t.date) >= weekAgo);
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

export function processAIQuery(query: string): AIResponse {
  const { transactions, categories, summary } = useFinanceStore.getState();
  const q = query.toLowerCase().trim();
  const monthly = getMonthTransactions(transactions);
  const weekly = getWeekTransactions(transactions);

  if (q.includes('потратил') && q.includes('месяц')) {
    return {
      text: `За текущий месяц ваши расходы составили ${formatMoney(summary.monthlyExpenses)}.`,
      analytics: [
        { label: 'Расходы за месяц', value: formatMoney(summary.monthlyExpenses) },
        { label: 'Доходы за месяц', value: formatMoney(summary.monthlyIncome) },
        { label: 'Баланс', value: formatMoney(summary.monthlyIncome - summary.monthlyExpenses) },
      ],
    };
  }

  if (q.includes('категор') && (q.includes('затрат') || q.includes('больш'))) {
    const expenses = monthly.filter((t) => t.amount < 0);
    const byCategory: Record<string, number> = {};
    expenses.forEach((t) => {
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + Math.abs(t.amount);
    });
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const cat = categories.find((c) => c.id === top?.[0]);
    return {
      text: `Самая затратная категория — «${cat?.name ?? 'Неизвестно'}»: ${formatMoney(top?.[1] ?? 0)} за месяц.`,
      analytics: Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, amount]) => ({
          label: categories.find((c) => c.id === id)?.name ?? id,
          value: formatMoney(amount),
        })),
    };
  }

  if (q.includes('сотрудник') || q.includes('выплатил')) {
    const salaries = monthly.filter((t) => t.type === 'salary' && t.amount < 0);
    const total = salaries.reduce((s, t) => s + Math.abs(t.amount), 0);
    return {
      text: `За месяц вы выплатили сотрудникам ${formatMoney(total)} (${salaries.length} операций).`,
      analytics: salaries.map((t) => ({
        label: t.counterparty ?? t.title,
        value: formatMoney(Math.abs(t.amount)),
      })),
    };
  }

  if (q.includes('перевод') && q.includes('недел')) {
    const transfers = weekly.filter((t) => t.type === 'transfer');
    return {
      text: `За неделю — ${transfers.length} переводов на сумму ${formatMoney(transfers.reduce((s, t) => s + Math.abs(t.amount), 0))}.`,
      analytics: transfers.map((t) => ({
        label: t.title,
        value: formatMoney(t.amount),
      })),
    };
  }

  if (q.includes('больш') && q.includes('расход')) {
    const top = [...monthly]
      .filter((t) => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);
    return {
      text: `Топ-${top.length} крупнейших расходов за месяц.`,
      analytics: top.map((t) => ({
        label: t.title,
        value: formatMoney(Math.abs(t.amount)),
      })),
    };
  }

  if (q.includes('баланс') || q.includes('сколько денег')) {
    return {
      text: `Общий баланс: ${formatMoney(summary.totalBalance)}. Долги: ${formatMoney(summary.totalDebts)}.`,
      analytics: [
        { label: 'Общий баланс', value: formatMoney(summary.totalBalance) },
        { label: 'Инвестиции', value: formatMoney(summary.investmentPortfolio) },
        { label: 'Наличные', value: formatMoney(summary.cashBalance) },
      ],
    };
  }

  if (q.includes('доход')) {
    return {
      text: `Доходы за месяц: ${formatMoney(summary.monthlyIncome)}.`,
      analytics: [{ label: 'Доходы', value: formatMoney(summary.monthlyIncome) }],
    };
  }

  if (q.includes('аномал') || q.includes('эконом')) {
    const avg = summary.monthlyExpenses / Math.max(monthly.filter((t) => t.amount < 0).length, 1);
    const anomalies = monthly.filter((t) => t.amount < 0 && Math.abs(t.amount) > avg * 3);
    return {
      text: anomalies.length
        ? `Найдено ${anomalies.length} аномальных трат. Рекомендуем проверить крупные покупки.`
        : 'Аномальных трат не обнаружено. Расходы в пределах нормы.',
      analytics: anomalies.map((t) => ({
        label: t.title,
        value: formatMoney(Math.abs(t.amount)),
      })),
    };
  }

  return {
    text: 'Я могу помочь с анализом расходов, доходов, переводов и зарплат. Попробуйте: «Сколько я потратил за месяц?»',
  };
}

export function autoCategorize(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('пятёрочка') || lower.includes('магнит') || lower.includes('продукт')) return 'cat-products';
  if (lower.includes('такси') || lower.includes('метро') || lower.includes('яндекс')) return 'cat-transport';
  if (lower.includes('кофе') || lower.includes('ресторан')) return 'cat-cafe';
  if (lower.includes('жкх') || lower.includes('коммунал')) return 'cat-utilities';
  if (lower.includes('netflix') || lower.includes('подписк')) return 'cat-subscriptions';
  if (lower.includes('зарплат')) return 'cat-salary';
  if (lower.includes('etf') || lower.includes('инвест')) return 'cat-investments';
  if (lower.includes('кредит') || lower.includes('долг')) return 'cat-debts';
  if (lower.includes('перевод')) return 'cat-transfers';
  if (lower.includes('wildberries') || lower.includes('ozon')) return 'cat-shopping';
  return 'cat-shopping';
}

export function generateMonthlyReport(summary: FinanceSummary, transactions: Transaction[]): string {
  const expenses = transactions.filter((t) => t.amount < 0).length;
  const savings = summary.monthlyIncome - summary.monthlyExpenses;
  return `Ежемесячный отчёт: доходы ${formatMoney(summary.monthlyIncome)}, расходы ${formatMoney(summary.monthlyExpenses)}, ${expenses} операций. ${savings >= 0 ? `Профицит: ${formatMoney(savings)}.` : `Дефицит: ${formatMoney(Math.abs(savings))}.`}`;
}

export function forecastExpenses(transactions: Transaction[]): number {
  const monthly = getMonthTransactions(transactions);
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const spent = monthly.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return Math.round((spent / dayOfMonth) * daysInMonth);
}
