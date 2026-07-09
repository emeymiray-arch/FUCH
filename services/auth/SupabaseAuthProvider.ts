import { User } from '@/types';
import { getAuthCallbackUrl } from '@/lib/config';
import { getSupabase } from '@/services/supabaseClient';
import { setFinanceUserId } from '@/services/financeData';
import { getSecureItem, setSecureItem, deleteSecureItem } from '@/services/secureStorage';
import { AuthProvider, RegisterResult } from '@/services/auth/types';
import { isValidPin, pinToPassword } from '@/services/auth/pin';

const USER_ID_KEY = 'finotchet_user_id';
const LAST_ACTIVITY_KEY = 'finotchet_last_activity';

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
  if (message.includes('Email not confirmed')) {
    return 'Подтвердите email — откройте ссылку из письма (не localhost)';
  }
  if (message.includes('rate limit')) return 'Слишком много попыток. Подождите минуту.';
  return message;
}

async function loadProfile(userId: string, email: string): Promise<User> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();

  const name = data?.name ?? email.split('@')[0];
  return mapUser(userId, data?.email ?? email, name);
}

async function persistSession(user: User, pin?: string): Promise<User> {
  await setSecureItem(USER_ID_KEY, user.id);
  if (pin) await setSecureItem(pinKey(user.id), pin);
  setFinanceUserId(user.id);
  await setSecureItem(LAST_ACTIVITY_KEY, Date.now().toString());
  return user;
}

export class SupabaseAuthProvider implements AuthProvider {
  readonly mode = 'supabase' as const;
  private unsubscribe: (() => void) | null = null;

  async init(): Promise<void> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const user = await loadProfile(data.session.user.id, data.session.user.email ?? '');
      setFinanceUserId(user.id);
      await setSecureItem(USER_ID_KEY, user.id);
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setFinanceUserId(null);
        await deleteSecureItem(USER_ID_KEY);
      }
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const user = await loadProfile(session.user.id, session.user.email ?? '');
        setFinanceUserId(user.id);
        await setSecureItem(USER_ID_KEY, user.id);
      }
    });

    this.unsubscribe = () => listener.subscription.unsubscribe();
  }

  async hasUsers(): Promise<boolean> {
    return true;
  }

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) return null;
    return loadProfile(session.user.id, session.user.email ?? '');
  }

  async register(name: string, email: string, pin: string): Promise<RegisterResult> {
    if (!isValidPin(pin)) throw new Error('Пароль должен содержать ровно 5 цифр');

    const supabase = getSupabase();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: pinToPassword(pin),
      options: {
        data: { name: name.trim() },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (error) throw new Error(translateAuthError(error.message));
    if (!data.user) throw new Error('Не удалось создать аккаунт');

    if (data.session) {
      const user = await loadProfile(data.user.id, normalizedEmail);
      await persistSession(user, pin);
      return { user, needsEmailVerification: false };
    }

    return { user: null, needsEmailVerification: true };
  }

  async login(email: string, pin: string): Promise<User> {
    if (!isValidPin(pin)) throw new Error('Введите 5-значный пароль');

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pinToPassword(pin),
    });

    if (error) throw new Error(translateAuthError(error.message));
    if (!data.user) throw new Error('Не удалось войти');

    const user = await loadProfile(data.user.id, data.user.email ?? email);
    return persistSession(user, pin);
  }

  async logout(): Promise<void> {
    const supabase = getSupabase();
    const userId = await getSecureItem(USER_ID_KEY);
    await supabase.auth.signOut();
    await deleteSecureItem(USER_ID_KEY);
    if (userId) await deleteSecureItem(pinKey(userId));
    setFinanceUserId(null);
  }

  async changePassword(currentPin: string, newPin: string): Promise<void> {
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

  async isBiometricEnabled(): Promise<boolean> {
    const userId = await getSecureItem(USER_ID_KEY);
    if (!userId) return false;
    return (await getSecureItem(biometricKey(userId))) === 'true';
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    const userId = await getSecureItem(USER_ID_KEY);
    if (!userId) return;
    await setSecureItem(biometricKey(userId), enabled ? 'true' : 'false');
  }

  async loginWithBiometric(): Promise<User | null> {
    return this.getCurrentUser();
  }

  async updateLastActivity(): Promise<void> {
    await setSecureItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  async checkInactivity(): Promise<boolean> {
    const raw = await getSecureItem(LAST_ACTIVITY_KEY);
    if (!raw) return false;
    const { INACTIVITY_TIMEOUT_MS } = await import('@/lib/config');
    return Date.now() - parseInt(raw, 10) > INACTIVITY_TIMEOUT_MS;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: getAuthCallbackUrl() },
    });
    if (error) throw new Error(translateAuthError(error.message));
  }

  async refreshSession(): Promise<User | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.user) return null;
    return loadProfile(data.session.user.id, data.session.user.email ?? '');
  }
}
