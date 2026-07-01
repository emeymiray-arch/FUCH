import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { PinInput, PIN_LEN } from '@/components/PinInput';
import { useAuthStore } from '@/store/authStore';
import { MANAGER_NAME } from '@/services/authService';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const changePassword = useAuthStore((s) => s.changePassword);
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newPin !== confirmPin) {
      Alert.alert('Пароль', 'Новые пароли не совпадают');
      setConfirmPin('');
      setStep('new');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPin, newPin);
      Alert.alert('Готово', 'Пароль успешно изменён', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось изменить пароль');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setStep('current');
    } finally {
      setLoading(false);
    }
  };

  const pinValue = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;
  const setPinValue = step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin;

  const labels: Record<Step, string> = {
    current: 'Текущий пароль',
    new: 'Новый пароль',
    confirm: 'Повторите новый пароль',
  };

  const onNext = () => {
    if (step === 'current' && currentPin.length === PIN_LEN) setStep('new');
    else if (step === 'new' && newPin.length === PIN_LEN) setStep('confirm');
    else if (step === 'confirm' && confirmPin.length === PIN_LEN) handleSave();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Сменить пароль',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {MANAGER_NAME}
          </Text>
          <PinInput value={pinValue} onChange={setPinValue} label={labels[step]} />
          <View style={{ marginTop: 32, width: '100%' }}>
            <Button
              title={step === 'confirm' ? 'Сохранить' : 'Далее'}
              onPress={onNext}
              loading={loading}
              disabled={pinValue.length !== PIN_LEN}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 15, marginBottom: 32 },
});
