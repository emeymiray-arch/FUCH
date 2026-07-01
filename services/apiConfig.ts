import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = '@finotchet/api_url';
const API_KEY_KEY = '@finotchet/api_key';

export const DEFAULT_API_URL = 'http://localhost:3001';

export async function getApiUrl(): Promise<string> {
  return (await AsyncStorage.getItem(API_URL_KEY)) || DEFAULT_API_URL;
}

export async function setApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(API_URL_KEY, url.replace(/\/$/, ''));
}

export async function getApiKey(): Promise<string> {
  return (await AsyncStorage.getItem(API_KEY_KEY)) || 'dev-secret';
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_KEY, key);
}
