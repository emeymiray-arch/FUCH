import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { PinInput, PIN_LEN } from '@/components/PinInput';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loginWithEmailPin, loginWithBiometric, biometricEnabled, hasUsers, isLoading } =
    useAuthStore();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasUsers) {
      router.replace('/(auth)/register' as never);
    }
  }, [hasUsers, isLoading, router]);

  useEffect(() => {
    if (email.trim() && pin.length === PIN_LEN) {
      handleLogin(pin);
    }
  }, [pin]);

  const handleLogin = async (code?: string) => {
    const pinCode = code ?? pin;
    if (!email.trim()) {
      Alert.alert('Вход', 'Введите email');
      return;
    }
    if (pinCode.length !== PIN_LEN) return;

    setLoading(true);
    try {
      await loginWithEmailPin(email, pinCode);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось войти');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const ok = await loginWithBiometric();
    if (ok) router.replace('/(tabs)');
    else Alert.alert('Face ID', 'Не удалось выполнить вход');
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
          />

          <PinInput value={pin} onChange={setPin} label="Пароль (5 цифр)" />

          {loading && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12 }}>
              Проверка...
            </Text>
          )}

          <View style={{ marginTop: 24, width: '100%' }}>
            <Button
              title="Войти"
              onPress={() => handleLogin()}
              loading={loading}
              disabled={pin.length !== PIN_LEN || !email.trim()}
            />
          </View>

          {biometricEnabled && (
            <Pressable onPress={handleBiometric} style={styles.bioBtn}>
              <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '500' }}>
                Войти с Face ID
              </Text>
            </Pressable>
          )}

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
