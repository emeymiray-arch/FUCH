import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { isCloudAuthEnabled } from '@/services/authService';
import { getAppUrl, getAuthCallbackUrl } from '@/lib/config';

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
              ? 'Аккаунты и финансы синхронизируются между устройствами.'
              : 'Добавьте ключи Supabase в .env и Vercel.'}
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Supabase Dashboard</Text>
        {[
          'Authentication → URL Configuration',
          `Site URL: ${getAppUrl()}`,
          `Redirect URLs: ${getAuthCallbackUrl()}`,
          'Authentication → Email → включите Confirm email (если нужно)',
          'SQL Editor → выполните supabase/schema.sql',
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>Важно про письма</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 8 }}>
            Если в письме ссылка на localhost — в Supabase укажите Site URL и Redirect URLs как выше.
            После подтверждения откроется {getAuthCallbackUrl()}
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
