import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { PinInput, PIN_LEN } from '@/components/PinInput';
import { useAuthStore } from '@/store/authStore';

type Step = 'info' | 'pin' | 'confirm';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step === 'info') {
      if (name.trim().length < 2) {
        Alert.alert('Регистрация', 'Введите имя');
        return;
      }
      if (!email.trim().includes('@')) {
        Alert.alert('Регистрация', 'Введите корректный email');
        return;
      }
      setStep('pin');
      return;
    }
    if (step === 'pin') {
      if (pin.length !== PIN_LEN) {
        Alert.alert('Регистрация', 'Пароль — 5 цифр');
        return;
      }
      setStep('confirm');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Регистрация', 'Пароли не совпадают');
      setConfirmPin('');
      setStep('pin');
      return;
    }
    handleRegister();
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), pin);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось зарегистрироваться');
      setPin('');
      setConfirmPin('');
      setStep('pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.logo, { color: colors.text }]}>Регистрация</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>
              Создайте аккаунт — у каждого пользователя свои финансы
            </Text>
          </View>

          {step === 'info' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Имя</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="Мохьмад Эми"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
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
            </View>
          )}

          {step === 'pin' && (
            <View style={styles.form}>
              <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 8 }}>{name}</Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>{email}</Text>
              <PinInput value={pin} onChange={setPin} label="Придумайте пароль (5 цифр)" />
            </View>
          )}

          {step === 'confirm' && (
            <View style={styles.form}>
              <PinInput value={confirmPin} onChange={setConfirmPin} label="Повторите пароль" />
            </View>
          )}

          <View style={{ marginTop: 24 }}>
            <Button
              title={step === 'confirm' ? 'Создать аккаунт' : 'Далее'}
              onPress={handleNext}
              loading={loading}
              disabled={
                step === 'pin'
                  ? pin.length !== PIN_LEN
                  : step === 'confirm'
                    ? confirmPin.length !== PIN_LEN
                    : false
              }
            />
          </View>

          {step !== 'info' && (
            <Pressable
              onPress={() => {
                if (step === 'confirm') setStep('pin');
                else setStep('info');
              }}
              style={styles.backBtn}
            >
              <Text style={{ color: colors.accent }}>Назад</Text>
            </Pressable>
          )}

          <Link href={'/(auth)/login' as never} asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={{ color: colors.textSecondary }}>
                Уже есть аккаунт?{' '}
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Войти</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800' },
  form: { width: '100%' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  linkBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
});
