# ФинОтчёт

Финансовое приложение для руководителя (Expo + React Native).

## Запуск

```bash
# Приложение
npm install
npm run start -- --web

# Backend (синхронизация банков)
cd backend && npm install && npm start
```

## Возможности

- PIN / Face ID, светлая и тёмная тема
- Журнал операций, аналитика, категории
- Ручной ввод, фото к переводам
- Импорт из буфера обмена и Siri (deep links)
- Синхронизация банков через backend (T-Bank, Сбер)

## Backend

Скопируйте `backend/.env.example` → `backend/.env` и укажите токены банков.
