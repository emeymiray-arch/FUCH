import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { AttachmentPicker } from '@/components/AttachmentPicker';
import { useFinanceStore } from '@/store/financeStore';
import {
  Attachment,
  CreateTransactionInput,
  PaymentMethod,
  TransactionType,
} from '@/types';

const TYPES: { key: TransactionType; label: string }[] = [
  { key: 'expense', label: 'Расход' },
  { key: 'income', label: 'Доход' },
  { key: 'transfer', label: 'Перевод' },
  { key: 'debt', label: 'Долг' },
  { key: 'salary', label: 'Зарплата' },
  { key: 'investment', label: 'Инвестиция' },
  { key: 'cash', label: 'Наличные' },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Наличные' },
  { key: 'card', label: 'Карта' },
  { key: 'transfer', label: 'Перевод' },
  { key: 'bank', label: 'Банк' },
];

export default function AddTransactionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; method?: string }>();
  const { accounts, categories, addTransaction } = useFinanceStore();

  const [type, setType] = useState<TransactionType>((params.type as TransactionType) ?? 'expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (params.method as PaymentMethod) ?? 'cash'
  );
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [accountId, setAccountId] = useState('acc-cash');
  const [categoryId, setCategoryId] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    const num = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Укажите название операции');
      return;
    }
    if (!num || num <= 0) {
      Alert.alert('Ошибка', 'Укажите сумму');
      return;
    }

    setLoading(true);
    try {
      const input: CreateTransactionInput = {
        title: title.trim(),
        amount: num,
        type,
        paymentMethod,
        accountId,
        note: note.trim() || undefined,
        counterparty: counterparty.trim() || undefined,
        categoryId: categoryId || undefined,
        source: 'manual',
        attachments: attachments.length ? attachments : undefined,
      };
      addTransaction(input);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Новая операция',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Тип</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {TYPES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setType(t.key)}
              style={[
                styles.chip,
                { backgroundColor: type === t.key ? colors.accent : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: type === t.key ? '#FFF' : colors.text, fontSize: 13 }}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Способ оплаты</Text>
        <View style={styles.chipRow}>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => {
                setPaymentMethod(m.key);
                if (m.key === 'cash') setAccountId('acc-cash');
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: paymentMethod === m.key ? colors.accent : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: paymentMethod === m.key ? '#FFF' : colors.text, fontSize: 13 }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Название</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Например: Оплата долга Иванову"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Сумма, ₽</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Счёт</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={[
                styles.chip,
                { backgroundColor: accountId === a.id ? colors.accent : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: accountId === a.id ? '#FFF' : colors.text, fontSize: 13 }}>{a.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Категория (необязательно)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(categoryId === c.id ? '' : c.id)}
              style={[
                styles.chip,
                { backgroundColor: categoryId === c.id ? colors.accent : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: categoryId === c.id ? '#FFF' : colors.text, fontSize: 13 }}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {(type === 'transfer' || type === 'salary') && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Контрагент</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="ФИО или организация"
              placeholderTextColor={colors.textSecondary}
              value={counterparty}
              onChangeText={setCounterparty}
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Заметка</Text>
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Комментарий..."
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <AttachmentPicker
          attachments={attachments}
          onChange={setAttachments}
          label={type === 'transfer' ? 'Фото перевода / квитанция' : 'Фото и документы'}
        />

        <View style={{ marginTop: 24 }}>
          <Button title="Сохранить" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
