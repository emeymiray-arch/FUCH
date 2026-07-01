import { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme, formatMoney } from '@/hooks/useTheme';
import { Card, SectionHeader } from '@/components/ui';
import { SimpleBarChart } from '@/components/SimpleBarChart';
import { useFinanceStore } from '@/store/financeStore';
import { forecastExpenses, generateMonthlyReport } from '@/services/aiService';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { transactions, categories, summary } = useFinanceStore();

  const categoryStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthly = transactions.filter(
      (t) => new Date(t.date) >= monthStart && t.amount < 0
    );
    const map: Record<string, number> = {};
    monthly.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([id, value]) => ({
        label: categories.find((c) => c.id === id)?.name ?? id,
        value,
        color: categories.find((c) => c.id === id)?.color ?? colors.accent,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, colors.accent]);

  const employeeStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => t.type === 'salary' && t.amount < 0 && new Date(t.date) >= monthStart)
      .map((t) => ({
        label: t.counterparty ?? t.title,
        value: Math.abs(t.amount),
        color: colors.salary,
      }));
  }, [transactions, colors.salary]);

  const prevMonthExpenses = useMemo(() => {
    const now = new Date();
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= prevStart && d <= prevEnd && t.amount < 0;
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions]);

  const forecast = forecastExpenses(transactions);
  const report = generateMonthlyReport(summary, transactions);

  const incomeByType = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthly = transactions.filter(
      (t) => new Date(t.date) >= monthStart && t.amount > 0
    );
    const map: Record<string, number> = {};
    monthly.forEach((t) => {
      const key = t.type === 'salary' ? 'Зарплата' : t.type === 'transfer' ? 'Переводы' : 'Доход';
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      color: colors.income,
    }));
  }, [transactions, colors.income]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.compareRow}>
        <CompareCard
          label="Этот месяц"
          expenses={summary.monthlyExpenses}
          income={summary.monthlyIncome}
          colors={colors}
        />
        <CompareCard
          label="Прошлый месяц"
          expenses={prevMonthExpenses}
          income={0}
          colors={colors}
          muted
        />
      </View>

      <SectionHeader title="Расходы по категориям" />
      <Card style={{ marginBottom: 20 }}>
        <SimpleBarChart data={categoryStats.slice(0, 6)} />
      </Card>

      <SectionHeader title="Анализ доходов" />
      <Card style={{ marginBottom: 20 }}>
        <SimpleBarChart data={incomeByType} />
      </Card>

      {employeeStats.length > 0 && (
        <>
          <SectionHeader title="Зарплаты сотрудников" />
          <Card style={{ marginBottom: 20 }}>
            <SimpleBarChart data={employeeStats} />
          </Card>
        </>
      )}

      <SectionHeader title="Прогноз расходов" />
      <Card style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
          Прогноз на конец месяца
        </Text>
        <Text style={{ color: colors.expense, fontSize: 28, fontWeight: '800' }}>
          {formatMoney(forecast)}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
          На основе текущего темпа расходов
        </Text>
      </Card>

      <SectionHeader title="AI-отчёт за месяц" />
      <Card>
        <Text style={{ color: colors.text, lineHeight: 22, fontSize: 15 }}>{report}</Text>
      </Card>
    </ScrollView>
  );
}

function CompareCard({
  label,
  expenses,
  income,
  colors,
  muted,
}: {
  label: string;
  expenses: number;
  income: number;
  colors: ReturnType<typeof useTheme>['colors'];
  muted?: boolean;
}) {
  return (
    <View style={[styles.compareCard, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>{label}</Text>
      <Text style={{ color: muted ? colors.textSecondary : colors.expense, fontWeight: '700', fontSize: 16 }}>
        −{formatMoney(expenses)}
      </Text>
      {!muted && income > 0 && (
        <Text style={{ color: colors.income, fontWeight: '600', fontSize: 14, marginTop: 4 }}>
          +{formatMoney(income)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  compareRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  compareCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
});
