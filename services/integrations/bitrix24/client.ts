import { Bitrix24ApiResponse, Bitrix24Deal, Bitrix24User } from '@/services/integrations/bitrix24/types';

export class Bitrix24Client {
  constructor(private readonly webhookUrl: string) {}

  private async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const base = this.webhookUrl.replace(/\/$/, '');
    const url = `${base}/${method}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Битрикс24: HTTP ${res.status}`);
    }

    const data = (await res.json()) as Bitrix24ApiResponse<T>;
    if (data.error) {
      throw new Error(data.error_description ?? data.error);
    }

    return data.result;
  }

  async testConnection(): Promise<Bitrix24User> {
    return this.call<Bitrix24User>('user.current');
  }

  async listDeals(limit = 20): Promise<Bitrix24Deal[]> {
    const result = await this.call<{ deals?: Bitrix24Deal[] } | Bitrix24Deal[]>('crm.deal.list', {
      select: ['ID', 'TITLE', 'OPPORTUNITY', 'CURRENCY_ID', 'STAGE_ID'],
      order: { DATE_MODIFY: 'DESC' },
      start: 0,
      limit,
    });

    if (Array.isArray(result)) return result;
    return result.deals ?? [];
  }
}

export function createBitrix24Client(webhookUrl: string): Bitrix24Client {
  if (!webhookUrl.includes('bitrix24')) {
    throw new Error('Укажите корректный webhook URL Битрикс24');
  }
  return new Bitrix24Client(webhookUrl);
}
