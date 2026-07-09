import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const USERS_KEY = '@finotchet/users';

export interface StoredUser extends User {
  createdAt: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAllUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? (JSON.parse(raw) as StoredUser[]) : [];
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = normalizeEmail(email);
  const users = await getAllUsers();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function emailExists(email: string): Promise<boolean> {
  return !!(await findUserByEmail(email));
}

export async function createUser(name: string, email: string): Promise<StoredUser> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) {
    throw new Error('Введите корректный email');
  }
  if (await emailExists(normalized)) {
    throw new Error('Этот email уже зарегистрирован');
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new Error('Введите имя (минимум 2 символа)');
  }

  const user: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    email: normalized,
    createdAt: new Date().toISOString(),
  };

  const users = await getAllUsers();
  users.push(user);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export async function saveUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}
