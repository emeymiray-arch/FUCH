export interface Bitrix24Config {
  portalUrl: string;
  webhookUrl: string;
  isActive: boolean;
  connectedAt?: string;
}

export interface Bitrix24Deal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stageId?: string;
}

export interface Bitrix24User {
  id: string;
  name: string;
  email?: string;
}

export interface Bitrix24ApiResponse<T> {
  result: T;
  error?: string;
  error_description?: string;
}
