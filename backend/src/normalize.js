const TYPE_MAP = {
  income: 'income',
  expense: 'expense',
  transfer: 'transfer',
  debt: 'debt',
  salary: 'salary',
  investment: 'investment',
};

export function normalizeTransaction({
  externalId,
  title,
  amount,
  type,
  date,
  accountId,
  note,
  counterparty,
}) {
  const num = Number(amount);
  const txType = TYPE_MAP[type] ?? (num >= 0 ? 'income' : 'expense');

  return {
    id: `bank-${externalId}`,
    externalId,
    title: title || 'Банковская операция',
    amount: num,
    type: txType,
    categoryId: guessCategory(title, txType),
    date: new Date(date).toISOString(),
    accountId,
    note,
    counterparty,
    attachments: [],
    aiCategorized: true,
    source: 'bank',
    paymentMethod: 'bank',
  };
}

function guessCategory(title, type) {
  const t = (title || '').toLowerCase();
  if (t.includes('зарплат')) return 'cat-salary';
  if (t.includes('перевод')) return 'cat-transfers';
  if (t.includes('долг') || t.includes('кредит')) return 'cat-debts';
  if (type === 'income') return 'cat-salary';
  if (type === 'transfer') return 'cat-transfers';
  return 'cat-shopping';
}
