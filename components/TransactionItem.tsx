import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Transaction } from '@/types';
import { useTheme, formatDate } from '@/hooks/useTheme';
import { AmountText } from '@/components/ui';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useFinanceStore } from '@/store/financeStore';

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const getCategoryById = useFinanceStore((s) => s.getCategoryById);
  const category = getCategoryById(transaction.categoryId);

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${transaction.id}`)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {category && <CategoryIcon category={category} />}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.meta}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {category?.name ?? 'Без категории'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {formatDate(transaction.date)}
          </Text>
          {transaction.aiCategorized && (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
              <Text style={{ color: colors.accent, fontSize: 12 }}>AI</Text>
            </>
          )}
          {transaction.source === 'siri' && (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
              <Text style={{ color: colors.accent, fontSize: 12 }}>Siri</Text>
            </>
          )}
          {transaction.source === 'notification' && (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
              <Text style={{ color: colors.accent, fontSize: 12 }}>уведомление</Text>
            </>
          )}
          {transaction.attachments.length > 0 && (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>📎</Text>
            </>
          )}
          {transaction.paymentMethod === 'cash' && (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}> · </Text>
              <Text style={{ color: colors.warning, fontSize: 12 }}>наличные</Text>
            </>
          )}
        </View>
      </View>
      <AmountText amount={transaction.amount} size="md" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
