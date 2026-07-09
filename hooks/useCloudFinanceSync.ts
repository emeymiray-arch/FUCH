import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useFinanceStore } from '@/store/financeStore';
import { isCloudSyncAvailable, subscribeFinanceChanges } from '@/services/cloudFinance';

const POLL_MS = 45_000;

export function useCloudFinanceSync(userId: string | null | undefined, enabled: boolean): void {
  const refreshFromCloud = useFinanceStore((s) => s.refreshFromCloud);

  useEffect(() => {
    if (!enabled || !userId || !isCloudSyncAvailable()) return;

    refreshFromCloud();

    const unsubscribe = subscribeFinanceChanges(userId, () => {
      refreshFromCloud();
    });

    const timer = setInterval(() => {
      refreshFromCloud();
    }, POLL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshFromCloud();
    });

    return () => {
      unsubscribe();
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, userId, refreshFromCloud]);
}
