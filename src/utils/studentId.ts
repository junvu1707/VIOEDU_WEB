import { Grade, IdActivationRecord } from '../types/vioedu';

export const ADMIN_ID = 'uyenlp1310';
export const ACCOUNT_PASS = 'kcopass';

export interface ParsedStudentId {
  isValid: boolean;
  isAdmin: boolean;
  grade: Grade | null;
  number: number | null;
  normalized: string;
}

export function isValidAccountPass(raw: string): boolean {
  return raw.trim() === ACCOUNT_PASS;
}

/**
 * Validates student IDs in format l{1-9}_{001-999} (e.g. l1_001 .. l9_999)
 * or the admin ID 'uyenlp1310'.
 */
export function parseStudentId(raw: string): ParsedStudentId {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) {
    return {
      isValid: false,
      isAdmin: false,
      grade: null,
      number: null,
      normalized: '',
    };
  }

  if (cleaned === ADMIN_ID) {
    return {
      isValid: true,
      isAdmin: true,
      grade: null,
      number: null,
      normalized: ADMIN_ID,
    };
  }

  const match = cleaned.match(/^l([1-9])_(\d{3})$/);
  if (!match) {
    return {
      isValid: false,
      isAdmin: false,
      grade: null,
      number: null,
      normalized: cleaned,
    };
  }

  const grade = Number(match[1]) as Grade;
  const seq = Number(match[2]);
  if (seq < 1 || seq > 999) {
    return {
      isValid: false,
      isAdmin: false,
      grade: null,
      number: null,
      normalized: cleaned,
    };
  }

  return {
    isValid: true,
    isAdmin: false,
    grade,
    number: seq,
    normalized: `l${grade}_${String(seq).padStart(3, '0')}`,
  };
}

export function createOneYearActivation(
  normalizedId: string,
  grade: Grade,
  now: Date = new Date()
): IdActivationRecord {
  const expiry = new Date(now.getTime());
  expiry.setFullYear(expiry.getFullYear() + 1);
  return {
    id: normalizedId,
    grade,
    activatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
  };
}

export interface ActivationStatus {
  isExpired: boolean;
  daysLeft: number;
  activatedDateStr: string;
  expiresDateStr: string;
}

export function getActivationStatus(
  record: IdActivationRecord | null | undefined,
  now: Date = new Date()
): ActivationStatus | null {
  if (!record) return null;
  const expiresMs = new Date(record.expiresAt).getTime();
  const diffMs = expiresMs - now.getTime();
  const isExpired = diffMs <= 0;
  const daysLeft = isExpired ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    isExpired,
    daysLeft,
    activatedDateStr: new Date(record.activatedAt).toLocaleDateString('vi-VN'),
    expiresDateStr: new Date(record.expiresAt).toLocaleDateString('vi-VN'),
  };
}
