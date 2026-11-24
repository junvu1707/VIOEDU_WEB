export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type RoundLevel = 1 | 2 | 3 | 4 | 5;

export type SubjectCode = 'toan' | 'tieng_viet' | 'toan_tieng_anh' | 'tieng_anh';

export type QuestionType = 'tn' | 'noi' | 'dt' | 'sx' | 'chon';

export type QuestionSource = 'github' | 'local' | 'sample';

export interface RoundConfig {
  level: RoundLevel;
  code: string;
  tierName: string;
  roundName: string;
  description: string;
  difficultyLabel: string;
}

export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ROUNDS: RoundConfig[] = [
  {
    level: 1,
    code: 'c1',
    tierName: 'Vòng Loại',
    roundName: 'Khởi động',
    description: 'Kiến thức nền tảng và phản xạ nhanh theo chuẩn từng khối lớp.',
    difficultyLabel: 'Cơ bản',
  },
  {
    level: 2,
    code: 'c2',
    tierName: 'Vòng Trường',
    roundName: 'Tăng tốc',
    description: 'Vận dụng linh hoạt các dạng bài tổng hợp cấp trường.',
    difficultyLabel: 'Trung bình',
  },
  {
    level: 3,
    code: 'c3',
    tierName: 'Vòng Phường',
    roundName: 'Tranh tài',
    description: 'Tư duy logic nâng cao và xử lý đề đa môn tốc độ cao.',
    difficultyLabel: 'Khá',
  },
  {
    level: 4,
    code: 'c4',
    tierName: 'Vòng Tỉnh',
    roundName: 'Siêu trí tuệ',
    description: 'Thử thách phân tích sâu, suy luận đa bước cấp tỉnh/thành phố.',
    difficultyLabel: 'Nâng cao',
  },
  {
    level: 5,
    code: 'c5',
    tierName: 'Vòng Quốc gia',
    roundName: 'Chinh phục',
    description: 'Đỉnh cao đấu trường toàn quốc với tổ hợp bài toán toàn diện.',
    difficultyLabel: 'Xuất sắc',
  },
];

export const SUBJECT_ID_CODE: Record<SubjectCode, string> = {
  toan: 't',
  tieng_viet: 'tv',
  toan_tieng_anh: 'tta',
  tieng_anh: 'ta',
};

export const SUBJECT_INFO: Record<
  SubjectCode,
  { name: string; shortName: string; accentClass: string; barClass: string }
> = {
  toan: {
    name: 'Toán',
    shortName: 'Toán',
    accentClass: 'text-emerald-700',
    barClass: 'bg-emerald-600',
  },
  tieng_viet: {
    name: 'Tiếng Việt',
    shortName: 'Tiếng Việt',
    accentClass: 'text-amber-700',
    barClass: 'bg-amber-500',
  },
  toan_tieng_anh: {
    name: 'Toán bằng tiếng Anh',
    shortName: 'Toán TA',
    accentClass: 'text-sky-700',
    barClass: 'bg-sky-600',
  },
  tieng_anh: {
    name: 'Tiếng Anh',
    shortName: 'Tiếng Anh',
    accentClass: 'text-indigo-700',
    barClass: 'bg-indigo-600',
  },
};

export const QUESTION_TYPE_INFO: Record<
  QuestionType,
  { name: string; shortName: string; instruction: string }
> = {
  tn: {
    name: 'Trắc nghiệm',
    shortName: 'Trắc nghiệm',
    instruction: 'Chọn một đáp án đúng nhất trong các phương án bên dưới.',
  },
  noi: {
    name: 'Nối 2 vế',
    shortName: 'Nối cặp',
    instruction: 'Chọn một mục ở cột trái rồi chọn mục tương ứng ở cột phải để ghép cặp.',
  },
  dt: {
    name: 'Điền từ',
    shortName: 'Điền từ',
    instruction: 'Nhập đáp án chính xác vào ô trống (số hoặc từ ngắn gọn).',
  },
  sx: {
    name: 'Sắp xếp',
    shortName: 'Sắp xếp',
    instruction: 'Nhấn lần lượt các thẻ để xếp đúng thứ tự từ bé đến lớn hoặc thành câu hoàn chỉnh.',
  },
  chon: {
    name: 'Chọn vào giỏ',
    shortName: 'Phân loại giỏ',
    instruction: 'Chọn từng thẻ rồi nhấn vào giỏ tương ứng (hoặc kéo thả trực tiếp vào giỏ).',
  },
};

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface BasketDefinition {
  id: string;
  label: string;
}

export interface BasketItem {
  id: string;
  text: string;
  basketId: string;
}

export interface Question {
  id: string; // e.g., l1_c1_t__tn_001
  grade: Grade;
  round: RoundLevel;
  type: QuestionType;
  subject: SubjectCode;
  topic: string;
  prompt: string;
  explanation: string;
  source: QuestionSource;
  sourceFile?: string;
  // Type-specific payloads
  // tn: multiple choice
  options?: string[];
  correctIndex?: number;
  // noi: matching pairs
  pairs?: MatchingPair[];
  // dt: fill in the blank(s)
  acceptedAnswers?: string[][]; // array per blank, each blank has list of accepted strings
  placeholders?: string[];
  // sx: ordering
  orderItems?: string[]; // shuffled or pool items
  correctOrder?: string[];
  orderDirectionLabel?: string;
  // chon: sort into baskets
  baskets?: BasketDefinition[];
  basketItems?: BasketItem[];
}

export type UserAnswer =
  | { type: 'tn'; selectedIndex: number | null }
  | { type: 'noi'; mapping: Record<string, string> } // leftPairId -> rightPairId
  | { type: 'dt'; values: string[] }
  | { type: 'sx'; ordered: string[] }
  | { type: 'chon'; placements: Record<string, string> }; // itemId -> basketId

export interface QuestionResult {
  question: Question;
  userAnswer: UserAnswer | null;
  isAnswered: boolean;
  isCorrect: boolean;
  userAnswerDisplay: string;
  correctAnswerDisplay: string;
}

export interface ExamSourceSummary {
  github: number;
  local: number;
  sample: number;
}

export interface ExamAttempt {
  id: string;
  studentName: string;
  studentId?: string;
  grade: Grade;
  round: RoundLevel;
  subjectFilter: SubjectCode | 'all';
  startedAt: string;
  completedAt: string;
  durationSeconds: number; // total allowed (e.g. 1200)
  timeSpentSeconds: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score10: number; // 0 - 10
  accuracyPercent: number; // 0 - 100
  sourceSummary: ExamSourceSummary;
  results: QuestionResult[];
  isRetryPractice?: boolean;
}

export interface LocalFileImportRecord {
  id: string;
  fileName: string;
  importedAt: string;
  questionCount: number;
  detectedSlots: string[]; // e.g., ["Lớp 4 · Khởi động"]
  warnings: string[];
  questions: Question[];
}

export interface GitHubSyncStatus {
  repoUrl: string;
  customLinks: string[];
  status: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  lastSyncedAt: string | null;
  filesLoaded: string[];
  questionCount: number;
  message: string;
}

export interface TopicStat {
  topic: string;
  subject: SubjectCode;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
}

export interface RecommendationItem {
  priority: 'high' | 'medium' | 'low';
  area: string;
  title: string;
  diagnosis: string;
  actionPlan: string;
}

export interface ImprovementReport {
  overallLevel: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Cần cố gắng';
  awardLabel: string;
  bySubject: Array<{
    subject: SubjectCode;
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
  }>;
  byType: Array<{
    type: QuestionType;
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
  }>;
  weakTopics: TopicStat[];
  recommendations: RecommendationItem[];
  speedPerQuestion: number;
  timeAdvice: string;
}
