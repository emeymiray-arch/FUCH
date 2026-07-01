import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { TransactionItem } from '@/components/TransactionItem';
import { useFinanceStore } from '@/store/financeStore';
import { FilterType, SortOption } from '@/types';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'expense', label: 'Расходы' },
  { key: 'income', label: 'Доходы' },
  { key: 'transfer', label: 'Переводы' },
  { key: 'salary', label: 'Зарплаты' },
  { key: 'debt', label: 'Долги' },
  { key: 'investment', label: 'Инвестиции' },
  { key: 'cash', label: 'Наличные' },
];

const SORTS: { key: SortOption; label: string }[] = [
  { key: 'date_desc', label: 'Сначала новые' },
  { key: 'date_asc', label: 'Сначала старые' },
  { key: 'amount_desc', label: 'По сумме ↓' },
  { key: 'amount_asc', label: 'По сумме ↑' },
];

export default function FinancesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    searchQuery,
    filterType,
    sortOption,
    setSearchQuery,
    setFilterType,
    setSortOption,
    getFilteredTransactions,
  } = useFinanceStore();
  const [showSort, setShowSort] = useState(false);
  const transactions = getFilteredTransactions();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.search, { color: colors.text }]}
          placeholder="Поиск операций..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Pressable onPress={() => setShowSort(!showSort)}>
          <Ionicons name="funnel-outline" size={20} color={colors.accent} />
        </Pressable>
      </View>

      {showSort && (
        <View style={[styles.sortPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => { setSortOption(s.key); setShowSort(false); }}
              style={styles.sortItem}
            >
              <Text style={{ color: sortOption === s.key ? colors.accent : colors.text }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilterType(f.key)}
            style={[
              styles.chip,
              {
                backgroundColor: filterType === f.key ? colors.accent : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: filterType === f.key ? '#FFF' : colors.text,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.surface }]}>
            <TransactionItem transaction={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              Нет операций
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 6 }}>
              Добавьте вручную, через Siri или синхронизируйте с банком
            </Text>
            <Pressable
              onPress={() => router.push('/add-transaction')}
              style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Добавить операцию</Text>
            </Pressable>
          </View>
        }
      />
      <Pressable
        onPress={() => router.push('/add-transaction')}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  search: { flex: 1, fontSize: 16, paddingVertical: 8 },
  sortPanel: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sortItem: { padding: 14 },
  filters: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  list: { padding: 16, paddingTop: 8 },
  item: {
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
