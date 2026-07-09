import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';
import { useDeepLinks } from '@/hooks/useDeepLinks';
import { useNotificationClipboard } from '@/hooks/useNotificationClipboard';

export { ErrorBoundary } from 'expo-router';

function useProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, initialize: initAuth } = useAuthStore();
  const initFinance = useFinanceStore((s) => s.initialize);

  useEffect(() => {
    initAuth();
    initFinance();
  }, []);

  useProtectedRoute(isAuthenticated, isLoading);
  useDeepLinks(isAuthenticated && !isLoading);
  useNotificationClipboard(isAuthenticated && !isLoading);

  if (isLoading) return null;

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="assistant" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: true, title: 'Категории' }} />
        <Stack.Screen name="banks" options={{ headerShown: true, title: 'Банки' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Настройки' }} />
        <Stack.Screen name="change-password" options={{ headerShown: true, title: 'Сменить пароль' }} />
        <Stack.Screen name="add-transaction" options={{ headerShown: true, title: 'Новая операция' }} />
        <Stack.Screen name="bank-setup" options={{ headerShown: true, title: 'Сервер' }} />
        <Stack.Screen name="auto-import" options={{ headerShown: true, title: 'Siri и буфер' }} />
        <Stack.Screen name="cloud-setup" options={{ headerShown: true, title: 'Облако' }} />
        <Stack.Screen name="siri-setup" options={{ headerShown: true, title: 'Siri' }} />
        <Stack.Screen name="notification-setup" options={{ headerShown: true, title: 'Уведомления' }} />
        <Stack.Screen name="transaction/[id]" options={{ headerShown: true, title: 'Операция' }} />
      </Stack>
    </ThemeProvider>
  );
}
