#!/usr/bin/env node
/**
 * Применить supabase/schema.sql к базе.
 * SUPABASE_PROJECT_REF=khwy... SUPABASE_DB_PASSWORD=xxx npm run db:schema
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const envPath = resolve(root, '.env');
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf8');
    const m = text.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
    if (m) return m[1];
  }
  return null;
}

const PROJECT_REF = loadProjectRef();
const password = process.env.SUPABASE_DB_PASSWORD;

if (!PROJECT_REF || !password) {
  console.error(`
Укажите проект и пароль БД:
  SUPABASE_DB_PASSWORD=пароль npm run db:schema

Или добавьте EXPO_PUBLIC_SUPABASE_URL в .env
Пароль: Supabase Dashboard → Settings → Database
`);
  process.exit(1);
}

const dbUrl =
  process.env.SUPABASE_DB_URL ??
  `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;

const sql = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf8');
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  console.log(`Проект: ${PROJECT_REF}`);
  await client.connect();
  await client.query(sql);
  console.log('✓ schema.sql применён');
} catch (e) {
  if (String(e.message).includes('already exists')) {
    console.log('✓ Таблицы уже существуют');
  } else {
    console.error('Ошибка:', e.message);
    process.exit(1);
  }
} finally {
  await client.end().catch(() => {});
}
