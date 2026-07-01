import { CreateTransactionInput, Transaction } from '@/types';
import { parseNotificationText } from '@/services/notificationParser';
import { parseVoiceCommand } from '@/services/voiceCommandService';

/** Банковское уведомление или голосовая команда из буфера / Siri */
export function parseImportText(text: string): CreateTransactionInput | null {
  const raw = text.trim();
  if (!raw) return null;
  return parseNotificationText(raw) ?? parseVoiceCommand(raw);
}

export function isDuplicateImport(text: string, transactions: Transaction[]): boolean {
  const snippet = text.slice(0, 40);
  return transactions.some(
    (t) =>
      t.note === text ||
      (t.note && snippet.length > 10 && t.note.includes(snippet))
  );
}
