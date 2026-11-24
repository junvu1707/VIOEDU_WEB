import { Grade } from '../types/vioedu';

export const ADMIN_ID = 'uyenlp1310';

export interface ParsedStudentId {
  isValid: boolean;
  isAdmin: boolean;
  grade: Grade | null;
  number: number | null;
  normalized: string;
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
