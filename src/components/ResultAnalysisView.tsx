import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lightbulb,
  MinusCircle,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  ExamAttempt,
  QUESTION_TYPE_INFO,
  Question,
  ROUNDS,
  SUBJECT_INFO,
  SubjectCode,
} from '../types/vioedu';
import { analyzeExamAttempt, formatDurationVi } from '../utils/examEngine';

const TROPHY_IMAGE_PATH = '/src/assets/images/trophy_study_celebration_1795501207235.jpg';

interface ResultAnalysisViewProps {
  attempt: ExamAttempt;
  onBack: () => void;
  onNewExam: () => void;
  onRetryWrongQuestions: (wrongQuestions: Question[]) => void;
}

type DetailFilter = 'all' | 'wrong' | 'skipped' | 'correct';

export const ResultAnalysisView: React.FC<ResultAnalysisViewProps> = ({
  attempt,
  onBack,
  onNewExam,
  onRetryWrongQuestions,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [detailFilter, setDetailFilter] = useState<DetailFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<SubjectCode | 'all'>('all');

  const report = useMemo(() => analyzeExamAttempt(attempt), [attempt]);
  const roundMeta = ROUNDS.find((r) => r.level === attempt.round);

  const wrongAndSkippedQuestions = useMemo(
    () => attempt.results.filter((r) => !r.isCorrect).map((r) => r.question),
    [attempt.results]
  );

  const filteredResults = useMemo(() => {
    return attempt.results.filter((r) => {
      if (subjectFilter !== 'all' && r.question.subject !== subjectFilter) return false;
      if (detailFilter === 'wrong') return r.isAnswered && !r.isCorrect;
      if (detailFilter === 'skipped') return !r.isAnswered;
      if (detailFilter === 'correct') return r.isCorrect;
      return true;
    });
  }, [attempt.results, detailFilter, subjectFilter]);

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {wrongAndSkippedQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => onRetryWrongQuestions(wrongAndSkippedQuestions)}
              className="min-h-[44px] px-4 py-2 rounded-2xl border-2 border-b-4 border-amber-500 bg-amber-300 hover:bg-amber-200 text-slate-900 text-sm font-extrabold inline-flex items-center gap-2 transition-all active:translate-y-px whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại {wrongAndSkippedQuestions.length} câu chưa đúng</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNewExam}
            className="min-h-[44px] px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-b-4 border-emerald-700 text-white text-sm font-extrabold transition-all active:translate-y-px whitespace-nowrap"
          >
            Thi bộ đề mới
          </button>
        </div>
      </div>

      {/* Achievement Hero Summary */}
      <section className="bg-white border-2 border-amber-200 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-700">{report.awardLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Lớp {attempt.grade}</span>
              <span aria-hidden="true">·</span>
              <span>
                Cấp {attempt.round} — {roundMeta?.roundName} ({roundMeta?.tierName})
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(attempt.completedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
              Kết quả thi của {attempt.studentName}
            </h1>
            <p className="text-sm text-slate-600">{report.timeAdvice}</p>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <dt className="text-xs text-slate-500">Điểm quy đổi</dt>
              <dd className="font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-1">
                {attempt.score10.toFixed(1)}/10
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Số câu đúng</dt>
              <dd className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums mt-1">
                {attempt.correctCount}/{attempt.totalQuestions}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Sai / Bỏ trống</dt>
              <dd className="font-mono text-2xl sm:text-3xl font-bold text-rose-700 tabular-nums mt-1">
                {attempt.wrongCount} / {attempt.skippedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Thời gian làm</dt>
              <dd className="font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums mt-2">
                {formatDurationVi(attempt.timeSpentSeconds)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-4 bg-amber-50/40 border-t lg:border-t-0 lg:border-l border-slate-200 relative min-h-[220px]">
          {!imgFailed ? (
            <img
              src={TROPHY_IMAGE_PATH}
              alt="Cúp thành tích Đấu Trường Trí Tuệ"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <Trophy className="w-14 h-14 text-amber-500 mb-2" />
              <p className="font-display font-bold text-slate-900">{report.awardLabel}</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 via-slate-900/30 to-transparent p-4 text-white">
            <p className="text-xs text-amber-200 font-medium">Xếp loại: {report.overallLevel}</p>
            <p className="font-mono text-lg font-bold tabular-nums">
              {attempt.accuracyPercent}% chính xác
            </p>
          </div>
        </div>
      </section>

      {/* Breakdown by Subject & Question Type */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Subject */}
        <div className="bg-white border-2 border-sky-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
              Phân tích theo môn học
            </h2>
            <span className="text-xs text-slate-500">Đúng / Tổng số câu</span>
          </div>
          <div className="space-y-4">
            {report.bySubject.map((item) => {
              const info = SUBJECT_INFO[item.subject];
              return (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{info.name}</span>
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.correct}/{item.total} câu ·{' '}
                      <strong className="text-slate-900">{item.accuracy}%</strong>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${info.barClass}`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                  {(item.wrong > 0 || item.skipped > 0) && (
                    <p className="text-xs text-slate-500 tabular-nums">
                      Làm sai: {item.wrong} · Bỏ trống: {item.skipped}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* By Question Type */}
        <div className="bg-white border-2 border-violet-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
              Phân tích theo dạng câu hỏi
            </h2>
            <span className="text-xs text-slate-500">5 dạng tương tác</span>
          </div>
          <div className="space-y-4">
            {report.byType.map((item) => {
              const info = QUESTION_TYPE_INFO[item.type];
              const barColor =
                item.accuracy >= 80
                  ? 'bg-emerald-600'
                  : item.accuracy >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-600';
              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">
                      {info.name}{' '}
                      <span className="font-mono text-xs text-slate-400">({item.type})</span>
                    </span>
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {item.correct}/{item.total} câu ·{' '}
                      <strong className="text-slate-900">{item.accuracy}%</strong>
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deep Mistake Diagnosis & Improvement Recommendations */}
      <section className="bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Phân tích nội dung sai & Gợi ý phần cần cải thiện</span>
            </h2>
            <p className="text-sm text-slate-600">
              Hệ thống tổng hợp tự động dựa trên các câu làm sai, câu bỏ trống và tốc độ xử lý bài thi của em.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Trung bình ~{report.speedPerQuestion} giây / câu đã làm</span>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.recommendations.map((rec, idx) => {
            const priorityText =
              rec.priority === 'high'
                ? 'Ưu tiên cao'
                : rec.priority === 'medium'
                ? 'Cần cải thiện'
                : 'Duy trì tốt';
            const priorityColor =
              rec.priority === 'high'
                ? 'text-rose-700'
                : rec.priority === 'medium'
                ? 'text-amber-700'
                : 'text-emerald-700';

            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">{rec.area}</span>
                  <span className={`font-semibold ${priorityColor}`}>{priorityText}</span>
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {rec.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <strong className="font-semibold text-slate-800">Nhận xét:</strong>{' '}
                  {rec.diagnosis}
                </p>
                <p className="text-xs sm:text-sm text-emerald-900 bg-emerald-50/70 rounded-lg p-3 leading-relaxed">
                  <strong className="font-semibold">Cách cải thiện:</strong> {rec.actionPlan}
                </p>
              </div>
            );
          })}
        </div>

        {/* Specific Weak Topics Table */}
        {report.weakTopics.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-600" />
              <span>Các chủ đề kiến thức có câu sai / bỏ trống</span>
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="py-3 px-4 font-semibold">Chủ đề kiến thức</th>
                    <th className="py-3 px-4 font-semibold">Môn học</th>
                    <th className="py-3 px-4 font-semibold text-right">Đúng</th>
                    <th className="py-3 px-4 font-semibold text-right">Sai</th>
                    <th className="py-3 px-4 font-semibold text-right">Bỏ trống</th>
                    <th className="py-3 px-4 font-semibold text-right">Tỷ lệ đúng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.weakTopics.slice(0, 10).map((t) => (
                    <tr key={`${t.subject}-${t.topic}`} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{t.topic}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {SUBJECT_INFO[t.subject].name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                        {t.correct}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-semibold">
                        {t.wrong}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700">
                        {t.skipped}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {t.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Full Per-Question Detailed Review */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              Chi tiết từng câu làm bài ({filteredResults.length}/{attempt.totalQuestions})
            </h2>
            <p className="text-xs text-slate-500">
              Đối chiếu câu trả lời của em với đáp án đúng và lời giải chi tiết.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status segmented filter */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'all', label: `Tất cả (${attempt.totalQuestions})` },
                  { id: 'wrong', label: `Làm sai (${attempt.wrongCount})` },
                  { id: 'skipped', label: `Bỏ trống (${attempt.skippedCount})` },
                  { id: 'correct', label: `Đúng (${attempt.correctCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    detailFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Lọc theo môn học"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as SubjectCode | 'all')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="all">Tất cả môn học</option>
              <option value="toan">Toán</option>
              <option value="tieng_viet">Tiếng Việt</option>
              <option value="toan_tieng_anh">Toán bằng tiếng Anh</option>
              <option value="tieng_anh">Tiếng Anh</option>
            </select>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">
            Không có câu hỏi nào thuộc bộ lọc đang chọn.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((res) => {
              const originalIndex = attempt.results.indexOf(res) + 1;
              const subj = SUBJECT_INFO[res.question.subject];
              const qType = QUESTION_TYPE_INFO[res.question.type];

              return (
                <article
                  key={`${res.question.id}-${originalIndex}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        Câu {String(originalIndex).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${subj.accentClass}`}>
                        {subj.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{qType.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{res.question.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-400">{res.question.id}</span>
                    </div>

                    {res.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Chính xác
                      </span>
                    ) : !res.isAnswered ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                        <MinusCircle className="w-4 h-4" />
                        Bỏ trống
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                        <XCircle className="w-4 h-4" />
                        Làm sai
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {res.question.prompt}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div
                      className={`p-3 rounded-xl border ${
                        res.isCorrect
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-rose-50/60 border-rose-200'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Câu trả lời của em
                      </p>
                      <p className="font-medium text-slate-900 break-words">
                        {res.userAnswerDisplay}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Đáp án đúng
                      </p>
                      <p className="font-semibold text-emerald-800 break-words">
                        {res.correctAnswerDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50/80 rounded-xl p-3.5">
                    <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="font-semibold text-slate-900">Giải thích:</strong>{' '}
                      {res.question.explanation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};
