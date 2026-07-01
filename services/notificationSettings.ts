import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIPBOARD_KEY = '@finotchet/auto_notification';
const AUTO_CONFIRM_KEY = '@finotchet/clipboard_auto_confirm';

export async function isAutoNotificationEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(CLIPBOARD_KEY);
  return v !== 'false';
}

export async function setAutoNotificationEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(CLIPBOARD_KEY, enabled ? 'true' : 'false');
}

export async function isClipboardAutoConfirmEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(AUTO_CONFIRM_KEY);
  return v === 'true';
}

export async function setClipboardAutoConfirmEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_CONFIRM_KEY, enabled ? 'true' : 'false');
}
