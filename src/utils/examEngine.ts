import {
  ExamAttempt,
  ExamSourceSummary,
  Grade,
  ImprovementReport,
  QUESTION_TYPE_INFO,
  Question,
  QuestionResult,
  QuestionType,
  RecommendationItem,
  RoundLevel,
  SUBJECT_INFO,
  SubjectCode,
  TopicStat,
  UserAnswer,
} from '../types/vioedu';

export const EXAM_DURATION_SECONDS = 20 * 60; // 20 minutes
export const TARGET_QUESTION_COUNT = 50;

export function shuffleArray<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeTextAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.');
}

export function isAnswerProvided(question: Question, answer: UserAnswer | null | undefined): boolean {
  if (!answer) return false;
  switch (answer.type) {
    case 'tn':
      return answer.selectedIndex !== null && answer.selectedIndex >= 0;
    case 'noi':
      return Object.keys(answer.mapping).length > 0;
    case 'dt':
      return answer.values.some((v) => v.trim().length > 0);
    case 'sx':
      return answer.ordered.length > 0;
    case 'chon':
      return Object.keys(answer.placements).length > 0;
  }
}

export function gradeQuestion(
  question: Question,
  answer: UserAnswer | null | undefined
): QuestionResult {
  const answered = isAnswerProvided(question, answer);
  let isCorrect = false;
  let userAnswerDisplay = 'Chưa trả lời';
  let correctAnswerDisplay = '';

  if (question.type === 'tn') {
    const opts = question.options || [];
    const correctIdx = question.correctIndex ?? 0;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    correctAnswerDisplay = `${letters[correctIdx] ?? ''}. ${opts[correctIdx] ?? ''}`;

    if (answer && answer.type === 'tn' && answer.selectedIndex !== null) {
      const idx = answer.selectedIndex;
      userAnswerDisplay = `${letters[idx] ?? ''}. ${opts[idx] ?? ''}`;
      isCorrect = idx === correctIdx;
    }
  } else if (question.type === 'noi') {
    const pairs = question.pairs || [];
    correctAnswerDisplay = pairs.map((p) => `${p.left} → ${p.right}`).join(' ; ');

    if (answer && answer.type === 'noi' && Object.keys(answer.mapping).length > 0) {
      const rightLookup = new Map(pairs.map((p) => [p.id, p.right]));
      const entries = pairs
        .filter((p) => answer.mapping[p.id])
        .map((p) => `${p.left} → ${rightLookup.get(answer.mapping[p.id]) ?? '?'}`);
      userAnswerDisplay = entries.length > 0 ? entries.join(' ; ') : 'Chưa nối xong';
      isCorrect =
        pairs.length > 0 &&
        pairs.every((p) => answer.mapping[p.id] === p.id);
    }
  } else if (question.type === 'dt') {
    const accepted = question.acceptedAnswers || [];
    correctAnswerDisplay = accepted.map((arr) => arr[0] ?? '').join(' / ');

    if (answer && answer.type === 'dt' && answer.values.some((v) => v.trim().length > 0)) {
      userAnswerDisplay = answer.values.map((v) => v.trim() || '(trống)').join(' / ');
      isCorrect =
        accepted.length > 0 &&
        accepted.every((validList, idx) => {
          const userNorm = normalizeTextAnswer(answer.values[idx] || '');
          if (!userNorm) return false;
          return validList.some((v) => normalizeTextAnswer(v) === userNorm);
        });
    }
  } else if (question.type === 'sx') {
    const correct = question.correctOrder || [];
    correctAnswerDisplay = correct.join('  →  ');

    if (answer && answer.type === 'sx' && answer.ordered.length > 0) {
      userAnswerDisplay = answer.ordered.join('  →  ');
      isCorrect =
        answer.ordered.length === correct.length &&
        answer.ordered.every((item, idx) => item === correct[idx]);
    }
  } else if (question.type === 'chon') {
    const baskets = question.baskets || [];
    const items = question.basketItems || [];
    const basketLabelMap = new Map(baskets.map((b) => [b.id, b.label]));

    correctAnswerDisplay = baskets
      .map((b) => {
        const list = items.filter((it) => it.basketId === b.id).map((it) => it.text);
        return `${b.label}: ${list.join(', ')}`;
      })
      .join(' | ');

    if (answer && answer.type === 'chon' && Object.keys(answer.placements).length > 0) {
      userAnswerDisplay = baskets
        .map((b) => {
          const list = items
            .filter((it) => answer.placements[it.id] === b.id)
            .map((it) => it.text);
          return `${b.label}: ${list.length > 0 ? list.join(', ') : '(trống)'}`;
        })
        .join(' | ');

      isCorrect =
        items.length > 0 &&
        items.every((it) => answer.placements[it.id] === it.basketId);
    }
  }

  return {
    question,
    userAnswer: answer ?? null,
    isAnswered: answered,
    isCorrect,
    userAnswerDisplay,
    correctAnswerDisplay,
  };
}

export function buildBalancedExamPaper(params: {
  grade: Grade;
  round: RoundLevel;
  subjectFilter: SubjectCode | 'all';
  githubQuestions: Question[];
  localQuestions: Question[];
  sampleGenerator: (grade: Grade, round: RoundLevel, count: number, subjectFilter: SubjectCode | 'all') => Question[];
  useTestModeSupplement: boolean;
  targetCount?: number;
}): { questions: Question[]; sourceSummary: ExamSourceSummary } {
  const target = params.targetCount ?? TARGET_QUESTION_COUNT;

  const matchesCriteria = (q: Question) =>
    q.grade === params.grade &&
    q.round === params.round &&
    (params.subjectFilter === 'all' || q.subject === params.subjectFilter);

  // Merge GitHub + Local questions matching exact grade & round
  const externalPool = [
    ...params.githubQuestions.filter(matchesCriteria),
    ...params.localQuestions.filter(matchesCriteria),
  ];

  // Deduplicate by ID (prefer GitHub then Local)
  const uniqueMap = new Map<string, Question>();
  for (const q of externalPool) {
    if (!uniqueMap.has(q.id)) {
      uniqueMap.set(q.id, q);
    }
  }
  const combinedExternal = Array.from(uniqueMap.values());

  // Stratified pick across the 5 question types so every exam mixes tn, noi, dt, sx, chon
  const types: QuestionType[] = ['tn', 'noi', 'dt', 'sx', 'chon'];
  const selected: Question[] = [];
  const usedIds = new Set<string>();

  const pickStratified = (pool: Question[], limit: number) => {
    const byType: Record<QuestionType, Question[]> = {
      tn: shuffleArray(pool.filter((q) => q.type === 'tn')),
      noi: shuffleArray(pool.filter((q) => q.type === 'noi')),
      dt: shuffleArray(pool.filter((q) => q.type === 'dt')),
      sx: shuffleArray(pool.filter((q) => q.type === 'sx')),
      chon: shuffleArray(pool.filter((q) => q.type === 'chon')),
    };

    // Round-robin pick to guarantee every available question type is represented
    let progressed = true;
    while (selected.length < limit && progressed) {
      progressed = false;
      for (const t of types) {
        if (selected.length >= limit) break;
        const candidate = byType[t].pop();
        if (candidate && !usedIds.has(candidate.id)) {
          usedIds.add(candidate.id);
          selected.push(candidate);
          progressed = true;
        }
      }
    }
  };

  // 1. Always prioritize GitHub + Local pool (shuffled together)
  pickStratified(combinedExternal, target);

  // 2. If fewer than target and Test Mode supplement is enabled, generate balanced test-mode questions
  if (selected.length < target && params.useTestModeSupplement) {
    const needed = target - selected.length;
    const generated = params.sampleGenerator(
      params.grade,
      params.round,
      needed + 15,
      params.subjectFilter
    );
    pickStratified(generated, target);
  }

  const finalQuestions = shuffleArray(selected).slice(0, target);
  const sourceSummary: ExamSourceSummary = {
    github: finalQuestions.filter((q) => q.source === 'github').length,
    local: finalQuestions.filter((q) => q.source === 'local').length,
    sample: finalQuestions.filter((q) => q.source === 'sample').length,
  };

  return { questions: finalQuestions, sourceSummary };
}

export function analyzeExamAttempt(attempt: ExamAttempt): ImprovementReport {
  const subjects: SubjectCode[] = ['toan', 'tieng_viet', 'toan_tieng_anh', 'tieng_anh'];
  const types: QuestionType[] = ['tn', 'noi', 'dt', 'sx', 'chon'];

  const bySubject = subjects
    .map((subj) => {
      const subset = attempt.results.filter((r) => r.question.subject === subj);
      const correct = subset.filter((r) => r.isCorrect).length;
      const skipped = subset.filter((r) => !r.isAnswered).length;
      const wrong = subset.length - correct - skipped;
      return {
        subject: subj,
        total: subset.length,
        correct,
        wrong,
        skipped,
        accuracy: subset.length > 0 ? Math.round((correct / subset.length) * 100) : 0,
      };
    })
    .filter((s) => s.total > 0);

  const byType = types
    .map((type) => {
      const subset = attempt.results.filter((r) => r.question.type === type);
      const correct = subset.filter((r) => r.isCorrect).length;
      const skipped = subset.filter((r) => !r.isAnswered).length;
      const wrong = subset.length - correct - skipped;
      return {
        type,
        total: subset.length,
        correct,
        wrong,
        skipped,
        accuracy: subset.length > 0 ? Math.round((correct / subset.length) * 100) : 0,
      };
    })
    .filter((t) => t.total > 0);

  // Group by topic
  const topicMap = new Map<string, TopicStat>();
  for (const r of attempt.results) {
    const key = `${r.question.subject}::${r.question.topic}`;
    const existing = topicMap.get(key) || {
      topic: r.question.topic,
      subject: r.question.subject,
      total: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
      accuracy: 0,
    };
    existing.total += 1;
    if (r.isCorrect) existing.correct += 1;
    else if (!r.isAnswered) existing.skipped += 1;
    else existing.wrong += 1;
    topicMap.set(key, existing);
  }

  const weakTopics = Array.from(topicMap.values())
    .map((t) => ({
      ...t,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    }))
    .filter((t) => t.wrong + t.skipped > 0)
    .sort((a, b) => a.accuracy - b.accuracy || (b.wrong + b.skipped) - (a.wrong + a.skipped));

  const recommendations: RecommendationItem[] = [];

  // 1. Weakest subject diagnosis
  const weakSubjects = [...bySubject]
    .filter((s) => s.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy);

  weakSubjects.slice(0, 2).forEach((ws) => {
    const subjectLabel = SUBJECT_INFO[ws.subject].name;
    const subjectTopics = weakTopics
      .filter((t) => t.subject === ws.subject)
      .slice(0, 3)
      .map((t) => t.topic);

    recommendations.push({
      priority: ws.accuracy < 55 ? 'high' : 'medium',
      area: `Môn ${subjectLabel}`,
      title: `Củng cố kiến thức môn ${subjectLabel} (${ws.correct}/${ws.total} câu đúng)`,
      diagnosis:
        ws.wrong > 0
          ? `Em làm sai ${ws.wrong} câu${ws.skipped > 0 ? ` và bỏ trống ${ws.skipped} câu` : ''}, tập trung nhiều ở chủ đề: ${subjectTopics.join(', ') || 'tổng hợp'}.`
          : `Em bỏ trống ${ws.skipped} câu ở môn này do chưa kịp phân bổ thời gian.`,
      actionPlan: getSubjectStudyTip(ws.subject, subjectTopics),
    });
  });

  // 2. Weakest question format diagnosis
  const weakTypes = [...byType]
    .filter((t) => t.accuracy < 75)
    .sort((a, b) => a.accuracy - b.accuracy);

  if (weakTypes.length > 0) {
    const wt = weakTypes[0];
    const typeLabel = QUESTION_TYPE_INFO[wt.type].name;
    recommendations.push({
      priority: wt.accuracy < 50 ? 'high' : 'medium',
      area: `Dạng bài ${typeLabel}`,
      title: `Rèn kỹ năng xử lý dạng "${typeLabel}" (${wt.accuracy}% chính xác)`,
      diagnosis: `Trong ${wt.total} câu dạng ${typeLabel}, em sai ${wt.wrong} câu và bỏ trống ${wt.skipped} câu.`,
      actionPlan: getQuestionTypeTip(wt.type),
    });
  }

  // 3. Unanswered / pacing diagnosis
  const speedPerQuestion =
    attempt.totalQuestions > 0
      ? Math.round(attempt.timeSpentSeconds / Math.max(1, attempt.totalQuestions - attempt.skippedCount))
      : 0;

  let timeAdvice = '';
  if (attempt.skippedCount >= 5) {
    timeAdvice = `Em còn bỏ trống ${attempt.skippedCount} câu. Nên giữ nhịp tối đa ~24 giây/câu và đánh dấu câu khó để quay lại sau.`;
    recommendations.push({
      priority: 'high',
      area: 'Chiến thuật thời gian',
      title: `Hoàn thành trọn vẹn 50 câu trong 20 phút (còn ${attempt.skippedCount} câu bỏ trống)`,
      diagnosis: `Trung bình mỗi câu có 24 giây; hiện tại em đang dừng hơi lâu ở một số câu khó nên bỏ lỡ các câu dễ phía sau.`,
      actionPlan:
        'Làm lượt 1 thật nhanh các câu nhận diện ngay được đáp án trong 15 giây, bấm "Đánh dấu" ở câu cần nháp lâu để quay lại xử lý ở 5 phút cuối.',
    });
  } else if (attempt.timeSpentSeconds < attempt.durationSeconds * 0.45 && attempt.wrongCount >= 5) {
    timeAdvice = `Em nộp bài khá sớm (${formatDurationVi(attempt.timeSpentSeconds)}) nhưng còn sai ${attempt.wrongCount} câu — hãy dành thêm 2–3 phút soát lỗi tính toán.`;
    recommendations.push({
      priority: 'medium',
      area: 'Kiểm tra lại bài',
      title: 'Dành thêm thời gian rà soát trước khi nộp bài',
      diagnosis: `Em mới dùng ${Math.round((attempt.timeSpentSeconds / attempt.durationSeconds) * 100)}% quỹ thời gian nhưng mắc ${attempt.wrongCount} lỗi sai đáng tiếc.`,
      actionPlan:
        'Trước khi bấm Nộp bài, kiểm tra lại các câu Điền từ (đơn vị, dấu phẩy thập phân) và các câu Sắp xếp/Chọn vào giỏ để tránh nhầm lẫn thao tác.',
    });
  } else {
    timeAdvice = `Tốc độ làm bài rất hợp lý (${speedPerQuestion} giây/câu đã làm). Duy trì nhịp làm bài ổn định này nhé!`;
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      area: 'Phát huy phong độ',
      title: 'Kết quả rất ấn tượng — sẵn sàng chinh phục vòng cao hơn!',
      diagnosis: `Em đạt ${attempt.accuracyPercent}% độ chính xác trên toàn đề.`,
      actionPlan:
        'Thử sức ngay ở vòng thi tiếp theo hoặc tải thêm bộ đề nâng cao từ GitHub/máy tính để tăng phản xạ tốc độ dưới 15 phút.',
    });
  }

  let overallLevel: ImprovementReport['overallLevel'] = 'Cần cố gắng';
  let awardLabel = 'Chứng nhận Hoàn thành';
  if (attempt.accuracyPercent >= 90) {
    overallLevel = 'Xuất sắc';
    awardLabel = 'Huy chương Vàng';
  } else if (attempt.accuracyPercent >= 75) {
    overallLevel = 'Giỏi';
    awardLabel = 'Huy chương Bạc';
  } else if (attempt.accuracyPercent >= 60) {
    overallLevel = 'Khá';
    awardLabel = 'Huy chương Đồng';
  }

  return {
    overallLevel,
    awardLabel,
    bySubject,
    byType,
    weakTopics,
    recommendations,
    speedPerQuestion,
    timeAdvice,
  };
}

function getSubjectStudyTip(subject: SubjectCode, topics: string[]): string {
  const topicText = topics.length > 0 ? ` (${topics.join(', ')})` : '';
  switch (subject) {
    case 'toan':
      return `Ôn kỹ công thức và thứ tự thực hiện phép tính ở các chuyên đề${topicText}. Nháp rõ từng bước rồi thử ngược lại kết quả trước khi chọn.`;
    case 'tieng_viet':
      return `Đọc kỹ ngữ cảnh câu văn, phân biệt rõ từ loại, biện pháp tu từ và chính tả ở phần${topicText}.`;
    case 'toan_tieng_anh':
      return `Ghi nhớ các từ khóa toán học tiếng Anh quan trọng (sum, difference, product, perimeter, area, fraction, divisible) kết hợp đặt phép tính như Toán tiếng Việt${topicText}.`;
    case 'tieng_anh':
      return `Chú ý dấu hiệu nhận biết thì động từ, giới từ và trật tự từ trong câu${topicText}; đọc nhẩm lại cả câu hoàn chỉnh để kiểm tra ngữ pháp.`;
  }
}

function getQuestionTypeTip(type: QuestionType): string {
  switch (type) {
    case 'tn':
      return 'Dùng phương pháp loại trừ nhanh 2 phương án sai rõ rệt trước khi tính chi tiết để tiết kiệm thời gian.';
    case 'noi':
      return 'Nối các cặp chắc chắn đúng trước để thu hẹp lựa chọn, sau đó dùng phương pháp loại trừ cho cặp khó nhất.';
    case 'dt':
      return 'Đọc kỹ yêu cầu đơn vị (cm, kg, giờ...) và kiểm tra lại chính tả, không gõ thừa ký tự hay đơn vị nếu đề đã ghi sẵn bên ngoài ô trống.';
    case 'sx':
      return 'Với dãy số, đổi cùng mẫu số hoặc giá trị thập phân trước khi xếp; với câu tiếng Việt/Anh, tìm Chủ ngữ – Động từ chính trước.';
    case 'chon':
      return 'Đọc kỹ tiêu đề từng giỏ trước khi kéo thả, kiểm tra lại từng thẻ trong giỏ xem đã thỏa mãn đúng điều kiện phân loại chưa.';
  }
}

export function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDurationVi(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s} giây`;
  if (s === 0) return `${m} phút`;
  return `${m} phút ${s} giây`;
}
