import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  FolderUp,
  IdCard,
  Lock,
  Trophy,
  User,
} from 'lucide-react';
import {
  ExamAttempt,
  GRADES,
  Grade,
  IdActivationRecord,
  ROUNDS,
  RoundLevel,
} from '../types/vioedu';
import {
  getActivationStatus,
  isValidAccountPass,
  parseStudentId,
} from '../utils/studentId';

const HERO_IMAGE_PATH = '/src/assets/images/hero_vioedu_arena_1795501207398.jpg';

const GRADE_STYLES: Record<Grade, { idle: string; active: string }> = {
  1: {
    idle: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-400',
    active: 'bg-rose-500 text-white border-rose-700 shadow-sm',
  },
  2: {
    idle: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-400',
    active: 'bg-orange-500 text-white border-orange-700 shadow-sm',
  },
  3: {
    idle: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-400',
    active: 'bg-amber-500 text-white border-amber-700 shadow-sm',
  },
  4: {
    idle: 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100 hover:border-lime-400',
    active: 'bg-lime-600 text-white border-lime-800 shadow-sm',
  },
  5: {
    idle: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400',
    active: 'bg-emerald-500 text-white border-emerald-700 shadow-sm',
  },
  6: {
    idle: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-400',
    active: 'bg-teal-500 text-white border-teal-700 shadow-sm',
  },
  7: {
    idle: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-400',
    active: 'bg-sky-500 text-white border-sky-700 shadow-sm',
  },
  8: {
    idle: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-400',
    active: 'bg-indigo-500 text-white border-indigo-700 shadow-sm',
  },
  9: {
    idle: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-400',
    active: 'bg-purple-500 text-white border-purple-700 shadow-sm',
  },
};

const ROUND_STYLES: Record<
  RoundLevel,
  { idle: string; active: string; subIdle: string }
> = {
  1: {
    idle: 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/70',
    active: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-700 shadow-md',
    subIdle: 'text-emerald-700',
  },
  2: {
    idle: 'bg-sky-50 text-sky-950 border-sky-200 hover:border-sky-400 hover:bg-sky-100/70',
    active: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-blue-700 shadow-md',
    subIdle: 'text-sky-700',
  },
  3: {
    idle: 'bg-violet-50 text-violet-950 border-violet-200 hover:border-violet-400 hover:bg-violet-100/70',
    active: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white border-purple-700 shadow-md',
    subIdle: 'text-violet-700',
  },
  4: {
    idle: 'bg-amber-50 text-amber-950 border-amber-200 hover:border-amber-400 hover:bg-amber-100/70',
    active: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-orange-700 shadow-md',
    subIdle: 'text-amber-700',
  },
  5: {
    idle: 'bg-rose-50 text-rose-950 border-rose-200 hover:border-rose-400 hover:bg-rose-100/70',
    active: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-700 shadow-md',
    subIdle: 'text-rose-700',
  },
};

interface ExamSetupViewProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  studentId: string;
  onStudentIdChange: (id: string) => void;
  studentPass: string;
  onStudentPassChange: (pass: string) => void;
  selectedGrade: Grade;
  lockedGrade: Grade | null;
  activationRecord: IdActivationRecord | null;
  onSelectGrade: (grade: Grade) => void;
  selectedRound: RoundLevel;
  onSelectRound: (round: RoundLevel) => void;
  onStartExam: () => void;
  onOpenLocalUpload: () => void;
  onOpenHistory: () => void;
  recentAttempts: ExamAttempt[];
  onViewAttempt: (attempt: ExamAttempt) => void;
}

export const ExamSetupView: React.FC<ExamSetupViewProps> = ({
  studentName,
  onStudentNameChange,
  studentId,
  onStudentIdChange,
  studentPass,
  onStudentPassChange,
  selectedGrade,
  lockedGrade,
  activationRecord,
  onSelectGrade,
  selectedRound,
  onSelectRound,
  onStartExam,
  onOpenLocalUpload,
  onOpenHistory,
  recentAttempts,
  onViewAttempt,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [idError, setIdError] = useState(false);
  const [passError, setPassError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const parsedId = parseStudentId(studentId);
  const passValid = isValidAccountPass(studentPass);
  const activationStatus = getActivationStatus(activationRecord);
  const isExpired = Boolean(activationStatus?.isExpired);
  const activeRoundMeta = ROUNDS.find((r) => r.level === selectedRound) || ROUNDS[0];

  const handleStartClick = () => {
    const missingName = !studentName.trim();
    const invalidId = !parsedId.isValid;
    const invalidPass = !passValid;

    setNameError(missingName);
    setIdError(invalidId);
    setPassError(invalidPass);

    if (missingName || invalidId || invalidPass || isExpired) {
      return;
    }
    onStartExam();
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Main 2-column setup split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Colorful Kid-Friendly Student Setup (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-amber-200/90 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-7 shadow-sm">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-orange-600">
              Sân chơi trí tuệ vui nhộn · Lớp 1 đến Lớp 9
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
              Cùng chinh phục Đấu Trường Trí Tuệ nào!
            </h1>
          </div>

          {/* Step 1: Tên bé, ID & Pass */}
          <div className="space-y-2.5">
            <span className="block text-sm font-bold text-slate-800">
              1. Thông tin thí sinh
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Tên bé */}
              <div className="sm:col-span-5 space-y-1.5">
                <label
                  htmlFor="student-name-input"
                  className="block text-xs font-bold text-sky-700"
                >
                  Tên bé
                </label>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="w-4 h-4 text-sky-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    id="student-name-input"
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      onStudentNameChange(e.target.value);
                      if (nameError && e.target.value.trim()) setNameError(false);
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm sm:text-base bg-sky-50/50 border-2 rounded-2xl text-slate-900 font-medium transition-colors focus:bg-white ${
                      nameError
                        ? 'border-rose-500 ring-2 ring-rose-100'
                        : 'border-sky-200 focus:border-sky-500'
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="text-xs font-semibold text-rose-600">
                    Vui lòng nhập tên bé.
                  </p>
                )}
              </div>

              {/* ID */}
              <div className="sm:col-span-4 space-y-1.5">
                <label
                  htmlFor="student-id-input"
                  className="block text-xs font-bold text-violet-700"
                >
                  ID
                </label>
                <div className="relative">
                  <IdCard
                    aria-hidden="true"
                    className="w-4 h-4 text-violet-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    id="student-id-input"
                    type="text"
                    value={studentId}
                    onChange={(e) => {
                      onStudentIdChange(e.target.value);
                      if (idError) setIdError(false);
                    }}
                    autoComplete="off"
                    className={`w-full pl-10 pr-3.5 py-3 text-sm sm:text-base font-mono bg-violet-50/50 border-2 rounded-2xl text-slate-900 font-bold transition-colors focus:bg-white ${
                      idError || isExpired || (studentId.trim().length > 0 && !parsedId.isValid)
                        ? 'border-rose-400 focus:border-rose-500'
                        : parsedId.isValid && passValid
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-violet-200 focus:border-violet-500'
                    }`}
                  />
                </div>
                {isExpired && activationStatus ? (
                  <p className="text-xs font-semibold text-rose-600">
                    Hết hạn ({activationStatus.expiresDateStr})
                  </p>
                ) : parsedId.isValid && passValid ? (
                  <p className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {parsedId.isAdmin
                        ? 'Quyền Quản trị'
                        : activationStatus
                        ? `Lớp ${parsedId.grade} · Hạn ${activationStatus.expiresDateStr}`
                        : `Lớp ${parsedId.grade}`}
                    </span>
                  </p>
                ) : idError || (studentId.trim().length > 0 && !parsedId.isValid) ? (
                  <p className="text-xs font-semibold text-rose-600">
                    Vui lòng nhập đúng ID.
                  </p>
                ) : null}
              </div>

              {/* Pass */}
              <div className="sm:col-span-3 space-y-1.5">
                <label
                  htmlFor="student-pass-input"
                  className="block text-xs font-bold text-amber-700"
                >
                  Pass
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    id="student-pass-input"
                    type={showPass ? 'text' : 'password'}
                    value={studentPass}
                    onChange={(e) => {
                      onStudentPassChange(e.target.value);
                      if (passError && isValidAccountPass(e.target.value)) {
                        setPassError(false);
                      }
                    }}
                    autoComplete="current-password"
                    className={`w-full pl-9 pr-9 py-3 text-sm sm:text-base font-mono bg-amber-50/50 border-2 rounded-2xl text-slate-900 font-bold transition-colors focus:bg-white ${
                      passError || (studentPass.trim().length > 0 && !passValid)
                        ? 'border-rose-400 focus:border-rose-500'
                        : passValid
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-amber-200 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passError ? (
                  <p className="text-xs font-semibold text-rose-600">
                    Sai mật khẩu.
                  </p>
                ) : passValid ? (
                  <p className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Hợp lệ</span>
                  </p>
                ) : null}
              </div>
            </div>

            {isExpired && activationStatus && (
              <div className="flex items-start gap-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl p-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Tài khoản ID <span className="font-mono">{parsedId.normalized}</span> đã hết thời hạn 1 năm kể từ ngày kích hoạt ({activationStatus.activatedDateStr} – {activationStatus.expiresDateStr}).
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Lớp (locked strictly to student's ID grade for 1 year) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-slate-800">2. Lớp</span>
              {lockedGrade !== null && activationStatus ? (
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  Chỉ dùng Lớp {lockedGrade} · Hạn dùng 1 năm đến {activationStatus.expiresDateStr}
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">
                  {selectedGrade <= 5 ? 'Khối Tiểu học' : 'Khối THCS'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {GRADES.map((g) => {
                const active = selectedGrade === g;
                const isLockedOther = lockedGrade !== null && lockedGrade !== g;
                const styles = GRADE_STYLES[g];
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={isLockedOther}
                    onClick={() => {
                      if (!isLockedOther) onSelectGrade(g);
                    }}
                    title={
                      isLockedOther
                        ? `ID hiện tại chỉ dùng cho Lớp ${lockedGrade}`
                        : `Chọn Lớp ${g}`
                    }
                    className={`min-h-[46px] px-2 py-2 rounded-2xl border-2 border-b-4 text-sm font-extrabold transition-all tabular-nums whitespace-nowrap flex items-center justify-center gap-1 ${
                      isLockedOther
                        ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                        : active
                        ? `${styles.active} active:translate-y-px`
                        : `${styles.idle} active:translate-y-px`
                    }`}
                  >
                    {isLockedOther && <Lock className="w-3 h-3 shrink-0" />}
                    <span>Lớp {g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Chọn vòng thi */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-bold text-slate-800">
                3. Vòng thi
              </span>
              <span className="text-xs font-semibold text-purple-700">
                Cấp {activeRoundMeta.level} · {activeRoundMeta.tierName}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {ROUNDS.map((r) => {
                const active = selectedRound === r.level;
                const styles = ROUND_STYLES[r.level];
                return (
                  <button
                    key={r.level}
                    type="button"
                    onClick={() => onSelectRound(r.level)}
                    className={`min-h-[78px] p-3 rounded-2xl border-2 border-b-4 text-left transition-all flex flex-col justify-between active:translate-y-px ${
                      active ? styles.active : styles.idle
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold ${
                        active ? 'text-white/90' : styles.subIdle
                      }`}
                    >
                      Cấp {r.level} · {r.tierName.replace('Vòng ', '')}
                    </span>
                    <span className="text-sm font-extrabold leading-snug">
                      {r.roundName}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-600">{activeRoundMeta.description}</p>
          </div>
        </div>

        {/* Right: Cheerful Artwork + Clean Action Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-sky-200/90 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm">
          {/* Editorial Artwork Header */}
          <div className="relative h-60 sm:h-64 bg-amber-50 overflow-hidden shrink-0">
            {!imgFailed ? (
              <img
                src={HERO_IMAGE_PATH}
                alt="Không gian học tập vui nhộn Đấu Trường Trí Tuệ"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 via-emerald-100 to-sky-100 flex flex-col items-center justify-center p-6 text-center">
                <Trophy className="w-12 h-12 text-amber-500 mb-2" />
                <span className="font-display font-bold text-slate-800">
                  Đấu Trường Trí Tuệ
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent flex items-end p-5">
              <div className="text-white">
                <p className="text-xs font-bold text-amber-300">
                  Lớp {selectedGrade} · Cấp {selectedRound} ({activeRoundMeta.tierName})
                </p>
                <p className="font-display text-2xl font-extrabold leading-tight">
                  Vòng {activeRoundMeta.roundName}
                </p>
              </div>
            </div>
          </div>

          {/* Clean Start & Local Upload Actions */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
            <div className="bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 border-2 border-emerald-200/70 rounded-2xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-emerald-700">
                {activationStatus && !isExpired && lockedGrade !== null
                  ? `Hiệu lực đến ${activationStatus.expiresDateStr} (còn ${activationStatus.daysLeft} ngày)`
                  : 'Sẵn sàng vào phòng thi'}
              </p>
              <p className="font-display text-lg font-extrabold text-slate-900">
                Lớp {selectedGrade} · {activeRoundMeta.roundName}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeRoundMeta.description}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStartClick}
                disabled={isExpired}
                className="w-full min-h-[54px] px-5 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-base font-extrabold rounded-2xl border-b-4 border-orange-700 disabled:border-slate-400 flex items-center justify-center gap-2 transition-all active:translate-y-px shadow-sm"
              >
                <span>{isExpired ? 'ID đã hết hạn sử dụng' : 'Bắt đầu làm bài'}</span>
                {!isExpired && <ArrowRight className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={onOpenLocalUpload}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 hover:border-sky-400 text-sky-800 text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <FolderUp className="w-4 h-4" />
                <span>Tải đề</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Attempts Strip if history exists */}
      {recentAttempts.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Bảng thành tích gần đây
              </h2>
              <p className="text-xs text-slate-600">
                Nhấn vào từng lượt thi để xem chi tiết câu làm sai và gợi ý ôn tập.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-sm font-bold text-sky-600 hover:text-sky-800 whitespace-nowrap"
            >
              Xem toàn bộ lịch sử
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAttempts.slice(0, 3).map((att) => {
              const rMeta = ROUNDS.find((r) => r.level === att.round);
              return (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => onViewAttempt(att)}
                  className="text-left bg-white border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl p-4 transition-all space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate font-bold text-slate-800">
                      {att.studentName}
                      {att.studentId ? ` (${att.studentId})` : ''}
                    </span>
                    <span className="tabular-nums shrink-0">
                      {new Date(att.completedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Lớp {att.grade} · {rMeta?.roundName} ({rMeta?.tierName})
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-mono font-extrabold text-emerald-700 tabular-nums">
                      {att.correctCount}/{att.totalQuestions} câu ({att.score10.toFixed(1)} điểm)
                    </span>
                    <span className="font-semibold text-orange-600 tabular-nums">
                      {att.accuracyPercent}% đúng
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};
