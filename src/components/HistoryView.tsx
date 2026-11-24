import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  Lightbulb,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  ExamAttempt,
  GRADES,
  Grade,
  QUESTION_TYPE_INFO,
  QuestionType,
  ROUNDS,
  RoundLevel,
  SUBJECT_INFO,
  SubjectCode,
} from '../types/vioedu';
import { formatDurationVi } from '../utils/examEngine';

interface HistoryViewProps {
  attempts: ExamAttempt[];
  onViewAttempt: (attempt: ExamAttempt) => void;
  onDeleteAttempt: (attemptId: string) => void;
  onClearHistory: () => void;
  onStartNewExam: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  attempts,
  onViewAttempt,
  onDeleteAttempt,
  onClearHistory,
  onStartNewExam,
}) => {
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all');
  const [roundFilter, setRoundFilter] = useState<RoundLevel | 'all'>('all');

  const filtered = useMemo(() => {
    return attempts.filter((a) => {
      if (gradeFilter !== 'all' && a.grade !== gradeFilter) return false;
      if (roundFilter !== 'all' && a.round !== roundFilter) return false;
      return true;
    });
  }, [attempts, gradeFilter, roundFilter]);

  // Longitudinal statistics across filtered attempts
  const summaryStats = useMemo(() => {
    if (filtered.length === 0) {
      return {
        avgScore: 0,
        bestScore: 0,
        avgAccuracy: 0,
        totalQuestionsAnswered: 0,
      };
    }
    const avgScore =
      filtered.reduce((sum, a) => sum + a.score10, 0) / filtered.length;
    const bestScore = Math.max(...filtered.map((a) => a.score10));
    const avgAccuracy = Math.round(
      filtered.reduce((sum, a) => sum + a.accuracyPercent, 0) / filtered.length
    );
    const totalQuestionsAnswered = filtered.reduce(
      (sum, a) => sum + a.totalQuestions,
      0
    );
    return { avgScore, bestScore, avgAccuracy, totalQuestionsAnswered };
  }, [filtered]);

  // Cross-attempt cumulative mistake pattern analysis
  const cumulativeWeakness = useMemo(() => {
    const topicAcc = new Map<
      string,
      { topic: string; subject: SubjectCode; total: number; wrongOrSkip: number }
    >();
    const typeAcc = new Map<
      QuestionType,
      { type: QuestionType; total: number; correct: number }
    >();

    for (const att of filtered) {
      for (const r of att.results) {
        const key = `${r.question.subject}::${r.question.topic}`;
        const cur = topicAcc.get(key) || {
          topic: r.question.topic,
          subject: r.question.subject,
          total: 0,
          wrongOrSkip: 0,
        };
        cur.total += 1;
        if (!r.isCorrect) cur.wrongOrSkip += 1;
        topicAcc.set(key, cur);

        const tCur = typeAcc.get(r.question.type) || {
          type: r.question.type,
          total: 0,
          correct: 0,
        };
        tCur.total += 1;
        if (r.isCorrect) tCur.correct += 1;
        typeAcc.set(r.question.type, tCur);
      }
    }

    const weakestTopics = Array.from(topicAcc.values())
      .filter((t) => t.wrongOrSkip > 0)
      .sort((a, b) => b.wrongOrSkip - a.wrongOrSkip || b.wrongOrSkip / b.total - a.wrongOrSkip / a.total)
      .slice(0, 5);

    const weakestTypes = Array.from(typeAcc.values())
      .map((t) => ({
        ...t,
        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return { weakestTopics, weakestTypes };
  }, [filtered]);

  // Chronological chart points (oldest -> newest, max 12 recent)
  const chartData = useMemo(() => {
    return [...filtered].slice(0, 12).reverse();
  }, [filtered]);

  if (attempts.length === 0) {
    return (
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4">
          <BarChart3 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Chưa có lịch sử làm bài
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hoàn thành bài thi đầu tiên để hệ thống tự động lưu điểm số, vẽ biểu đồ tiến bộ và phân tích các chủ đề kiến thức em cần cải thiện.
          </p>
          <button
            type="button"
            onClick={onStartNewExam}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
          >
            Bắt đầu bài thi đầu tiên
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lịch sử điểm & Phân tích tiến bộ
          </h1>
          <p className="text-sm text-slate-600">
            Theo dõi điểm qua từng vòng thi, xem lại bài làm chi tiết và nhận diện chủ đề hay làm sai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Lọc lịch sử theo lớp"
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as Grade))
            }
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="all">Tất cả các lớp</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc lịch sử theo vòng"
            value={roundFilter}
            onChange={(e) =>
              setRoundFilter(
                e.target.value === 'all' ? 'all' : (Number(e.target.value) as RoundLevel)
              )
            }
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="all">Tất cả 5 vòng</option>
            {ROUNDS.map((r) => (
              <option key={r.level} value={r.level}>
                Cấp {r.level} · {r.roundName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClearHistory}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors"
          >
            Xóa lịch sử
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-sky-200 rounded-3xl p-5 shadow-xs">
          <p className="text-xs font-bold text-sky-700">Số lượt thi</p>
          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-1">
            {filtered.length}
          </p>
        </div>
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700">Điểm trung bình</p>
          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums mt-1">
            {summaryStats.avgScore.toFixed(1)}/10
          </p>
        </div>
        <div className="bg-white border-2 border-amber-200 rounded-3xl p-5 shadow-xs">
          <p className="text-xs font-bold text-amber-700">Điểm cao nhất</p>
          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-orange-600 tabular-nums mt-1">
            {summaryStats.bestScore.toFixed(1)}/10
          </p>
        </div>
        <div className="bg-white border-2 border-violet-200 rounded-3xl p-5 shadow-xs">
          <p className="text-xs font-bold text-violet-700">Độ chính xác TB</p>
          <p className="font-mono text-2xl sm:text-3xl font-extrabold text-violet-700 tabular-nums mt-1">
            {summaryStats.avgAccuracy}%
          </p>
        </div>
      </section>

      {/* Score Trend Chart + Cumulative Weakness Insights */}
      {filtered.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* SVG Score Progression Chart */}
          <div className="lg:col-span-7 bg-white border-2 border-emerald-200 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Biểu đồ điểm số các lần thi gần nhất</span>
              </h2>
              <span className="text-xs text-slate-500">Thang điểm 10</span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 600 220"
                className="w-full min-w-[420px] h-auto"
                role="img"
                aria-label="Biểu đồ tiến bộ điểm số các lần thi"
              >
                {/* Horizontal Grid Lines (0, 2.5, 5, 7.5, 10) */}
                {[0, 2.5, 5, 7.5, 10].map((val) => {
                  const y = 180 - (val / 10) * 150;
                  return (
                    <g key={val}>
                      <line
                        x1="44"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray={val === 0 ? undefined : '4 4'}
                      />
                      <text
                        x="36"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#64748B"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Polyline connecting attempts */}
                {chartData.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData
                      .map((att, i) => {
                        const x =
                          60 + (i / Math.max(1, chartData.length - 1)) * 500;
                        const y = 180 - (att.score10 / 10) * 150;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Data Points & Labels */}
                {chartData.map((att, i) => {
                  const x =
                    chartData.length === 1
                      ? 310
                      : 60 + (i / Math.max(1, chartData.length - 1)) * 500;
                  const y = 180 - (att.score10 / 10) * 150;
                  return (
                    <g key={att.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5.5"
                        fill="#FFFFFF"
                        stroke="#059669"
                        strokeWidth="2.5"
                      />
                      <text
                        x={x}
                        y={y - 11}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#0F172A"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {att.score10.toFixed(1)}
                      </text>
                      <text
                        x={x}
                        y="202"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748B"
                      >
                        Lần {i + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Cumulative Improvement Insights */}
          <div className="lg:col-span-5 bg-white border-2 border-amber-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>Nội dung cần ưu tiên ôn tập</span>
            </h2>

            {cumulativeWeakness.weakestTopics.length === 0 ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-4">
                Tuyệt vời! Chưa ghi nhận lỗi sai nào trong các lượt thi đang lọc.
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500">
                  Chủ đề sai nhiều nhất qua các lần thi
                </p>
                {cumulativeWeakness.weakestTopics.map((t) => (
                  <div
                    key={`${t.subject}-${t.topic}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{t.topic}</p>
                      <p className="text-slate-500">{SUBJECT_INFO[t.subject].name}</p>
                    </div>
                    <span className="font-mono font-bold text-rose-700 tabular-nums shrink-0">
                      Sai {t.wrongOrSkip}/{t.total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {cumulativeWeakness.weakestTypes.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Độ chính xác tích lũy theo dạng câu
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {cumulativeWeakness.weakestTypes.map((wt) => (
                    <div
                      key={wt.type}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-50"
                    >
                      <span className="text-slate-700 font-medium">
                        {QUESTION_TYPE_INFO[wt.type].shortName}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {wt.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Full History Table */}
      <section className="bg-white border-2 border-sky-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">
            Danh sách các lần làm bài ({filtered.length})
          </h2>
          <span className="text-xs text-slate-500">Nhấn vào từng dòng để xem chi tiết câu sai</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-3 px-4 font-semibold">Thí sinh</th>
                <th className="py-3 px-4 font-semibold">Lớp & Vòng thi</th>
                <th className="py-3 px-4 font-semibold text-right">Điểm</th>
                <th className="py-3 px-4 font-semibold text-right">Đúng / Tổng</th>
                <th className="py-3 px-4 font-semibold text-right">Thời gian</th>
                <th className="py-3 px-4 font-semibold">Ngày thi</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((att) => {
                const rMeta = ROUNDS.find((r) => r.level === att.round);
                return (
                  <tr
                    key={att.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {att.studentName}
                      {att.isRetryPractice && (
                        <span className="ml-2 text-xs font-normal text-amber-700">
                          (Ôn câu sai)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      Lớp {att.grade} · {rMeta?.roundName} ({rMeta?.tierName})
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                      {att.score10.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                      {att.correctCount}/{att.totalQuestions} ({att.accuracyPercent}%)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDurationVi(att.timeSpentSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(att.completedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewAttempt(att)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
                        >
                          <span>Chi tiết</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAttempt(att.id)}
                          aria-label="Xóa lượt thi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
