import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { isCloudAuthEnabled } from '@/services/authService';

export default function CloudSetupScreen() {
  const { colors } = useTheme();
  const configured = isCloudAuthEnabled();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Облако Supabase',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card>
          <Ionicons
            name={configured ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={32}
            color={configured ? colors.income : colors.textSecondary}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {configured ? 'Облако подключено' : 'Облако не настроено'}
          </Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>
            {configured
              ? 'Синхронизация между устройствами включена.'
              : 'Создайте отдельный проект Supabase для FUCH (не LIFE Dashboard).'}
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Настройка (один раз)</Text>
        {[
          'Зайдите на supabase.com → New Project',
          'SQL Editor → вставьте код из supabase/schema.sql → Run',
          'Settings → API → скопируйте Project URL и anon public key',
          'В папке проекта: скопируйте .env.example → .env',
          'Вставьте URL и ключ в .env',
          'Перезапустите: npm run start -- --web',
          'Authentication → Providers → Email → отключите Confirm email',
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: configured ? colors.income : colors.textSecondary, fontWeight: '600' }}>
            {configured ? 'Ключи в .env найдены' : 'Добавьте .env в корне проекта'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
            {configured
              ? 'Перезапустите Expo после изменения .env.\nКоманды: npm run setup:supabase · npm run db:schema'
              : 'Скопируйте .env.example → .env'}
          </Text>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
