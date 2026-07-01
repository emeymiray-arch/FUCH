import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }, style]}>
      {children}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

interface AmountTextProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
}

export function AmountText({ amount, size = 'md', showSign = true }: AmountTextProps) {
  const { colors } = useTheme();
  const color = amount > 0 ? colors.income : amount < 0 ? colors.expense : colors.text;
  const fontSize = { sm: 14, md: 16, lg: 22, xl: 32 }[size];

  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const prefix = showSign && amount > 0 ? '+' : showSign && amount < 0 ? '−' : '';

  return (
    <Text style={{ color, fontSize, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
      {prefix}{formatted}
    </Text>
  );
}

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '500' }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.accentLight : 'transparent';
  const textColor = variant === 'primary' ? '#FFFFFF' : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1 },
        variant === 'ghost' && { borderWidth: 0 },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{loading ? 'Загрузка...' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
