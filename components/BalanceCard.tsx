import { View, Text, StyleSheet } from 'react-native';
import { useTheme, formatMoney } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { FinanceSummary } from '@/types';

interface BalanceCardProps {
  summary: FinanceSummary;
}

export function BalanceCard({ summary }: BalanceCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Общий баланс</Text>
      <Text style={[styles.balance, { color: colors.text }]}>
        {formatMoney(summary.totalBalance)}
      </Text>
      <View style={styles.row}>
        <StatPill label="Доходы" value={summary.monthlyIncome} color={colors.income} />
        <StatPill label="Расходы" value={summary.monthlyExpenses} color={colors.expense} isExpense />
      </View>
    </Card>
  );
}

function StatPill({
  label,
  value,
  color,
  isExpense,
}: {
  label: string;
  value: number;
  color: string;
  isExpense?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.accentLight }]}>
      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
        {isExpense ? '−' : '+'}{formatMoney(value)}
      </Text>
    </View>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
  color?: string;
}

export function QuickStat({ label, value, color }: QuickStatProps) {
  const { colors } = useTheme();
  return (
    <Card style={styles.quickStat}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: color ?? colors.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  balance: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
  },
  quickStat: {
    flex: 1,
    minWidth: '45%',
  },
});
