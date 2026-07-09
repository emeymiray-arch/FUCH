# FUCH (ФинОтчёт)

Финансовое приложение (Expo + React Native).

**Репозиторий:** https://github.com/emeymiray-arch/FUCH

> Не путать с LIFE Dashboard — у FUCH свой Supabase-проект и свои ключи.

## Запуск

```bash
npm install
npm run start -- --web
```

Backend банков:
```bash
cd backend && npm install && npm start
```

## Supabase (опционально)

1. Создайте **новый** проект на [supabase.com](https://supabase.com) для FUCH
2. SQL Editor → выполните `supabase/schema.sql`
3. `cp .env.example .env` → укажите URL и publishable key
4. `npm run setup:supabase`
5. Authentication → Email → отключите Confirm email

## Vercel

Если видите **404 NOT_FOUND** / `DEPLOYMENT_NOT_FOUND` — на Vercel **ещё нет успешного деплоя** (или открыт старый URL от LIFE Dashboard).

### Первый деплой

1. Залейте код в GitHub: `git push origin main`
2. [vercel.com/new](https://vercel.com/new) → Import **`emeymiray-arch/FUCH`**
3. Framework: **Other** (настройки подтянутся из `vercel.json`)
4. Deploy

После Supabase (опционально) добавьте Environment Variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Build: `npm run build:web` · Output: `dist`

## Backend банков

`backend/.env.example` → `backend/.env` (токены T-Bank / Сбер)
