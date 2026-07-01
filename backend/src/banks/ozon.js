import { normalizeTransaction } from '../normalize.js';

export async function syncOzon({ apiUrl, token, accountNumber, since }) {
  if (!apiUrl || !token) {
    return {
      transactions: [],
      balance: null,
      error: 'Ozon Банк: укажите OZON_BANK_API_URL и OZON_BANK_TOKEN в .env (запросите API у банка)',
    };
  }

  const params = new URLSearchParams();
  if (since) params.set('since', since);
  if (accountNumber) params.set('account', accountNumber);

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/operations?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text();
    return { transactions: [], balance: null, error: `Ozon: ${res.status} ${text}` };
  }

  const data = await res.json();
  const transactions = (data.operations ?? data.items ?? []).map((op) =>
    normalizeTransaction({
      externalId: `ozon-${op.id ?? op.operationId}`,
      title: op.description ?? op.title ?? 'Операция Ozon Банк',
      amount: Math.round(Number(op.amount)),
      type: Number(op.amount) >= 0 ? 'income' : 'expense',
      date: op.date ?? op.createdAt,
      accountId: 'acc-ozon',
      note: op.description,
    })
  );

  return { transactions, balance: data.balance ? Math.round(Number(data.balance)) : null, error: null };
}
