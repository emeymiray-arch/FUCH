#!/usr/bin/env node
/**
 * Настройка Supabase: проверка .env и таблиц.
 * Запуск: node scripts/setup-supabase.mjs
 * Или:   SUPABASE_PROJECT_URL=https://xxx.supabase.co node scripts/setup-supabase.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

function loadEnvFile() {
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function saveEnv(vars) {
  const content = `# ФинОтчёт — Supabase (не коммитить)
EXPO_PUBLIC_SUPABASE_URL=${vars.url}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${vars.publishable}
`;
  writeFileSync(envPath, content, 'utf8');
  console.log('✓ Записан', envPath);
}

const publishable =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_YVwFbaS2kgEusYrGxIdidg_PiGucOz9';

const existing = loadEnvFile();
let url =
  process.env.SUPABASE_PROJECT_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  existing.EXPO_PUBLIC_SUPABASE_URL ??
  '';

if (!url) {
  console.error(`
Не указан Project URL Supabase.

Добавьте в .env строку:
  EXPO_PUBLIC_SUPABASE_URL=https://ВАШ-ID.supabase.co

URL взять: Supabase Dashboard → Settings → API → Project URL

Или запустите:
  SUPABASE_PROJECT_URL=https://xxx.supabase.co node scripts/setup-supabase.mjs
`);
  process.exit(1);
}

url = url.replace(/\/$/, '');
saveEnv({ url, publishable });

const supabase = createClient(url, publishable);

async function main() {
  console.log('Проверка подключения к', url);

  const health = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: publishable },
  });
  console.log('Auth health:', health.status);

  const { error: profilesErr } = await supabase.from('profiles').select('id').limit(1);
  const { error: financeErr } = await supabase.from('user_finance').select('user_id').limit(1);

  if (profilesErr?.message?.includes('does not exist') || financeErr?.message?.includes('does not exist')) {
    console.error(`
✗ Таблицы не найдены. Выполните SQL в Supabase Dashboard → SQL Editor:
  Файл: supabase/schema.sql
`);
    process.exit(1);
  }

  if (profilesErr || financeErr) {
    console.warn('Предупреждение:', profilesErr?.message ?? financeErr?.message);
    console.warn('Если таблицы только что созданы — проверьте RLS и schema.sql');
  } else {
    console.log('✓ Таблицы profiles и user_finance доступны');
  }

  console.log(`
Готово. Перезапустите приложение:
  npm run start -- --web

В Supabase отключите Confirm email:
  Authentication → Providers → Email
`);
}

main().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
