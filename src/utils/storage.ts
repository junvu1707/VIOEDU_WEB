import { DEFAULT_GITHUB_REPO } from '../services/githubBank';
import { ExamAttempt, IdActivationRecord, LocalFileImportRecord } from '../types/vioedu';

const KEYS = {
  STUDENT_NAME: 'dttt_student_name_v1',
  STUDENT_ID: 'dttt_student_id_v1',
  ID_ACTIVATIONS: 'dttt_id_activations_v1',
  HISTORY: 'vioedu_exam_history_v1',
  LOCAL_FILES: 'vioedu_local_files_v1',
  GITHUB_REPO: 'vioedu_github_repo_v1',
  CUSTOM_LINKS: 'vioedu_github_links_v1',
};

export function loadStudentName(): string {
  try {
    return localStorage.getItem(KEYS.STUDENT_NAME) || '';
  } catch {
    return '';
  }
}

export function saveStudentName(name: string): void {
  try {
    localStorage.setItem(KEYS.STUDENT_NAME, name);
  } catch {
    // ignore storage quota errors
  }
}

export function loadStudentId(): string {
  try {
    return localStorage.getItem(KEYS.STUDENT_ID) || '';
  } catch {
    return '';
  }
}

export function saveStudentId(id: string): void {
  try {
    localStorage.setItem(KEYS.STUDENT_ID, id);
  } catch {
    // ignore storage quota errors
  }
}

export function loadIdActivations(): Record<string, IdActivationRecord> {
  try {
    const raw = localStorage.getItem(KEYS.ID_ACTIVATIONS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, IdActivationRecord>)
      : {};
  } catch {
    return {};
  }
}

export function saveIdActivations(
  records: Record<string, IdActivationRecord>
): void {
  try {
    localStorage.setItem(KEYS.ID_ACTIVATIONS, JSON.stringify(records));
  } catch {
    // ignore storage quota errors
  }
}

export function loadExamHistory(): ExamAttempt[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExamAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveExamHistory(history: ExamAttempt[]): void {
  try {
    // Keep most recent 60 attempts to stay safely under browser localStorage limits
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 60)));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLocalFiles(): LocalFileImportRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.LOCAL_FILES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalFileImportRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalFiles(files: LocalFileImportRecord[]): void {
  try {
    localStorage.setItem(KEYS.LOCAL_FILES, JSON.stringify(files));
  } catch {
    // ignore storage quota errors
  }
}

export function loadGitHubRepoUrl(): string {
  try {
    return localStorage.getItem(KEYS.GITHUB_REPO) || DEFAULT_GITHUB_REPO;
  } catch {
    return DEFAULT_GITHUB_REPO;
  }
}

export function saveGitHubRepoUrl(url: string): void {
  try {
    localStorage.setItem(KEYS.GITHUB_REPO, url.trim() || DEFAULT_GITHUB_REPO);
  } catch {
    // ignore
  }
}

export function loadCustomLinks(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_LINKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCustomLinks(links: string[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOM_LINKS, JSON.stringify(links));
  } catch {
    // ignore
  }
}
