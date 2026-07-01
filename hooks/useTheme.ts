import { useColorScheme } from '@/components/useColorScheme';
import { Colors, ThemeColors } from '@/constants/Colors';

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  const colors: ThemeColors = Colors[scheme];
  return { colors, isDark: scheme === 'dark' };
}

export function formatMoney(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (!showSign) return formatted;
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `−${formatted}`;
  return formatted;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}
