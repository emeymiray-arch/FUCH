import { normalizeTransaction } from '../normalize.js';

const BASE = process.env.SBER_API_BASE || 'https://fintech.sberbank.ru:9443';

export async function syncSber({ token, accountNumber, since }) {
  if (!token || !accountNumber) {
    return { transactions: [], balance: null, error: 'Не задан SBER_ACCESS_TOKEN или SBER_ACCOUNT_NUMBER' };
  }

  const transactions = [];
  const dates = datesSince(since ?? daysAgo(30));

  for (const statementDate of dates) {
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = new URLSearchParams({
        accountNumber,
        statementDate,
        page: String(page),
      });

      const res = await fetch(`${BASE}/fintech/api/v2/statement/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return { transactions: [], balance: null, error: `Сбер: ${res.status} ${text}` };
      }

      const data = await res.json();
      const ops = data.transactions ?? data.operation ?? data.operations ?? [];

      for (const op of ops) {
        const raw = Number(op.amount?.amount ?? op.amount ?? op.rurSum ?? 0);
        const amount = Math.round(raw);
        if (!amount) continue;

        const isDebit = op.operationType === 'DEBIT' || op.direction === 'DEBIT' || amount < 0;

        transactions.push(
          normalizeTransaction({
            externalId: `sber-${op.operationId ?? op.uuid ?? op.documentNumber}`,
            title: op.paymentPurpose ?? op.purpose ?? op.counterPartyName ?? 'Операция Сбер',
            amount: isDebit ? -Math.abs(amount) : Math.abs(amount),
            type: isDebit ? 'expense' : 'income',
            date: op.operationDate ?? op.documentDate ?? statementDate,
            accountId: 'acc-sber',
            note: op.paymentPurpose,
            counterparty: op.counterPartyName,
          })
        );
      }

      const links = data._links ?? data.links ?? [];
      hasNext = links.some((l) => l.rel === 'next');
      page += 1;
      if (!ops.length) hasNext = false;
    }
  }

  return { transactions, balance: null, error: null };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function datesSince(since) {
  const dates = [];
  const start = new Date(since);
  const end = new Date();
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates.slice(-31);
}
