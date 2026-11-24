import { GitHubSyncStatus, Question } from '../types/vioedu';
import { parseQuestionsPayload } from '../utils/questionParser';

export const DEFAULT_GITHUB_REPO = 'https://github.com/junvu1707/VIOEDU_WEB_DE';

interface RepoCoordinates {
  owner: string;
  repo: string;
}

export function extractGitHubRepo(url: string): RepoCoordinates | null {
  const cleaned = url.trim().replace(/\/+$/, '');
  const match = cleaned.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
  };
}

function toRawUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.includes('raw.githubusercontent.com')) return trimmed;
  // Convert https://github.com/user/repo/blob/branch/path.json -> raw
  const blobMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  );
  if (blobMatch) {
    return `https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}/${blobMatch[3]}/${blobMatch[4]}`;
  }
  return trimmed;
}

async function fetchRepoJsonPaths(
  owner: string,
  repo: string
): Promise<{ branch: string; paths: string[]; isEmpty: boolean }> {
  const branches = ['main', 'master'];
  let sawEmpty = false;

  for (const branch of branches) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (res.status === 409) {
      sawEmpty = true;
      continue;
    }

    if (res.ok) {
      const data = (await res.json()) as {
        tree?: Array<{ path?: string; type?: string }>;
      };
      const jsonPaths = (data.tree || [])
        .filter(
          (node) =>
            node.type === 'blob' &&
            typeof node.path === 'string' &&
            node.path.toLowerCase().endsWith('.json') &&
            !node.path.toLowerCase().endsWith('package.json') &&
            !node.path.toLowerCase().endsWith('tsconfig.json')
        )
        .map((node) => node.path as string);

      return { branch, paths: jsonPaths, isEmpty: jsonPaths.length === 0 };
    }
  }

  return { branch: 'main', paths: [], isEmpty: sawEmpty };
}

export async function syncQuestionsFromGitHub(
  repoUrl: string,
  customLinks: string[] = []
): Promise<{ questions: Question[]; status: GitHubSyncStatus }> {
  const nowIso = new Date().toISOString();
  const cacheBust = Date.now();
  const allQuestions: Question[] = [];
  const loadedFiles: string[] = [];
  const seenIds = new Set<string>();

  const coords = extractGitHubRepo(repoUrl);
  let repoWasEmpty = false;
  let repoError: string | null = null;

  if (coords) {
    try {
      const { branch, paths, isEmpty } = await fetchRepoJsonPaths(
        coords.owner,
        coords.repo
      );
      repoWasEmpty = isEmpty && paths.length === 0;

      const fetches = paths.map(async (filePath) => {
        const encodedPath = filePath
          .split('/')
          .map((seg) => encodeURIComponent(seg))
          .join('/');
        const rawUrl = `https://raw.githubusercontent.com/${coords.owner}/${coords.repo}/${branch}/${encodedPath}?t=${cacheBust}`;
        const r = await fetch(rawUrl, { cache: 'no-store' });
        if (!r.ok) return;
        const json = await r.json();
        const parsed = parseQuestionsPayload(json, 'github', filePath);
        if (parsed.questions.length > 0) {
          loadedFiles.push(filePath);
          for (const q of parsed.questions) {
            if (!seenIds.has(q.id)) {
              seenIds.add(q.id);
              allQuestions.push(q);
            }
          }
        }
      });

      await Promise.all(fetches);
    } catch (err) {
      repoError =
        err instanceof Error ? err.message : 'Không thể kết nối GitHub API.';
    }
  }

  // Also fetch any user-configured individual raw JSON links
  const validCustomLinks = customLinks.map((l) => l.trim()).filter(Boolean);
  for (const link of validCustomLinks) {
    try {
      const rawUrl = toRawUrl(link);
      const separator = rawUrl.includes('?') ? '&' : '?';
      const r = await fetch(`${rawUrl}${separator}t=${cacheBust}`, {
        cache: 'no-store',
      });
      if (!r.ok) continue;
      const json = await r.json();
      const fileLabel = rawUrl.split('/').pop()?.split('?')[0] || rawUrl;
      const parsed = parseQuestionsPayload(json, 'github', fileLabel);
      if (parsed.questions.length > 0) {
        loadedFiles.push(fileLabel);
        for (const q of parsed.questions) {
          if (!seenIds.has(q.id)) {
            seenIds.add(q.id);
            allQuestions.push(q);
          }
        }
      }
    } catch {
      // Skip unreachable custom links gracefully
    }
  }

  if (allQuestions.length > 0) {
    return {
      questions: allQuestions,
      status: {
        repoUrl,
        customLinks: validCustomLinks,
        status: 'success',
        lastSyncedAt: nowIso,
        filesLoaded: loadedFiles,
        questionCount: allQuestions.length,
        message: `Đã tự động tải ${allQuestions.length} câu hỏi từ ${loadedFiles.length} file JSON trên GitHub.`,
      },
    };
  }

  if (repoError && validCustomLinks.length === 0) {
    return {
      questions: [],
      status: {
        repoUrl,
        customLinks: validCustomLinks,
        status: 'error',
        lastSyncedAt: nowIso,
        filesLoaded: [],
        questionCount: 0,
        message: `Chưa thể đồng bộ GitHub (${repoError}). Bạn vẫn có thể thi ở Chế độ Test Mode hoặc tải file đề từ máy.`,
      },
    };
  }

  return {
    questions: [],
    status: {
      repoUrl,
      customLinks: validCustomLinks,
      status: 'empty',
      lastSyncedAt: nowIso,
      filesLoaded: [],
      questionCount: 0,
      message: repoWasEmpty
        ? 'Kho GitHub hiện chưa có file đề .json nào. Bạn có thể tải đề trực tiếp từ máy hoặc thêm file lên kho.'
        : 'Chưa tìm thấy câu hỏi hợp lệ trên kho GitHub.',
    },
  };
}
