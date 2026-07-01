import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const WEB_PREFIX = '@finotchet/secure/';

async function useSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (await useSecureStore()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(WEB_PREFIX + key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (await useSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(WEB_PREFIX + key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (await useSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(WEB_PREFIX + key);
}
