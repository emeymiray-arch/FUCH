import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { getAuthCallbackUrl } from '@/lib/config';
import { useAuthStore } from '@/store/authStore';

export default function VerifyEmailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resendVerification, refreshSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await resendVerification(String(email));
      setMessage('Письмо отправлено повторно');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить письмо');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmed = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await refreshSession();
      if (user) {
        router.replace('/(tabs)');
        return;
      }
      setError('Email ещё не подтверждён. Откройте ссылку из письма.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка проверки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <Ionicons name="mail-outline" size={48} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Подтвердите email</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 12 }}>
          Мы отправили письмо на{'\n'}
          <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 16, fontSize: 13 }}>
          Ссылка должна вести на:{'\n'}
          {getAuthCallbackUrl()}
        </Text>

        {message ? (
          <Text style={{ color: colors.income, marginTop: 16, textAlign: 'center' }}>{message}</Text>
        ) : null}
        {error ? (
          <Text style={{ color: colors.expense, marginTop: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        <View style={{ width: '100%', marginTop: 28, gap: 12 }}>
          <Button title="Я подтвердил email" onPress={handleConfirmed} loading={loading} />
          <Button title="Отправить письмо снова" onPress={handleResend} variant="secondary" disabled={!email || loading} />
        </View>

        <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.link}>
          <Text style={{ color: colors.accent }}>Вернуться ко входу</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginTop: 16 },
  link: { marginTop: 24, padding: 12 },
});
