import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, formatDate } from '@/hooks/useTheme';
import { Card, AmountText, Button } from '@/components/ui';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AttachmentPicker } from '@/components/AttachmentPicker';
import { useFinanceStore } from '@/store/financeStore';
import { Attachment } from '@/types';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { transactions, categories, updateTransactionCategory, updateTransaction } = useFinanceStore();
  const [showCategories, setShowCategories] = useState(false);
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saved, setSaved] = useState(true);

  const transaction = transactions.find((t) => t.id === id);

  useEffect(() => {
    if (!transaction) return;
    setNote(transaction.note ?? '');
    setAttachments(transaction.attachments ?? []);
    setSaved(true);
  }, [transaction?.id, transaction?.note, transaction?.attachments]);

  if (!transaction) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Операция не найдена</Text>
      </View>
    );
  }

  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = useFinanceStore.getState().accounts.find((a) => a.id === transaction.accountId);

  const handleSave = () => {
    updateTransaction(transaction.id, { note: note.trim() || undefined, attachments });
    setSaved(true);
  };

  const onNoteChange = (v: string) => {
    setNote(v);
    setSaved(false);
  };

  const onAttachmentsChange = (a: Attachment[]) => {
    setAttachments(a);
    setSaved(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Операция',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card style={styles.mainCard}>
          {category && <CategoryIcon category={category} size={24} />}
          <Text style={[styles.title, { color: colors.text }]}>{transaction.title}</Text>
          <AmountText amount={transaction.amount} size="xl" />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            {formatDate(transaction.date)} · {account?.name}
          </Text>
          {transaction.source === 'notification' && (
            <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="notifications-outline" size={14} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 12 }}>Из уведомления</Text>
            </View>
          )}
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Категория</Text>
        <Pressable onPress={() => setShowCategories(!showCategories)}>
          <Card style={styles.categoryRow}>
            <Text style={{ color: colors.text, fontSize: 15 }}>
              {category?.name ?? 'Выбрать'}
            </Text>
            {transaction.aiCategorized && (
              <Text style={{ color: colors.accent, fontSize: 12 }}>AI · нажмите для смены</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </Card>
        </Pressable>

        {showCategories && (
          <Card style={{ marginBottom: 16 }}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  updateTransactionCategory(transaction.id, c.id);
                  setShowCategories(false);
                }}
                style={styles.catOption}
              >
                <CategoryIcon category={c} size={16} />
                <Text style={{ color: colors.text, flex: 1 }}>{c.name}</Text>
                {c.id === transaction.categoryId && (
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                )}
              </Pressable>
            ))}
            <Pressable onPress={() => router.push('/categories')} style={styles.catOption}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={{ color: colors.accent }}>Управление категориями</Text>
            </Pressable>
          </Card>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Заметка</Text>
        <TextInput
          style={[styles.noteInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Добавить комментарий..."
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={onNoteChange}
          multiline
        />

        <AttachmentPicker attachments={attachments} onChange={onAttachmentsChange} />

        {!saved && (
          <View style={{ marginTop: 16 }}>
            <Button title="Сохранить изменения" onPress={handleSave} />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  mainCard: { alignItems: 'center', marginBottom: 20, paddingVertical: 24 },
  title: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
});
