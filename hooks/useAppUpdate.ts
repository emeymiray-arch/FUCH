import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';

const BUILD_ID = Constants.expoConfig?.extra?.buildId ?? 'dev';
const CHECK_MS = 60_000;

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

function versionUrl(): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/version.json?t=${Date.now()}`;
}

async function checkForUpdate(): Promise<void> {
  if (Platform.OS !== 'web' || BUILD_ID === 'dev' || isLocalHost()) return;
  if (typeof window === 'undefined') return;

  try {
    const res = await fetch(versionUrl(), { cache: 'no-store' });
    if (!res.ok) return;

    const remote = (await res.json()) as { buildId?: string };
    if (remote.buildId && remote.buildId !== BUILD_ID) {
      window.location.reload();
    }
  } catch {
    // офлайн или временная ошибка сети
  }
}

export function useAppUpdate(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    checkForUpdate();
    const timer = setInterval(checkForUpdate, CHECK_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForUpdate();
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled]);
}
