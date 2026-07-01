import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button } from '@/components/ui';
import { getApiKey, getApiUrl, setApiKey, setApiUrl, DEFAULT_API_URL } from '@/services/apiConfig';
import { checkBackendHealth } from '@/services/bankSyncService';

export default function BankSetupScreen() {
  const { colors } = useTheme();
  const [url, setUrl] = useState(DEFAULT_API_URL);
  const [apiKey, setKey] = useState('dev-secret');
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [serverOk, setServerOk] = useState(false);

  useEffect(() => {
    getApiUrl().then(setUrl);
    getApiKey().then(setKey);
  }, []);

  const check = async () => {
    await setApiUrl(url);
    await setApiKey(apiKey);
    const health = await checkBackendHealth();
    setServerOk(health.ok);
    setStatus(health.banks);
    if (!health.ok) {
      Alert.alert('Сервер', health.error ?? 'Не удалось подключиться');
    }
  };

  const save = async () => {
    await setApiUrl(url);
    await setApiKey(apiKey);
    Alert.alert('Сохранено', 'Настройки сервера обновлены');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Сервер синхронизации',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <Card>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>
            Адрес backend-сервера
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 20 }}>
            На iPhone укажите IP вашего Mac вместо localhost, например: http://192.168.1.5:3001
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={url}
            onChangeText={setUrl}
            placeholder="http://localhost:3001"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 16, marginBottom: 8 }}>
            API ключ (из backend/.env → API_SECRET)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={apiKey}
            onChangeText={setKey}
            secureTextEntry
            autoCapitalize="none"
          />
          <View style={{ gap: 10, marginTop: 16 }}>
            <Button title="Проверить подключение" onPress={check} />
            <Button title="Сохранить" onPress={save} variant="secondary" />
          </View>
        </Card>

        {serverOk && (
          <Card style={{ marginTop: 16 }}>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.income} />
              <Text style={{ color: colors.income, fontWeight: '600' }}>Сервер подключён</Text>
            </View>
            {[
              { key: 'tinkoff', label: 'Т-Банк' },
              { key: 'sber', label: 'Сбер' },
              { key: 'ozon', label: 'Ozon Банк' },
            ].map((b) => (
              <View key={b.key} style={styles.bankStatus}>
                <Text style={{ color: colors.text }}>{b.label}</Text>
                <Text style={{ color: status[b.key] ? colors.income : colors.textSecondary }}>
                  {status[b.key] ? 'Токен настроен' : 'Нужен токен в .env'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>Как запустить</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, fontSize: 14 }}>
            1. cd backend{'\n'}
            2. cp .env.example .env{'\n'}
            3. Заполните токены банков{'\n'}
            4. npm install && npm start
          </Text>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bankStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
