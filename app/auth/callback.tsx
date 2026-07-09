import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '@/hooks/useTheme';
import { getSupabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);
  const [message, setMessage] = useState('Подтверждаем email...');

  useEffect(() => {
    const complete = async () => {
      if (!isSupabaseConfigured()) {
        router.replace('/(auth)/login');
        return;
      }

      try {
        const supabase = getSupabase();
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl?.includes('code=')) {
          const { error } = await supabase.auth.exchangeCodeForSession(initialUrl);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          await initialize();
          router.replace('/(tabs)');
          return;
        }

        setMessage('Сессия не найдена. Войдите вручную.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Ошибка подтверждения');
        setTimeout(() => router.replace('/(auth)/login'), 3000);
      }
    };

    complete();
  }, [initialize, router]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={{ color: colors.text, marginTop: 16, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
