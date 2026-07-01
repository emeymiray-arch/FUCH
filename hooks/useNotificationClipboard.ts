import { useEffect, useRef, useCallback } from 'react';
import { AppState, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CreateTransactionInput, Transaction } from '@/types';
import { parseImportText, isDuplicateImport } from '@/services/importService';
import { useFinanceStore } from '@/store/financeStore';
import {
  isAutoNotificationEnabled,
  isClipboardAutoConfirmEnabled,
} from '@/services/notificationSettings';

let lastProcessed = '';

export async function checkClipboardAndImport(options?: {
  addTransaction?: (input: CreateTransactionInput) => void;
  transactions?: Transaction[];
  silent?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const addTransaction = options?.addTransaction ?? useFinanceStore.getState().addTransaction;
  const transactions = options?.transactions ?? useFinanceStore.getState().transactions;

  const enabled = await isAutoNotificationEnabled();
  if (!enabled) {
    return { ok: false, message: 'Чтение буфера отключено в настройках' };
  }

  const text = await Clipboard.getStringAsync();
  if (!text?.trim()) {
    return { ok: false, message: 'Буфер обмена пуст' };
  }

  if (text === lastProcessed) {
    return { ok: false, message: 'Этот текст уже обработан' };
  }

  const parsed = parseImportText(text);
  if (!parsed) {
    return {
      ok: false,
      message: 'Не похоже на банковское уведомление или голосовую команду',
    };
  }

  if (isDuplicateImport(text, transactions)) {
    lastProcessed = text;
    return { ok: false, message: 'Такая операция уже есть в журнале' };
  }

  lastProcessed = text;
  const autoConfirm = await isClipboardAutoConfirmEnabled();
  const amountStr = parsed.amount.toLocaleString('ru-RU');

  if (autoConfirm || options?.silent) {
    addTransaction(parsed);
    return { ok: true, message: `Добавлено: ${parsed.title} — ${amountStr} ₽` };
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Операция из буфера',
      `${parsed.title}\n${amountStr} ₽\n\nДобавить в ФинОтчёт?`,
      [
        {
          text: 'Пропустить',
          style: 'cancel',
          onPress: () => resolve({ ok: false, message: 'Отменено' }),
        },
        {
          text: 'Добавить',
          onPress: () => {
            addTransaction(parsed);
            resolve({ ok: true, message: `Добавлено: ${parsed.title} — ${amountStr} ₽` });
          },
        },
      ]
    );
  });
}

export function useNotificationClipboard(enabled: boolean) {
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const transactions = useFinanceStore((s) => s.transactions);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      await checkClipboardAndImport({ addTransaction, transactions });
    } finally {
      checking.current = false;
    }
  }, [addTransaction, transactions]);

  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    check();
    return () => sub.remove();
  }, [enabled, check]);
}
