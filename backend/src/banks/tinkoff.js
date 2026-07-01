import { normalizeTransaction } from '../normalize.js';

const BASE = 'https://business.tbank.ru/openapi/api/v1';

export async function syncTinkoff({ token, accountNumber, since }) {
  if (!token || !accountNumber) {
    return { transactions: [], balance: null, error: 'Не задан TINKOFF_TOKEN или TINKOFF_ACCOUNT_NUMBER' };
  }

  const from = since ? new Date(since) : daysAgo(30);
  const till = new Date();

  const transactions = [];
  let cursor;
  let balance = null;

  do {
    const params = new URLSearchParams({
      accountNumber,
      from: from.toISOString(),
      till: till.toISOString(),
      limit: '1000',
      withBalances: cursor ? 'false' : 'true',
    });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${BASE}/statement?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      return { transactions: [], balance: null, error: `Т-Банк: ${res.status} ${text}` };
    }

    const data = await res.json();
    if (data.balances?.[0]?.balance != null) {
      balance = Math.round(Number(data.balances[0].balance));
    }

    for (const op of data.operations ?? []) {
      const amount = Math.round(Number(op.amount ?? op.operationAmount ?? 0));
      if (!amount) continue;

      transactions.push(
        normalizeTransaction({
          externalId: `tinkoff-${op.operationId ?? op.id}`,
          title: op.description ?? op.payPurpose ?? op.counterParty?.name ?? 'Операция Т-Банк',
          amount,
          type: amount > 0 ? 'income' : 'expense',
          date: op.operationDate ?? op.date ?? new Date().toISOString(),
          accountId: 'acc-tinkoff',
          note: op.payPurpose,
          counterparty: op.counterParty?.name,
        })
      );
    }

    cursor = data.nextCursor;
  } while (cursor);

  return { transactions, balance, error: null };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
