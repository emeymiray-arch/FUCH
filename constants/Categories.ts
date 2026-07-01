import { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-products', name: 'Продукты', icon: 'cart', color: '#22C55E', isDefault: true, type: 'expense' },
  { id: 'cat-transport', name: 'Транспорт', icon: 'car', color: '#3B82F6', isDefault: true, type: 'expense' },
  { id: 'cat-cafe', name: 'Кафе и рестораны', icon: 'restaurant', color: '#F97316', isDefault: true, type: 'expense' },
  { id: 'cat-utilities', name: 'Коммунальные услуги', icon: 'flash', color: '#8B5CF6', isDefault: true, type: 'expense' },
  { id: 'cat-shopping', name: 'Покупки', icon: 'bag', color: '#EC4899', isDefault: true, type: 'expense' },
  { id: 'cat-subscriptions', name: 'Подписки', icon: 'repeat', color: '#6366F1', isDefault: true, type: 'expense' },
  { id: 'cat-salary', name: 'Зарплата', icon: 'wallet', color: '#10B981', isDefault: true, type: 'income' },
  { id: 'cat-investments', name: 'Инвестиции', icon: 'trending-up', color: '#2563EB', isDefault: true, type: 'both' },
  { id: 'cat-debts', name: 'Долги', icon: 'alert-circle', color: '#D97706', isDefault: true, type: 'both' },
  { id: 'cat-transfers', name: 'Переводы', icon: 'swap-horizontal', color: '#7C3AED', isDefault: true, type: 'both' },
];
