import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { User } from '@/types';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/secureStorage';

const PIN_KEY = 'finotchet_pin';
const AUTH_TOKEN_KEY = 'finotchet_auth_token';
const USER_KEY = 'finotchet_user';
const BIOMETRIC_KEY = 'finotchet_biometric';
const LAST_ACTIVITY_KEY = 'finotchet_last_activity';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
export const PIN_LENGTH = 5;
export const MANAGER_NAME = 'Мохьмад Эми';

const MANAGER: User = {
  id: 'manager-1',
  email: 'manager@finotchet.local',
  name: MANAGER_NAME,
};

function isValidPin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}

async function createSession(): Promise<User> {
  await setSecureItem(AUTH_TOKEN_KEY, `session_${Date.now()}`);
  await setSecureItem(USER_KEY, JSON.stringify(MANAGER));
  await updateLastActivity();
  return MANAGER;
}

export async function hasPassword(): Promise<boolean> {
  const pin = await getSecureItem(PIN_KEY);
  return !!pin;
}

export async function setupPassword(pin: string): Promise<User> {
  if (!isValidPin(pin)) {
    throw new Error('Пароль должен содержать ровно 5 цифр');
  }
  await setSecureItem(PIN_KEY, pin);
  return createSession();
}

export async function loginWithPin(pin: string): Promise<User> {
  if (!isValidPin(pin)) {
    throw new Error('Введите 5-значный пароль');
  }
  const stored = await getSecureItem(PIN_KEY);
  if (!stored) {
    throw new Error('Сначала настройте пароль');
  }
  if (stored !== pin) {
    throw new Error('Неверный пароль');
  }
  return createSession();
}

export async function changePassword(currentPin: string, newPin: string): Promise<void> {
  if (!isValidPin(newPin)) {
    throw new Error('Новый пароль должен содержать ровно 5 цифр');
  }
  const stored = await getSecureItem(PIN_KEY);
  if (!stored || stored !== currentPin) {
    throw new Error('Текущий пароль неверный');
  }
  await setSecureItem(PIN_KEY, newPin);
}

export async function logout(): Promise<void> {
  await deleteSecureItem(AUTH_TOKEN_KEY);
  await deleteSecureItem(USER_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const token = await getSecureItem(AUTH_TOKEN_KEY);
  if (!token) return null;
  const raw = await getSecureItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : MANAGER;
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await getSecureItem(BIOMETRIC_KEY);
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setSecureItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Войти в ФинОтчёт',
    cancelLabel: 'Отмена',
    fallbackLabel: 'Пароль',
  });
  return result.success;
}

export async function loginWithBiometric(): Promise<User | null> {
  const ok = await authenticateWithBiometric();
  if (!ok) return null;
  const hasPin = await hasPassword();
  if (!hasPin) return null;
  return createSession();
}

export async function updateLastActivity(): Promise<void> {
  await setSecureItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export async function checkInactivity(): Promise<boolean> {
  const raw = await getSecureItem(LAST_ACTIVITY_KEY);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) > INACTIVITY_TIMEOUT_MS;
}
