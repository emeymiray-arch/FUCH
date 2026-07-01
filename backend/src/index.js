import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { syncTinkoff } from './banks/tinkoff.js';
import { syncSber } from './banks/sber.js';
import { syncOzon } from './banks/ozon.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (key !== API_SECRET) {
    return res.status(401).json({ error: 'Неверный API ключ' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    banks: {
      tinkoff: !!process.env.TINKOFF_TOKEN,
      sber: !!process.env.SBER_ACCESS_TOKEN,
      ozon: !!(process.env.OZON_BANK_API_URL && process.env.OZON_BANK_TOKEN),
    },
  });
});

app.post('/sync', auth, async (req, res) => {
  const banks = req.body.banks ?? ['tinkoff', 'sber', 'ozon'];
  const since = req.body.since ?? {};

  const results = {};
  const allTransactions = [];
  const balances = {};
  const errors = [];

  if (banks.includes('tinkoff')) {
    const r = await syncTinkoff({
      token: process.env.TINKOFF_TOKEN,
      accountNumber: process.env.TINKOFF_ACCOUNT_NUMBER,
      since: since.tinkoff,
    });
    results.tinkoff = r;
    if (r.error) errors.push(r.error);
    else {
      allTransactions.push(...r.transactions);
      if (r.balance != null) balances['acc-tinkoff'] = r.balance;
    }
  }

  if (banks.includes('sber')) {
    const r = await syncSber({
      token: process.env.SBER_ACCESS_TOKEN,
      accountNumber: process.env.SBER_ACCOUNT_NUMBER,
      since: since.sber,
    });
    results.sber = r;
    if (r.error) errors.push(r.error);
    else allTransactions.push(...r.transactions);
  }

  if (banks.includes('ozon')) {
    const r = await syncOzon({
      apiUrl: process.env.OZON_BANK_API_URL,
      token: process.env.OZON_BANK_TOKEN,
      accountNumber: process.env.OZON_ACCOUNT_NUMBER,
      since: since.ozon,
    });
    results.ozon = r;
    if (r.error) errors.push(r.error);
    else {
      allTransactions.push(...r.transactions);
      if (r.balance != null) balances['acc-ozon'] = r.balance;
    }
  }

  res.json({
    transactions: allTransactions,
    balances,
    errors,
    syncedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`ФинОтчёт backend: http://localhost:${PORT}`);
  console.log('Проверка: GET /health');
});
