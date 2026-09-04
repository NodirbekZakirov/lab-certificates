/**
 * API-клиент для Mini App.
 * Автоматически прикрепляет initData из Telegram SDK к каждому запросу.
 */

let cachedInitData: string | null = null;

export function setInitData(initData: string) {
  cachedInitData = initData;
}

export function getInitData(): string | null {
  return cachedInitData;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (cachedInitData) {
    headers.set('x-telegram-init-data', cachedInitData);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Equipment
export interface EquipmentItem {
  id: string;
  name: string;
  verificationTypeId: string;
  certificateNumber: string | null;
  expiryDate: string;
  certificateFileUrl: string | null;
  certificateFileType: string | null;
  updatedAt: string;
  verificationTypeNameRu: string;
  verificationTypeNameUz: string;
  verificationTypeSortOrder: number;
}

export interface EquipmentDetail extends EquipmentItem {
  createdAt: string;
  updatedBy: number | null;
  history: CertificateHistoryItem[];
}

export interface CertificateHistoryItem {
  id: string;
  equipmentId: string;
  oldCertificateNumber: string | null;
  oldExpiryDate: string | null;
  oldCertificateFileUrl: string | null;
  replacedAt: string;
  replacedBy: number;
}

export interface VerificationType {
  id: string;
  nameRu: string;
  nameUz: string;
  sortOrder: number;
}

export interface UserData {
  telegramId: number;
  firstName: string | null;
  username: string | null;
  language: string;
  isAllowed: boolean;
  notificationsEnabled: boolean;
}

export const api = {
  // User
  getUser: () => apiFetch<UserData>('/api/user'),
  updateUser: (data: Partial<Pick<UserData, 'language' | 'notificationsEnabled'>>) =>
    apiFetch<UserData>('/api/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Equipment
  getEquipment: () => apiFetch<EquipmentItem[]>('/api/equipment'),
  getEquipmentById: (id: string) =>
    apiFetch<EquipmentDetail>(`/api/equipment/${id}`),
  createEquipment: (data: {
    name: string;
    verificationTypeId: string;
    certificateNumber?: string;
    expiryDate: string;
    certificateFileUrl?: string;
    certificateFileType?: string;
  }) =>
    apiFetch<EquipmentItem>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipment: (
    id: string,
    data: {
      name?: string;
      certificateNumber?: string;
      expiryDate?: string;
      certificateFileUrl?: string;
      certificateFileType?: string;
    }
  ) =>
    apiFetch<EquipmentItem>(`/api/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Verification Types
  getVerificationTypes: () =>
    apiFetch<VerificationType[]>('/api/verification-types'),
  createVerificationType: (data: { nameRu: string; nameUz: string }) =>
    apiFetch<VerificationType>('/api/verification-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
