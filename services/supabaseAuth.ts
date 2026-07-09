import { User } from '@/types';
import { getSupabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { setFinanceUserId } from '@/services/financeData';
import { getSecureItem, setSecureItem, deleteSecureItem } from '@/services/secureStorage';

const USER_ID_KEY = 'finotchet_user_id';
const LAST_ACTIVITY_KEY = 'finotchet_last_activity';

export const PIN_LENGTH = 5;

function isValidPin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}

/** Преобразуем 5-значный PIN в пароль для Supabase (мин. 6 символов) */
export function pinToPassword(pin: string): string {
  return `FinOt_${pin}_x`;
}

function pinKey(userId: string): string {
  return `finotchet_pin_${userId}`;
}

function biometricKey(userId: string): string {
  return `finotchet_biometric_${userId}`;
}

function mapUser(id: string, email: string, name: string): User {
  return { id, email, name };
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Неверный email или пароль';
  if (message.includes('User already registered')) return 'Этот email уже зарегистрирован';
  if (message.includes('Email not confirmed')) return 'Подтвердите email (письмо от Supabase)';
  return message;
}

async function loadProfile(userId: string, email: string): Promise<User> {
  const supabase = getSupabase();
  const { data } = await supabase.from('profiles').select('name, email').eq('id', userId).maybeSingle();
  const name = data?.name ?? email.split('@')[0];
  return mapUser(userId, data?.email ?? email, name);
}

async function startSession(user: User, pin?: string): Promise<User> {
  await setSecureItem(USER_ID_KEY, user.id);
  if (pin) await setSecureItem(pinKey(user.id), pin);
  setFinanceUserId(user.id);
  await setSecureItem(LAST_ACTIVITY_KEY, Date.now().toString());
  return user;
}

export async function cloudRegister(name: string, email: string, pin: string): Promise<User> {
  if (!isValidPin(pin)) throw new Error('Пароль должен содержать ровно 5 цифр');

  const supabase = getSupabase();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: pinToPassword(pin),
    options: { data: { name: name.trim() } },
  });

  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error('Не удалось создать аккаунт');

  await supabase.from('profiles').upsert({
    id: data.user.id,
    name: name.trim(),
    email: normalizedEmail,
  });

  return startSession(mapUser(data.user.id, normalizedEmail, name.trim()), pin);
}

export async function cloudLogin(email: string, pin: string): Promise<User> {
  if (!isValidPin(pin)) throw new Error('Введите 5-значный пароль');

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: pinToPassword(pin),
  });

  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error('Не удалось войти');

  const user = await loadProfile(data.user.id, data.user.email ?? email);
  return startSession(user, pin);
}

export async function cloudLogout(): Promise<void> {
  const supabase = getSupabase();
  const userId = await getSecureItem(USER_ID_KEY);
  await supabase.auth.signOut();
  await deleteSecureItem(USER_ID_KEY);
  if (userId) await deleteSecureItem(pinKey(userId));
  setFinanceUserId(null);
}

export async function cloudGetSessionUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) return null;

  const user = await loadProfile(session.user.id, session.user.email ?? '');
  setFinanceUserId(user.id);
  await setSecureItem(USER_ID_KEY, user.id);
  return user;
}

export async function cloudChangePassword(currentPin: string, newPin: string): Promise<void> {
  if (!isValidPin(newPin)) throw new Error('Новый пароль должен содержать ровно 5 цифр');

  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) throw new Error('Сначала войдите в аккаунт');

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email,
    password: pinToPassword(currentPin),
  });
  if (verifyErr) throw new Error('Текущий пароль неверный');

  const { error } = await supabase.auth.updateUser({ password: pinToPassword(newPin) });
  if (error) throw new Error(error.message);

  const userId = await getSecureItem(USER_ID_KEY);
  if (userId) await setSecureItem(pinKey(userId), newPin);
}

export async function cloudIsBiometricEnabled(): Promise<boolean> {
  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return false;
  return (await getSecureItem(biometricKey(userId))) === 'true';
}

export async function cloudSetBiometricEnabled(enabled: boolean): Promise<void> {
  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return;
  await setSecureItem(biometricKey(userId), enabled ? 'true' : 'false');
}

export async function cloudLoginWithBiometric(): Promise<User | null> {
  const userId = await getSecureItem(USER_ID_KEY);
  if (!userId) return null;
  return cloudGetSessionUser();
}

export function cloudHasRegisteredUsers(): boolean {
  return true;
}

export { isSupabaseConfigured };
