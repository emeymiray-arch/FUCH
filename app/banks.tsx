import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, formatMoney } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { useFinanceStore } from '@/store/financeStore';
import { BankProvider } from '@/types';

const BANK_INFO: Record<BankProvider, { name: string; color: string }> = {
  tinkoff: { name: 'Т-Банк', color: '#FFDD2D' },
  sber: { name: 'Сбер', color: '#21A038' },
  ozon: { name: 'Ozon Банк', color: '#005BFF' },
};

export default function BanksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { accounts, connectedBanks, isSyncing, connectBank, disconnectBank, syncBanks } =
    useFinanceStore();

  const handleToggle = async (provider: BankProvider) => {
    const connected = connectedBanks.includes(provider);
    if (connected) {
      Alert.alert('Отключить банк?', BANK_INFO[provider].name, [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Отключить', onPress: () => disconnectBank(provider) },
      ]);
    } else {
      await connectBank(provider);
    }
  };

  const handleSync = async () => {
    if (connectedBanks.length === 0) {
      Alert.alert('Банки', 'Сначала подключите хотя бы один банк');
      return;
    }
    const { added, errors } = await syncBanks();
    const msg = [
      added > 0 ? `Загружено ${added} новых операций` : 'Новых операций нет',
      ...errors,
    ].join('\n');
    Alert.alert('Синхронизация', msg);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Банки',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 22 }}>
          Подключите банк для автоматической синхронизации переводов, баланса и операций
        </Text>

        {(Object.keys(BANK_INFO) as BankProvider[]).map((provider) => {
          const info = BANK_INFO[provider];
          const account = accounts.find((a) => a.bankProvider === provider);
          const connected = connectedBanks.includes(provider);

          return (
            <Pressable key={provider} onPress={() => handleToggle(provider)}>
              <Card style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <View style={[styles.logo, { backgroundColor: info.color + '33' }]}>
                    <Text style={{ fontWeight: '800', color: info.color, fontSize: 16 }}>
                      {info.name[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                      {info.name}
                    </Text>
                    <Text style={{ color: connected ? colors.income : colors.textSecondary, fontSize: 13 }}>
                      {connected ? 'Подключён' : 'Нажмите для подключения'}
                    </Text>
                  </View>
                  <Ionicons
                    name={connected ? 'checkmark-circle' : 'add-circle-outline'}
                    size={24}
                    color={connected ? colors.income : colors.textSecondary}
                  />
                </View>
                {connected && account && (
                  <View style={[styles.balance, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Баланс</Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
                      {formatMoney(account.balance)}
                    </Text>
                    {account.lastSynced && (
                      <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                        Синхр.: {new Date(account.lastSynced).toLocaleString('ru-RU')}
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => router.push('/bank-setup' as Href)}
          style={[styles.setupBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="server-outline" size={18} color={colors.accent} />
          <Text style={{ color: colors.accent, fontWeight: '500' }}>Настроить сервер синхронизации</Text>
        </Pressable>

        <Pressable
          onPress={handleSync}
          disabled={isSyncing}
          style={[styles.syncBtn, { backgroundColor: colors.accent, opacity: isSyncing ? 0.7 : 1 }]}
        >
          <Ionicons name="sync" size={18} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 15 }}>
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
          </Text>
        </Pressable>

        <View style={[styles.features, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
            Операции и балансы подтягиваются автоматически с backend-сервера, который подключён к API банков.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bankCard: { marginBottom: 12 },
  bankHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  features: { borderRadius: 16, padding: 16 },
});
