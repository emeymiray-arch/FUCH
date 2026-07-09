import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { User } from '@/types';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/secureStorage';
import {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  StoredUser,
} from '@/services/userRegistry';
import { setFinanceUserId, migrateLegacyFinanceData } from '@/services/financeData';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import * as cloudAuth from '@/services/supabaseAuth';

const AUTH_TOKEN_KEY = 'finotchet_auth_token';
const USER_ID_KEY = 'finotchet_user_id';
const BIOMETRIC_KEY = 'finotchet_biometric';
const LAST_ACTIVITY_KEY = 'finotchet_last_activity';
const LEGACY_PIN_KEY = 'finotchet_pin';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
export const PIN_LENGTH = 5;

function pinKey(userId: string): string {
  return `finotchet_pin_${userId}`;
}

function biometricKey(userId: string): string {
  return `finotchet_biometric_${userId}`;
}

function isValidPin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}

function toUser(stored: StoredUser): User {
  return { id: stored.id, email: stored.email, name: stored.name };
}

async function createLocalSession(user: StoredUser): Promise<User> {
  await setSecureItem(AUTH_TOKEN_KEY, `session_${Date.now()}`);
  await setSecureItem(USER_ID_KEY, user.id);
  setFinanceUserId(user.id);
  await updateLastActivity();
  return toUser(user);
}

export function isCloudAuthEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function migrateLegacyAuth(): Promise<void> {
  if (isSupabaseConfigured()) return;

  const users = await getAllUsers();
  if (users.length > 0) return;

  const legacyPin = await getSecureItem(LEGACY_PIN_KEY);
  if (!legacyPin) return;

  const user = await createUser('Мохьмад Эми', 'manager@finotchet.local');
  await setSecureItem(pinKey(user.id), legacyPin);
  await deleteSecureItem(LEGACY_PIN_KEY);
  await migrateLegacyFinanceData(user.id);
}

export async function hasRegisteredUsers(): Promise<boolean> {
  if (isSupabaseConfigured()) return cloudAuth.cloudHasRegisteredUsers();
  await migrateLegacyAuth();
  const users = await getAllUsers();
  return users.length > 0;
}

export async function register(name: string, email: string, pin: string): Promise<User> {
  if (isSupabaseConfigured()) return cloudAuth.cloudRegister(name, email, pin);

  if (!isValidPin(pin)) {
    throw new Error('Пароль должен содержать ровно 5 цифр');
  }
  const user = await createUser(name, email);
  await setSecureItem(pinKey(user.id), pin);
  return createLocalSession(user);
}

export async function loginWithEmailPin(email: string, pin: string): Promise<User> {
  if (isSupabaseConfigured()) return cloudAuth.cloudLogin(email, pin);

  if (!isValidPin(pin)) {
    throw new Error('Введите 5-значный пароль');
  }
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Пользователь с таким email не найден');
  }
  const stored = await getSecureItem(pinKey(user.id));
  if (!stored || stored !== pin) {
    throw new Error('Неверный пароль');
  }
  return createLocalSession(user);
}

export async function changePassword(currentPin: string, newPin: string): Promise<void> {
  if (isSupabaseConfigured()) {
    return cloudAuth.cloudChangePassword(currentPin, newPin);
  }

  if (!isValidPin(newPin)) {
    throw new Error('Новый пароль должен содержать ровно 5 цифр');
  }
  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) throw new Error('Сначала войдите в аккаунт');

  const stored = await getSecureItem(pinKey(userId));
  if (!stored || stored !== currentPin) {
    throw new Error('Текущий пароль неверный');
  }
  await setSecureItem(pinKey(userId), newPin);
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    await cloudAuth.cloudLogout();
    return;
  }
  await deleteSecureItem(AUTH_TOKEN_KEY);
  await deleteSecureItem(USER_ID_KEY);
  setFinanceUserId(null);
}

export async function getStoredUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    return cloudAuth.cloudGetSessionUser();
  }

  const token = await getSecureItem(AUTH_TOKEN_KEY);
  const userId = await getSecureItem(USER_ID_KEY);
  if (!token || !userId) return null;

  const user = await findUserById(userId);
  if (!user) return null;

  setFinanceUserId(user.id);
  return toUser(user);
}

export async function isBiometricEnabled(): Promise<boolean> {
  if (isSupabaseConfigured()) return cloudAuth.cloudIsBiometricEnabled();

  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return false;
  const val = await getSecureItem(biometricKey(userId));
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (isSupabaseConfigured()) {
    return cloudAuth.cloudSetBiometricEnabled(enabled);
  }

  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return;
  await setSecureItem(biometricKey(userId), enabled ? 'true' : 'false');
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
  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return null;

  if (isSupabaseConfigured()) {
    const ok = await authenticateWithBiometric();
    if (!ok) return null;
    return cloudAuth.cloudLoginWithBiometric();
  }

  const hasPin = !!(await getSecureItem(pinKey(userId)));
  if (!hasPin) return null;

  const ok = await authenticateWithBiometric();
  if (!ok) return null;

  const user = await findUserById(userId);
  if (!user) return null;
  return createLocalSession(user);
}

export async function updateLastActivity(): Promise<void> {
  await setSecureItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export async function checkInactivity(): Promise<boolean> {
  const raw = await getSecureItem(LAST_ACTIVITY_KEY);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) > INACTIVITY_TIMEOUT_MS;
}

/** @deprecated use user.name from authStore */
export const MANAGER_NAME = 'Мохьмад Эми';
