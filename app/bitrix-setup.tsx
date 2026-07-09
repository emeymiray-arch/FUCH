import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button } from '@/components/ui';
import { createBitrix24Client } from '@/services/integrations/bitrix24/client';
import {
  clearBitrix24Config,
  isBitrix24Configured,
  loadBitrix24Config,
  saveBitrix24Config,
} from '@/services/integrations/bitrix24/store';

export default function BitrixSetupScreen() {
  const { colors } = useTheme();
  const [portalUrl, setPortalUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBitrix24Config().then((cfg) => {
      if (!cfg) return;
      setPortalUrl(cfg.portalUrl);
      setWebhookUrl(cfg.webhookUrl);
      setConnected(isBitrix24Configured(cfg));
    });
  }, []);

  const handleConnect = async () => {
    if (!portalUrl.trim() || !webhookUrl.trim()) {
      Alert.alert('Битрикс24', 'Заполните URL портала и webhook');
      return;
    }

    setLoading(true);
    try {
      const client = createBitrix24Client(webhookUrl.trim());
      const user = await client.testConnection();
      await saveBitrix24Config({
        portalUrl: portalUrl.trim(),
        webhookUrl: webhookUrl.trim(),
        isActive: true,
      });
      setConnected(true);
      Alert.alert('Подключено', `Битрикс24: ${user.name ?? 'OK'}`);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось подключить');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await clearBitrix24Config();
    setConnected(false);
    Alert.alert('Отключено', 'Интеграция Битрикс24 удалена');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Битрикс24',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Card>
          <Ionicons name="business-outline" size={32} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Интеграция с Битрикс24</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, marginTop: 8 }}>
            Подключите входящий webhook — сделки и контакты можно будет синхронизировать с финансами.
          </Text>
        </Card>

        <Text style={[styles.section, { color: colors.text }]}>Настройка</Text>
        {[
          'Битрикс24 → Приложения → Вебхуки → Входящий вебхук',
          'Права: CRM (crm), user',
          'Скопируйте URL webhook',
          'Вставьте ниже и нажмите «Подключить»',
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.num, { backgroundColor: colors.accentLight }]}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: colors.text, flex: 1, lineHeight: 20 }}>{step}</Text>
          </View>
        ))}

        <Text style={[styles.label, { color: colors.textSecondary }]}>URL портала</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="https://company.bitrix24.ru"
          placeholderTextColor={colors.textSecondary}
          value={portalUrl}
          onChangeText={setPortalUrl}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Webhook URL</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="https://company.bitrix24.ru/rest/1/xxxxx/"
          placeholderTextColor={colors.textSecondary}
          value={webhookUrl}
          onChangeText={setWebhookUrl}
          autoCapitalize="none"
        />

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button title={connected ? 'Переподключить' : 'Подключить'} onPress={handleConnect} loading={loading} />
          {connected ? (
            <Button title="Отключить" onPress={handleDisconnect} variant="secondary" />
          ) : null}
        </View>
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
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    marginBottom: 8,
  },
});
