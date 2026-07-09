# FUCH (ФинОтчёт)

Финансовое приложение для руководителя. Expo + React Native + Supabase.

**Репозиторий:** https://github.com/emeymiray-arch/FUCH  
**Продакшен:** https://fuch-mu.vercel.app

## Архитектура

```
app/                    — UI (Expo Router)
lib/config.ts           — URL, Supabase, константы
services/
  auth/                 — AuthProvider (Supabase / Local)
  integrations/bitrix24 — клиент и хранение webhook
  cloudFinance.ts       — синхронизация финансов
store/                  — Zustand (auth, finance)
supabase/schema.sql     — profiles, user_finance, user_integrations
```

## Быстрый старт

```bash
cp .env.example .env   # укажите ключи и APP_URL
npm install
npm run start -- --web
```

## Supabase (обязательно для облака)

1. SQL Editor → `supabase/schema.sql`
2. **Authentication → URL Configuration:**
   - Site URL: `https://fuch-mu.vercel.app`
   - Redirect URLs: `https://fuch-mu.vercel.app/auth/callback`
3. `.env`:
   ```
   EXPO_PUBLIC_APP_URL=https://fuch-mu.vercel.app
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

## Vercel

Те же переменные + `npm run build:web` → `dist`

## Битрикс24

Настройки → Битрикс24 → входящий webhook с правами CRM.

## Регистрация

- Email + 5-значный PIN
- Если включено Confirm email — письмо ведёт на `/auth/callback`, не на localhost
