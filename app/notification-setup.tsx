import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';

const BANK_APPS = [
  { name: 'T-Bank', app: 'Т-Банк', keyword: 'T-Bank' },
  { name: 'Сбербанк', app: 'СберБанк', keyword: 'Сбербанк' },
  { name: 'Ozon Банк', app: 'Ozon Банк', keyword: 'Ozon' },
];

const EXAMPLE_URL =
  'finotchet://record?text=Т-Банк%20списание%20500%20₽%20Пятёрочка';

export default function NotificationSetupScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Уведомления',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card>
          <Ionicons name="notifications-outline" size={32} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Автозапись из уведомлений</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>
            iOS не позволяет приложению читать чужие push-уведомления напрямую. В ФинОтчёт есть два
            способа автоматически добавлять операции из банков.
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Способ 1 — Буфер обмена</Text>
        <Card>
          <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
            1. Получите уведомление от банка{'\n'}
            2. Долгое нажатие → «Скопировать»{'\n'}
            3. Откройте ФинОтчёт — появится предложение добавить операцию
          </Text>
          <Text style={{ color: colors.accent, marginTop: 12, fontSize: 13 }}>
            Включите в Настройках → «Читать уведомления из буфера»
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Способ 2 — Автоматизация «Команды»</Text>
        <Card>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
            Настройте автоматизацию для каждого банка:
          </Text>
          {[
            'Откройте «Команды» → вкладка «Автоматизация»',
            'Создать автоматизацию → «Уведомление»',
            'Выберите приложение банка (см. ниже)',
            'Добавьте действие «Получить текст уведомления»',
            'Добавьте «Открыть URL» и вставьте ссылку:',
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>{step}</Text>
            </View>
          ))}
          <Pressable
            onPress={() => Share.share({ message: 'finotchet://record?text=' })}
            style={[styles.urlBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.accent, fontFamily: 'monospace', fontSize: 12 }}>
              finotchet://record?text=[Текст уведомления]
            </Text>
          </Pressable>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
            В «Открыть URL» укажите: finotchet://record?text= и добавьте переменную «Текст
            уведомления» из предыдущего шага.
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Приложения банков</Text>
        {BANK_APPS.map((b) => (
          <Card key={b.name} style={styles.bankCard}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{b.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              В автоматизации выберите: {b.app}
            </Text>
          </Card>
        ))}

        <Text style={[styles.section, { color: colors.text }]}>Пример ссылки</Text>
        <Pressable
          onPress={() => Share.share({ message: EXAMPLE_URL })}
          style={[styles.urlBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={2}>
            {EXAMPLE_URL}
          </Text>
          <Ionicons name="share-outline" size={18} color={colors.accent} style={{ marginTop: 8 }} />
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 17, fontWeight: '600', marginTop: 12 },
  section: { fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  bankCard: { marginBottom: 8 },
});
