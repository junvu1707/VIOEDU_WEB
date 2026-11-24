import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
  X,
} from 'lucide-react';
import {
  Grade,
  Question,
  ROUNDS,
  RoundLevel,
  UserAnswer,
} from '../types/vioedu';
import {
  EXAM_DURATION_SECONDS,
  formatDurationClock,
  isAnswerProvided,
} from '../utils/examEngine';
import { QuestionInteractive } from './QuestionInteractive';

interface ExamRoomViewProps {
  studentName: string;
  grade: Grade;
  round: RoundLevel;
  questions: Question[];
  durationSeconds?: number;
  isRetryPractice?: boolean;
  onSubmitExam: (
    answers: Record<string, UserAnswer>,
    timeSpentSeconds: number
  ) => void;
  onExitExam: () => void;
}

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({
  studentName,
  grade,
  round,
  questions,
  durationSeconds = EXAM_DURATION_SECONDS,
  isRetryPractice = false,
  onSubmitExam,
  onExitExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!submittedRef.current) {
            submittedRef.current = true;
            onSubmitExam(answersRef.current, durationSeconds);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [durationSeconds, onSubmitExam]);

  const currentQuestion = questions[currentIndex];
  const roundMeta = ROUNDS.find((r) => r.level === round);

  const answeredCount = questions.filter((q) =>
    isAnswerProvided(q, answers[q.id])
  ).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  const isLowTime = remainingSeconds <= 180 && remainingSeconds > 60;
  const isCriticalTime = remainingSeconds <= 60;

  const handleAnswerChange = (ans: UserAnswer) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: ans,
    }));
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const finalizeSubmission = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const spent = Math.max(1, durationSeconds - remainingSeconds);
    onSubmitExam(answers, spent);
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBEB] via-[#F0FDF4] to-[#EFF6FF] flex flex-col">
      {/* Cheerful Compact Sticky Exam Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              aria-label="Thoát phòng thi"
              className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/15 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="font-display text-sm sm:text-base font-extrabold text-white truncate">
                {studentName}
              </p>
              <p className="text-xs text-white/90 truncate">
                {isRetryPractice ? 'Luyện lại câu sai · ' : ''}Lớp {grade} ·{' '}
                {roundMeta?.roundName} ({roundMeta?.tierName})
              </p>
            </div>
          </div>

          {/* Live Countdown Timer */}
          <div
            aria-live="polite"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-mono text-base sm:text-lg font-extrabold tabular-nums shrink-0 ${
              isCriticalTime
                ? 'bg-rose-600 text-white ring-2 ring-white'
                : isLowTime
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/20 text-white backdrop-blur-xs'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatDurationClock(remainingSeconds)}</span>
            {isCriticalTime && (
              <span className="hidden md:inline font-sans text-xs font-bold">
                Sắp hết giờ
              </span>
            )}
          </div>

          {/* Progress & Submit Anytime Button */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs font-bold text-white/95 tabular-nums whitespace-nowrap">
              Đã làm {answeredCount}/{questions.length}
            </span>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="min-h-[42px] px-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-900 border-b-2 border-amber-500 text-sm font-extrabold rounded-xl inline-flex items-center gap-2 transition-all active:translate-y-px whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Competition Workspace */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Clean Question Stage — ONLY shows Question Number (no source/type/mode clutter!) */}
        <section className="lg:col-span-8 bg-white border-2 border-sky-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-amber-100">
            <span className="font-display text-lg sm:text-xl font-extrabold text-orange-600 tabular-nums">
              Câu {currentIndex + 1} / {questions.length}
            </span>

            <button
              type="button"
              onClick={toggleFlag}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                flagged[currentQuestion.id]
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>
                {flagged[currentQuestion.id] ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
              </span>
            </button>
          </div>

          {/* Question Prompt */}
          <h2 className="font-display text-lg sm:text-2xl font-extrabold text-slate-900 leading-relaxed">
            {currentQuestion.prompt}
          </h2>

          {/* Interactive Answer Surface */}
          <div className="pt-1">
            <QuestionInteractive
              key={currentQuestion.id}
              question={currentQuestion}
              answer={answers[currentQuestion.id] ?? null}
              onChange={handleAnswerChange}
            />
          </div>

          {/* Question Navigation Footer */}
          <div className="pt-6 border-t-2 border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="min-h-[46px] px-4 py-2 rounded-2xl border-2 border-b-4 border-sky-200 bg-sky-50 text-sm font-extrabold text-sky-800 hover:bg-sky-100 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-all active:translate-y-px whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                className="min-h-[46px] px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-2 border-b-4 border-emerald-700 text-white text-sm font-extrabold inline-flex items-center gap-1.5 transition-all active:translate-y-px whitespace-nowrap"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="min-h-[46px] px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 border-2 border-b-4 border-orange-700 text-white text-sm font-extrabold inline-flex items-center gap-1.5 transition-all active:translate-y-px whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Hoàn tất & Nộp bài</span>
              </button>
            )}
          </div>
        </section>

        {/* Right: Colorful Question Map Sidebar (4 cols) */}
        <aside className="lg:col-span-4 bg-white border-2 border-amber-200 rounded-3xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-extrabold text-slate-900">
              Bảng câu hỏi
            </h3>
            <span className="text-xs font-mono font-extrabold text-emerald-700 tabular-nums">
              {answeredCount}/{questions.length} đã làm
            </span>
          </div>

          {/* Colorful Progress Bar */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 transition-all duration-200 rounded-full"
              style={{
                width: `${Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%`,
              }}
            />
          </div>

          {/* Number Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isDone = isAnswerProvided(q, answers[q.id]);
              const isFlag = Boolean(flagged[q.id]);

              let btnClass =
                'bg-sky-50/70 text-slate-700 border-sky-200 hover:border-sky-400';
              if (isDone) {
                btnClass =
                  'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-600';
              }
              if (isFlag && !isDone) {
                btnClass =
                  'bg-amber-300 text-slate-900 border-amber-500 hover:bg-amber-400';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Câu ${idx + 1}${isDone ? ', đã làm' : ', chưa làm'}${
                    isFlag ? ', đã đánh dấu' : ''
                  }`}
                  className={`relative min-h-[40px] rounded-xl border-2 font-mono text-xs font-extrabold tabular-nums transition-all ${btnClass} ${
                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1 scale-105' : ''
                  }`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 border border-white"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Clear Legend */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
              <span>Đã làm ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-sky-50 border border-sky-300 shrink-0" />
              <span>Chưa làm ({unansweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-300 border border-amber-500 shrink-0" />
              <span>Xem lại ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md border-2 border-indigo-600 shrink-0" />
              <span>Đang làm</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-b-4 border-orange-700 text-white text-sm font-extrabold transition-all active:translate-y-px"
          >
            Nộp bài thi ngay
          </button>
        </aside>
      </main>

      {/* Early Submit Confirmation Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
        >
          <div className="bg-white rounded-3xl border-2 border-amber-200 max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="space-y-1.5">
              <h3
                id="submit-modal-title"
                className="font-display text-xl font-extrabold text-slate-900"
              >
                Xác nhận nộp bài thi?
              </h3>
              <p className="text-sm text-slate-600">
                Thời gian còn lại:{' '}
                <strong className="font-mono text-emerald-700 tabular-nums">
                  {formatDurationClock(remainingSeconds)}
                </strong>
                . Em vẫn có thể nộp bài ngay bây giờ để xem điểm nhé!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center bg-sky-50 rounded-2xl p-3.5">
              <div>
                <p className="text-xs font-semibold text-slate-600">Đã làm</p>
                <p className="font-mono text-lg font-extrabold text-emerald-600 tabular-nums">
                  {answeredCount}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Chưa làm</p>
                <p className="font-mono text-lg font-extrabold text-orange-600 tabular-nums">
                  {unansweredCount}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Đánh dấu</p>
                <p className="font-mono text-lg font-extrabold text-indigo-600 tabular-nums">
                  {flaggedCount}
                </p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="flex items-start gap-2.5 text-xs font-medium text-amber-950 bg-amber-50 border border-amber-300 rounded-2xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Em còn {unansweredCount} câu chưa trả lời. Nếu còn thời gian, hãy kiểm tra thêm để đạt điểm thật cao nhé!
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={finalizeSubmission}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white text-sm font-extrabold"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border-2 border-rose-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-extrabold text-slate-900">
              Rời khỏi phòng thi?
            </h3>
            <p className="text-sm text-slate-600">
              Nếu thoát ngay lúc này, bài làm hiện tại sẽ không được chấm điểm hoặc lưu vào lịch sử.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Ở lại làm tiếp
              </button>
              <button
                type="button"
                onClick={onExitExam}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 border-b-2 border-rose-700 text-white text-sm font-extrabold"
              >
                Thoát không lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
