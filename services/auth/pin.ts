import { PIN_LENGTH } from '@/lib/config';

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** Supabase требует пароль ≥6 символов — PIN преобразуем детерминированно. */
export function pinToPassword(pin: string): string {
  return `FinOt_${pin}_x`;
}
