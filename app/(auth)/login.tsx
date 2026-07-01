import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { PinInput, PIN_LEN } from '@/components/PinInput';
import { useAuthStore } from '@/store/authStore';
import { MANAGER_NAME } from '@/services/authService';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { hasPassword, setupPassword, loginWithPin, loginWithBiometric, biometricEnabled } =
    useAuthStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  const isSetup = !hasPassword;

  useEffect(() => {
    if (!isSetup && pin.length === PIN_LEN) {
      handleLogin(pin);
    }
  }, [pin, isSetup]);

  const handleSetup = async () => {
    if (pin.length !== PIN_LEN) {
      Alert.alert('Пароль', 'Введите 5 цифр');
      return;
    }
    if (step === 'enter') {
      setStep('confirm');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Пароль', 'Пароли не совпадают');
      setConfirmPin('');
      return;
    }
    setLoading(true);
    try {
      await setupPassword(pin);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось сохранить пароль');
      setPin('');
      setConfirmPin('');
      setStep('enter');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (code: string) => {
    if (code.length !== PIN_LEN) return;
    setLoading(true);
    try {
      await loginWithPin(code);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Неверный пароль');
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
          <Text style={[styles.welcome, { color: colors.textSecondary }]}>Добро пожаловать</Text>
          <Text style={[styles.name, { color: colors.text }]}>{MANAGER_NAME}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8 }}>
            {isSetup
              ? 'Настройте 5-значный пароль для входа'
              : 'Введите пароль для входа'}
          </Text>
        </View>

        {isSetup ? (
          <View style={styles.form}>
            {step === 'enter' ? (
              <PinInput value={pin} onChange={setPin} label="Придумайте пароль" />
            ) : (
              <PinInput value={confirmPin} onChange={setConfirmPin} label="Повторите пароль" />
            )}
            <View style={{ marginTop: 32 }}>
              <Button
                title={step === 'enter' ? 'Далее' : 'Сохранить пароль'}
                onPress={handleSetup}
                loading={loading}
                disabled={step === 'enter' ? pin.length !== PIN_LEN : confirmPin.length !== PIN_LEN}
              />
            </View>
            {step === 'confirm' && (
              <Pressable
                onPress={() => { setStep('enter'); setConfirmPin(''); }}
                style={styles.backBtn}
              >
                <Text style={{ color: colors.accent }}>Назад</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <PinInput value={pin} onChange={setPin} label="Пароль" />
            {loading && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
                Проверка...
              </Text>
            )}
            {biometricEnabled && (
              <Pressable onPress={handleBiometric} style={styles.bioBtn}>
                <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '500' }}>
                  Войти с Face ID
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 48, alignItems: 'center' },
  welcome: { fontSize: 16, marginBottom: 4 },
  name: { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  form: { alignItems: 'center' },
  backBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  bioBtn: { alignItems: 'center', marginTop: 24, padding: 12 },
});
