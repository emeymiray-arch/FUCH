import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';
import { MANAGER_NAME } from '@/services/authService';
import {
  isAutoNotificationEnabled,
  setAutoNotificationEnabled,
  isClipboardAutoConfirmEnabled,
  setClipboardAutoConfirmEnabled,
} from '@/services/notificationSettings';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { biometricEnabled, toggleBiometric, logout } = useAuthStore();
  const resetFinance = useFinanceStore((s) => s.resetAllData);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);
  const [autoNotification, setAutoNotification] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);

  useEffect(() => {
    isAutoNotificationEnabled().then(setAutoNotification);
    isClipboardAutoConfirmEnabled().then(setAutoConfirm);
  }, []);

  const handleLoadDemo = () => {
    Alert.alert(
      'Загрузить демо-данные?',
      'Подставятся примерные операции, балансы и подключённые банки. Текущие данные будут заменены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Загрузить',
          onPress: async () => {
            await loadDemoData();
            Alert.alert('Готово', 'Демо-данные загружены');
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Обнулить все данные?',
      'Все операции, балансы и подключения банков будут удалены. Пароль сохранится.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Обнулить',
          style: 'destructive',
          onPress: async () => {
            await resetFinance();
            Alert.alert('Готово', 'Все финансовые данные обнулены');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Выход', 'Выйти из приложения?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Настройки',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <Card style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
            <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '700' }}>М</Text>
          </View>
          <View>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>{MANAGER_NAME}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Руководитель</Text>
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Безопасность</Text>
        <Card>
          <Pressable
            onPress={() => router.push('/change-password')}
            style={styles.row}
          >
            <Ionicons name="key-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Сменить пароль</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>5-значный код</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Ionicons name="finger-print" size={22} color={colors.accent} />
            <Text style={{ color: colors.text, flex: 1, fontSize: 15 }}>Face ID</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ true: colors.accent }}
            />
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Ionicons name="time-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Автовыход</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Через 5 мин бездействия
              </Text>
            </View>
            <Ionicons name="checkmark" size={20} color={colors.income} />
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Siri и буфер</Text>
        <Card>
          <Pressable
            onPress={() => router.push('/auto-import' as never)}
            style={styles.row}
          >
            <Ionicons name="flash-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Настройка автозаписи</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Инструкции, примеры, тест буфера
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Ionicons name="clipboard-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Читать буфер обмена</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                После копирования уведомления банка
              </Text>
            </View>
            <Switch
              value={autoNotification}
              onValueChange={async (v) => {
                setAutoNotification(v);
                await setAutoNotificationEnabled(v);
              }}
              trackColor={{ true: colors.accent }}
            />
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Ionicons name="checkmark-done-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Добавлять без подтверждения</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Из буфера сразу в журнал
              </Text>
            </View>
            <Switch
              value={autoConfirm}
              onValueChange={async (v) => {
                setAutoConfirm(v);
                await setClipboardAutoConfirmEnabled(v);
              }}
              trackColor={{ true: colors.accent }}
            />
          </View>
        </Card>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Данные</Text>
        <Card>
          <Pressable onPress={() => router.push('/categories')} style={styles.row}>
            <Ionicons name="pricetags-outline" size={22} color={colors.accent} />
            <Text style={{ color: colors.text, flex: 1, fontSize: 15 }}>Категории</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/banks')}
            style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Ionicons name="card-outline" size={22} color={colors.accent} />
            <Text style={{ color: colors.text, flex: 1, fontSize: 15 }}>Банковские счета</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleLoadDemo}
            style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Ionicons name="flask-outline" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 15 }}>Загрузить демо-данные</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Примеры операций и балансов
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={handleReset}
            style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}
          >
            <Ionicons name="trash-outline" size={22} color={colors.expense} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.expense, fontSize: 15 }}>Обнулить все данные</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Удалить операции и балансы
              </Text>
            </View>
          </Pressable>
        </Card>

        <Pressable onPress={handleLogout} style={[styles.logout, { borderColor: colors.expense }]}>
          <Text style={{ color: colors.expense, fontWeight: '600' }}>Выйти</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  logout: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
