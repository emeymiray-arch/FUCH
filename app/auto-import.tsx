import { View, Text, StyleSheet, ScrollView, Pressable, Share, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { checkClipboardAndImport } from '@/hooks/useNotificationClipboard';

const SIRI_COMMANDS = [
  {
    title: 'Долг наличными',
    phrase: 'Запиши, наличными отдал долг 5000',
    url: 'finotchet://record?text=Запиши%20наличными%20отдал%20долг%205000',
  },
  {
    title: 'Расход',
    phrase: 'Добавь расход продукты 1500 наличными',
    url: 'finotchet://record?text=Добавь%20расход%20продукты%201500%20наличными',
  },
  {
    title: 'Доход',
    phrase: 'Запиши доход 50000 зарплата',
    url: 'finotchet://record?text=Запиши%20доход%2050000%20зарплата',
  },
  {
    title: 'Перевод',
    phrase: 'Запиши перевод 10000',
    url: 'finotchet://record?type=transfer&amount=10000&method=transfer&title=Перевод',
  },
];

const BANK_EXAMPLES = [
  { bank: 'T-Bank', text: 'T-Bank списание 1 234,56 ₽ MAGNIT' },
  { bank: 'Сбербанк', text: 'Сбербанк MIR1234 покупка 500р ПЯТЕРОЧКА' },
  { bank: 'Ozon', text: 'Ozon списание 999 ₽ WILDBERRIES' },
];

const BANK_AUTOMATIONS = [
  { name: 'T-Bank', app: 'Т-Банк' },
  { name: 'Сбербанк', app: 'СберБанк' },
  { name: 'Ozon Банк', app: 'Ozon Банк' },
];

export default function AutoImportScreen() {
  const { colors } = useTheme();

  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Скопировано', `${label}\n\nОткройте ФинОтчёт — операция предложится из буфера.`);
  };

  const shareUrl = (url: string) => Share.share({ message: url });

  const testClipboard = async () => {
    const result = await checkClipboardAndImport();
    Alert.alert(result.ok ? 'Готово' : 'Буфер', result.message);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Siri и буфер',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card>
          <Ionicons name="flash-outline" size={32} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Автозапись операций</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>
            Два способа без ручного ввода: скопировать уведомление банка или сказать Siri.
          </Text>
        </Card>

        {/* Буфер */}
        <Text style={[styles.section, { color: colors.text }]}>Буфер обмена</Text>
        <Card>
          <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
            1. Включите в Настройках → «Читать уведомления из буфера»{'\n'}
            2. Скопируйте текст банковского уведомления{'\n'}
            3. Откройте ФинОтчёт → подтвердите или включите «Без подтверждения»
          </Text>
          <Pressable
            onPress={testClipboard}
            style={[styles.actionBtn, { backgroundColor: colors.accent, marginTop: 14 }]}
          >
            <Ionicons name="clipboard-outline" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Проверить буфер сейчас</Text>
          </Pressable>
        </Card>

        <Text style={[styles.subsection, { color: colors.textSecondary }]}>Примеры для теста (нажмите — скопируется)</Text>
        {BANK_EXAMPLES.map((ex) => (
          <Pressable
            key={ex.bank}
            onPress={() => copyText(ex.text, ex.bank)}
            style={[styles.exampleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{ex.bank}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{ex.text}</Text>
            </View>
            <Ionicons name="copy-outline" size={20} color={colors.accent} />
          </Pressable>
        ))}

        {/* Siri */}
        <Text style={[styles.section, { color: colors.text }]}>Команды Siri</Text>
        <Card>
          {[
            'Откройте «Команды» на iPhone',
            'Создайте команду → «Добавить действие»',
            '«Спросить ввод» → фраза для Siri (например: «Записать расход»)',
            '«Диктовать текст» → пользователь говорит операцию',
            '«Открыть URL» → finotchet://record?text= + переменная «Диктовка»',
            'Скажите: «Эй Siri, записать расход»',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>{step}</Text>
            </View>
          ))}
        </Card>

        <Text style={[styles.subsection, { color: colors.textSecondary }]}>Готовые ссылки для «Открыть URL»</Text>
        {SIRI_COMMANDS.map((cmd) => (
          <Card key={cmd.title} style={styles.cmdCard}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{cmd.title}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>«{cmd.phrase}»</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }} selectable numberOfLines={2}>
              {cmd.url}
            </Text>
            <View style={styles.cmdActions}>
              <Pressable
                onPress={() => copyText(cmd.phrase, cmd.title)}
                style={[styles.smallBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="copy-outline" size={14} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12 }}>Копировать фразу</Text>
              </Pressable>
              <Pressable
                onPress={() => shareUrl(cmd.url)}
                style={[styles.smallBtn, { backgroundColor: colors.accentLight }]}
              >
                <Ionicons name="share-outline" size={14} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12 }}>Ссылка</Text>
              </Pressable>
            </View>
          </Card>
        ))}

        {/* Автоматизация уведомлений */}
        <Text style={[styles.section, { color: colors.text }]}>Автоматизация банков (Команды)</Text>
        <Card>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 10 }}>
            «Команды» → Автоматизация → Уведомление → выберите банк → «Получить текст
            уведомления» → «Открыть URL»:
          </Text>
          <Text
            style={[styles.urlBox, { color: colors.accent, backgroundColor: colors.surface, borderColor: colors.border }]}
            selectable
          >
            finotchet://record?text=[Текст уведомления]
          </Text>
          {BANK_AUTOMATIONS.map((b) => (
            <Text key={b.name} style={{ color: colors.text, marginTop: 10, fontSize: 14 }}>
              • {b.name} → приложение «{b.app}»
            </Text>
          ))}
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  subsection: { fontSize: 13, marginTop: 12, marginBottom: 8 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: '#FFF', fontWeight: '600' },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cmdCard: { marginBottom: 10 },
  cmdActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  urlBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
