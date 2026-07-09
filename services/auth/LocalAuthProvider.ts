import { User } from '@/types';
import { INACTIVITY_TIMEOUT_MS, PIN_LENGTH } from '@/lib/config';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/services/secureStorage';
import {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  StoredUser,
} from '@/services/userRegistry';
import { setFinanceUserId, migrateLegacyFinanceData } from '@/services/financeData';
import { AuthProvider, RegisterResult } from '@/services/auth/types';
import { isValidPin } from '@/services/auth/pin';

const AUTH_TOKEN_KEY = 'finotchet_auth_token';
const USER_ID_KEY = 'finotchet_user_id';
const LEGACY_PIN_KEY = 'finotchet_pin';

function pinKey(userId: string): string {
  return `finotchet_pin_${userId}`;
}

function biometricKey(userId: string): string {
  return `finotchet_biometric_${userId}`;
}

function toUser(stored: StoredUser): User {
  return { id: stored.id, email: stored.email, name: stored.name };
}

async function createSession(user: StoredUser): Promise<User> {
  await setSecureItem(AUTH_TOKEN_KEY, `session_${Date.now()}`);
  await setSecureItem(USER_ID_KEY, user.id);
  setFinanceUserId(user.id);
  await setSecureItem('finotchet_last_activity', Date.now().toString());
  return toUser(user);
}

export class LocalAuthProvider implements AuthProvider {
  readonly mode = 'local' as const;

  async init(): Promise<void> {
    await this.migrateLegacy();
  }

  private async migrateLegacy(): Promise<void> {
    const users = await getAllUsers();
    if (users.length > 0) return;

    const legacyPin = await getSecureItem(LEGACY_PIN_KEY);
    if (!legacyPin) return;

    const user = await createUser('Пользователь', 'user@finotchet.local');
    await setSecureItem(pinKey(user.id), legacyPin);
    await deleteSecureItem(LEGACY_PIN_KEY);
    await migrateLegacyFinanceData(user.id);
  }

  async hasUsers(): Promise<boolean> {
    await this.migrateLegacy();
    const users = await getAllUsers();
    return users.length > 0;
  }

  async getCurrentUser(): Promise<User | null> {
    const token = await getSecureItem(AUTH_TOKEN_KEY);
    const userId = await getSecureItem(USER_ID_KEY);
    if (!token || !userId) return null;

    const user = await findUserById(userId);
    if (!user) return null;

    setFinanceUserId(user.id);
    return toUser(user);
  }

  async register(name: string, email: string, pin: string): Promise<RegisterResult> {
    if (!isValidPin(pin)) throw new Error(`Пароль должен содержать ровно ${PIN_LENGTH} цифр`);

    const user = await createUser(name, email);
    await setSecureItem(pinKey(user.id), pin);
    const sessionUser = await createSession(user);
    return { user: sessionUser, needsEmailVerification: false };
  }

  async login(email: string, pin: string): Promise<User> {
    if (!isValidPin(pin)) throw new Error('Введите 5-значный пароль');

    const user = await findUserByEmail(email);
    if (!user) throw new Error('Пользователь с таким email не найден');

    const stored = await getSecureItem(pinKey(user.id));
    if (!stored || stored !== pin) throw new Error('Неверный пароль');

    return createSession(user);
  }

  async logout(): Promise<void> {
    await deleteSecureItem(AUTH_TOKEN_KEY);
    await deleteSecureItem(USER_ID_KEY);
    setFinanceUserId(null);
  }

  async changePassword(currentPin: string, newPin: string): Promise<void> {
    if (!isValidPin(newPin)) throw new Error(`Новый пароль должен содержать ровно ${PIN_LENGTH} цифр`);

    const userId = await getSecureItem(USER_ID_KEY);
    if (!userId) throw new Error('Сначала войдите в аккаунт');

    const stored = await getSecureItem(pinKey(userId));
    if (!stored || stored !== currentPin) throw new Error('Текущий пароль неверный');

    await setSecureItem(pinKey(userId), newPin);
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
    const userId = await getSecureItem(USER_ID_KEY);
    if (!userId) return null;

    const hasPin = !!(await getSecureItem(pinKey(userId)));
    if (!hasPin) return null;

    const user = await findUserById(userId);
    if (!user) return null;
    return createSession(user);
  }

  async updateLastActivity(): Promise<void> {
    await setSecureItem('finotchet_last_activity', Date.now().toString());
  }

  async checkInactivity(): Promise<boolean> {
    const raw = await getSecureItem('finotchet_last_activity');
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) > INACTIVITY_TIMEOUT_MS;
  }

  async resendVerificationEmail(_email: string): Promise<void> {
    throw new Error('Подтверждение email доступно только в облачном режиме');
  }

  async refreshSession(): Promise<User | null> {
    return this.getCurrentUser();
  }
}
