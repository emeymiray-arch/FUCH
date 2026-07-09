import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, formatMoney } from '@/hooks/useTheme';
import { BalanceCard, QuickStat } from '@/components/BalanceCard';
import { SectionHeader, Card } from '@/components/ui';
import { TransactionItem } from '@/components/TransactionItem';
import { useFinanceStore } from '@/store/financeStore';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { summary, transactions, accounts, isSyncing, syncInBackground } = useFinanceStore();
  const { user, checkSession } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => checkSession(), 30_000);
    return () => clearInterval(interval);
  }, []);

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={syncInBackground}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.topRow}>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Добро пожаловать</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 }}>
            {user?.name ?? 'Пользователь'}
          </Text>
          {isSyncing && (
            <Text style={{ color: colors.accent, fontSize: 12, marginTop: 2 }}>
              Синхронизация...
            </Text>
          )}
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={() => router.push('/banks')} style={styles.iconBtn}>
            <Ionicons name="card-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <BalanceCard summary={summary} />

      {transactions.length === 0 && (
        <Card style={styles.demoCard}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 6 }}>
            Начните с первой операции
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 14, lineHeight: 20 }}>
            Добавьте расход или доход вручную, подключите банк или настройте Битрикс24
          </Text>
          <Pressable
            onPress={() => router.push('/add-transaction')}
            style={[styles.demoBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Добавить операцию</Text>
          </Pressable>
        </Card>
      )}

      <View style={styles.statsGrid}>
        <QuickStat label="Долги" value={formatMoney(summary.totalDebts)} color={colors.debt} />
        <QuickStat
          label="Инвестиции"
          value={formatMoney(summary.investmentPortfolio)}
          color={colors.investment}
        />
        <QuickStat label="Наличные" value={formatMoney(summary.cashBalance)} color={colors.cash} />
        <QuickStat
          label="Счета"
          value={`${accounts.filter((a) => a.type === 'bank').length}`}
        />
      </View>

      <SectionHeader
        title="Последние операции"
        action="Все"
        onAction={() => router.push('/(tabs)/finances')}
      />
      <Card>
        {recent.map((tx, i) => (
          <View key={tx.id}>
            <TransactionItem transaction={tx} />
            {i < recent.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </Card>

      <SectionHeader title="Быстрая сводка" />
      <Card>
        <SummaryRow
          label="Сбережения за месяц"
          value={formatMoney(summary.monthlyIncome - summary.monthlyExpenses)}
          colors={colors}
        />
        <SummaryRow
          label="Средний расход в день"
          value={formatMoney(summary.monthlyExpenses / new Date().getDate())}
          colors={colors}
        />
        <SummaryRow
          label="Подключённые банки"
          value={`${accounts.filter((a) => a.bankProvider).length} из 3`}
          colors={colors}
        />
      </Card>
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  demoCard: { marginBottom: 16 },
  demoBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  divider: { height: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
});
