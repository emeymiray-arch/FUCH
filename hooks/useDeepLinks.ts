import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { useFinanceStore } from '@/store/financeStore';
import { parseSiriUrl } from '@/services/voiceCommandService';

export function useDeepLinks(enabled: boolean) {
  const router = useRouter();
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  useEffect(() => {
    if (!enabled) return;

    const handle = (url: string | null) => {
      if (!url || !url.includes('finotchet')) return;
      const input = parseSiriUrl(url);
      if (!input) return;

      const tx = addTransaction(input);
      const label = input.source === 'notification' ? 'Из уведомления' : 'Записано';
      if (Platform.OS === 'web') {
        router.push('/(tabs)/finances');
      } else {
        Alert.alert(label, `${tx.title}\n${Math.abs(tx.amount).toLocaleString('ru-RU')} ₽`, [
          { text: 'OK', onPress: () => router.push('/(tabs)/finances') },
        ]);
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [enabled, addTransaction, router]);
}
