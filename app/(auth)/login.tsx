import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { PinInput, PIN_LEN } from '@/components/PinInput';
import { useAuthStore } from '@/store/authStore';

const DRAFT_KEY = 'finotchet_login_draft';

function loadDraft(): { email: string; pin: string } {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') {
    return { email: '', pin: '' };
  }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { email: '', pin: '' };
    const parsed = JSON.parse(raw) as { email?: string; pin?: string };
    return {
      email: parsed.email ?? '',
      pin: (parsed.pin ?? '').replace(/\D/g, '').slice(0, PIN_LEN),
    };
  } catch {
    return { email: '', pin: '' };
  }
}

function saveDraft(email: string, pin: string) {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ email, pin }));
}

function clearDraft() {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(DRAFT_KEY);
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithEmailPin = useAuthStore((s) => s.loginWithEmailPin);
  const loginWithBiometric = useAuthStore((s) => s.loginWithBiometric);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const hasUsers = useAuthStore((s) => s.hasUsers);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState(() => loadDraft().email);
  const [pin, setPin] = useState(() => loadDraft().pin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    saveDraft(email, pin);
  }, [email, pin]);

  useEffect(() => {
    if (!isLoading && !hasUsers) {
      router.replace('/(auth)/register' as never);
    }
  }, [hasUsers, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      clearDraft();
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    if (pin.length !== PIN_LEN) {
      setError('Введите 5-значный пароль');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await loginWithEmailPin(email.trim().toLowerCase(), pin);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось войти';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, pin, loginWithEmailPin]);

  const handleBiometric = async () => {
    const ok = await loginWithBiometric();
    if (!ok) setError('Не удалось выполнить вход по Face ID');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.text }]}>ФинОтчёт</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8 }}>
            Войдите в свой аккаунт
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="you@company.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <PinInput value={pin} onChange={setPin} label="Пароль (5 цифр)" />

          {error ? (
            <Text style={{ color: colors.expense, textAlign: 'center', marginTop: 12, lineHeight: 20 }}>
              {error}
            </Text>
          ) : null}

          {loading ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
              Проверка...
            </Text>
          ) : null}

          <View style={{ marginTop: 24, width: '100%' }}>
            <Button
              title="Войти"
              onPress={handleLogin}
              loading={loading}
              disabled={pin.length !== PIN_LEN || !email.trim() || loading}
            />
          </View>

          {biometricEnabled ? (
            <Pressable onPress={handleBiometric} style={styles.bioBtn} disabled={loading}>
              <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '500' }}>
                Войти с Face ID
              </Text>
            </Pressable>
          ) : null}

          <Link href={'/(auth)/register' as never} asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={{ color: colors.textSecondary }}>
                Нет аккаунта?{' '}
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Зарегистрироваться</Text>
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 36, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '800' },
  form: { width: '100%', alignItems: 'stretch' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  bioBtn: { alignItems: 'center', marginTop: 20, padding: 12 },
  linkBtn: { alignItems: 'center', marginTop: 24, padding: 12 },
});
