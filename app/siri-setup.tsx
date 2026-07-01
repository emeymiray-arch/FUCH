import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';

const SIRI_EXAMPLES = [
  {
    phrase: 'Запиши, наличными отдал долг 5000',
    url: 'finotchet://record?type=debt&amount=5000&method=cash&title=Долг%20наличными',
  },
  {
    phrase: 'Добавь расход продукты 1500 наличными',
    url: 'finotchet://record?type=expense&amount=1500&method=cash&title=Продукты',
  },
  {
    phrase: 'Запиши перевод 10000',
    url: 'finotchet://record?type=transfer&amount=10000&method=transfer&title=Перевод',
  },
];

export default function SiriSetupScreen() {
  const { colors } = useTheme();

  const shareUrl = (url: string) => {
    Share.share({ message: url });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Siri',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card>
          <Ionicons name="mic-outline" size={32} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Голосовые команды через Siri</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>
            На iPhone создайте команду в приложении «Команды» (Shortcuts). Siri автоматически
            запишет операцию в ФинОтчёт.
          </Text>
        </Card>

        <Text style={[styles.step, { color: colors.text }]}>Как настроить</Text>
        {[
          'Откройте приложение «Команды» на iPhone',
          'Создайте новую команду → «Добавить действие»',
          'Выберите «Открыть URL»',
          'Вставьте ссылку из примера ниже',
          'Назовите команду, например: «Записать долг»',
          'Скажите Siri: «Эй Siri, записать долг»',
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}

        <Text style={[styles.step, { color: colors.text }]}>Примеры команд</Text>
        {SIRI_EXAMPLES.map((ex) => (
          <Card key={ex.phrase} style={styles.example}>
            <Text style={{ color: colors.text, fontWeight: '500', marginBottom: 6 }}>«{ex.phrase}»</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }} selectable>
              {ex.url}
            </Text>
            <Pressable onPress={() => shareUrl(ex.url)} style={[styles.copyBtn, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="share-outline" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Поделиться ссылкой</Text>
            </Pressable>
          </Card>
        ))}

        <Card style={{ marginTop: 8 }}>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, fontSize: 14 }}>
            Также можно диктовать операции в AI-помощнике внутри приложения: «Запиши, наличными
            отдал долг 5000» — запись создаётся автоматически.
          </Text>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  step: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  example: { marginBottom: 10 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
