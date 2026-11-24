import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExamRoomView } from './components/ExamRoomView';
import { ExamSetupView } from './components/ExamSetupView';
import { ActiveTab, Header } from './components/Header';
import { HistoryView } from './components/HistoryView';
import { LocalUploadModal } from './components/LocalUploadModal';
import { QuestionBankView } from './components/QuestionBankView';
import { ResultAnalysisView } from './components/ResultAnalysisView';
import { generateSampleQuestions } from './data/sampleBankGenerator';
import { DEFAULT_GITHUB_REPO, syncQuestionsFromGitHub } from './services/githubBank';
import {
  ExamAttempt,
  ExamSourceSummary,
  GitHubSyncStatus,
  Grade,
  IdActivationRecord,
  LocalFileImportRecord,
  Question,
  RoundLevel,
  SubjectCode,
  UserAnswer,
} from './types/vioedu';
import {
  EXAM_DURATION_SECONDS,
  TARGET_QUESTION_COUNT,
  buildBalancedExamPaper,
  gradeQuestion,
} from './utils/examEngine';
import {
  loadCustomLinks,
  loadExamHistory,
  loadGitHubRepoUrl,
  loadIdActivations,
  loadLocalFiles,
  loadStudentId,
  loadStudentName,
  saveCustomLinks,
  saveExamHistory,
  saveGitHubRepoUrl,
  saveIdActivations,
  saveLocalFiles,
  saveStudentId,
  saveStudentName,
} from './utils/storage';
import {
  createOneYearActivation,
  getActivationStatus,
  isValidAccountPass,
  parseStudentId,
} from './utils/studentId';

interface ActiveExamSession {
  studentName: string;
  studentId?: string;
  grade: Grade;
  round: RoundLevel;
  subjectFilter: SubjectCode | 'all';
  questions: Question[];
  sourceSummary: ExamSourceSummary;
  durationSeconds: number;
  startedAt: string;
  isRetryPractice: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('setup');
  const [studentName, setStudentName] = useState<string>(() => loadStudentName());
  const [studentId, setStudentId] = useState<string>(() => loadStudentId());
  const [studentPass, setStudentPass] = useState<string>(() => {
    try {
      return sessionStorage.getItem('dttt_student_pass_v1') || '';
    } catch {
      return '';
    }
  });
  const [idActivations, setIdActivations] = useState<
    Record<string, IdActivationRecord>
  >(() => loadIdActivations());

  const [selectedGrade, setSelectedGrade] = useState<Grade>(() => {
    const initialParsed = parseStudentId(loadStudentId());
    return initialParsed.grade ?? 4;
  });
  const [selectedRound, setSelectedRound] = useState<RoundLevel>(1);
  const [isLocalUploadOpen, setIsLocalUploadOpen] = useState(false);

  const parsedId = useMemo(() => parseStudentId(studentId), [studentId]);
  const isPassValid = useMemo(() => isValidAccountPass(studentPass), [studentPass]);

  // First-time activation (valid for 1 year) when student enters valid ID + Pass
  useEffect(() => {
    if (parsedId.isValid && !parsedId.isAdmin && parsedId.grade && isPassValid) {
      setIdActivations((prev) => {
        if (prev[parsedId.normalized]) return prev;
        const record = createOneYearActivation(
          parsedId.normalized,
          parsedId.grade as Grade
        );
        const next = { ...prev, [parsedId.normalized]: record };
        saveIdActivations(next);
        return next;
      });
    }
  }, [parsedId.isValid, parsedId.isAdmin, parsedId.grade, parsedId.normalized, isPassValid]);

  const currentActivation: IdActivationRecord | null = useMemo(() => {
    if (!parsedId.isValid || parsedId.isAdmin || !isPassValid) return null;
    return idActivations[parsedId.normalized] ?? null;
  }, [parsedId.isValid, parsedId.isAdmin, parsedId.normalized, isPassValid, idActivations]);

  const activationStatus = useMemo(
    () => getActivationStatus(currentActivation),
    [currentActivation]
  );

  const isIdExpired = Boolean(activationStatus?.isExpired);
  const isAdmin = parsedId.isAdmin && isPassValid;
  const isAuthenticated = parsedId.isValid && isPassValid && !isIdExpired;

  // Student IDs are strictly locked to their own grade once authenticated
  const lockedGrade: Grade | null =
    !isAdmin && isAuthenticated && parsedId.grade ? parsedId.grade : null;

  // Always enforce lockedGrade on selectedGrade
  useEffect(() => {
    if (lockedGrade !== null && selectedGrade !== lockedGrade) {
      setSelectedGrade(lockedGrade);
    }
  }, [lockedGrade, selectedGrade]);

  // Question banks
  const [githubQuestions, setGithubQuestions] = useState<Question[]>([]);
  const [githubSync, setGithubSync] = useState<GitHubSyncStatus>(() => ({
    repoUrl: loadGitHubRepoUrl(),
    customLinks: loadCustomLinks(),
    status: 'idle',
    lastSyncedAt: null,
    filesLoaded: [],
    questionCount: 0,
    message: 'Nhập đúng ID và Pass để tự động tải đề từ GitHub.',
  }));

  const [localFiles, setLocalFiles] = useState<LocalFileImportRecord[]>(() =>
    loadLocalFiles()
  );
  const localQuestions = useMemo(
    () => localFiles.flatMap((f) => f.questions),
    [localFiles]
  );

  // History & active views
  const [history, setHistory] = useState<ExamAttempt[]>(() => loadExamHistory());
  const [activeExam, setActiveExam] = useState<ActiveExamSession | null>(null);
  const [viewingAttempt, setViewingAttempt] = useState<ExamAttempt | null>(null);

  const performGitHubSync = useCallback(
    async (overrideRepo?: string, overrideLinks?: string[]) => {
      const targetRepo = overrideRepo ?? loadGitHubRepoUrl() ?? DEFAULT_GITHUB_REPO;
      const targetLinks = overrideLinks ?? loadCustomLinks();

      setGithubSync((prev) => ({
        ...prev,
        repoUrl: targetRepo,
        customLinks: targetLinks,
        status: 'loading',
        message: 'Đang tự động tải đề mới từ GitHub...',
      }));

      const { questions, status } = await syncQuestionsFromGitHub(
        targetRepo,
        targetLinks
      );
      setGithubQuestions(questions);
      setGithubSync(status);
    },
    []
  );

  // Automatically load exam bank from GitHub ONLY when ID + Pass are valid and not expired
  useEffect(() => {
    if (isAuthenticated) {
      void performGitHubSync();
    } else {
      setGithubQuestions([]);
      setGithubSync((prev) => ({
        ...prev,
        status: 'idle',
        filesLoaded: [],
        questionCount: 0,
        message: isIdExpired
          ? 'ID đã hết hạn sử dụng 1 năm.'
          : 'Nhập đúng ID và Pass để tự động tải đề từ GitHub.',
      }));
    }
  }, [isAuthenticated, isIdExpired, parsedId.normalized, performGitHubSync]);

  // Ensure non-admin users cannot stay on the Question Bank tab
  useEffect(() => {
    if (!isAdmin && activeTab === 'bank') {
      setActiveTab('setup');
    }
  }, [isAdmin, activeTab]);

  const handleStudentNameChange = (name: string) => {
    setStudentName(name);
    saveStudentName(name);
  };

  const handleStudentIdChange = (nextId: string) => {
    setStudentId(nextId);
    saveStudentId(nextId);
    const parsed = parseStudentId(nextId);
    if (parsed.grade) {
      setSelectedGrade(parsed.grade);
    }
  };

  const handleStudentPassChange = (nextPass: string) => {
    setStudentPass(nextPass);
    try {
      sessionStorage.setItem('dttt_student_pass_v1', nextPass);
    } catch {
      // ignore sessionStorage errors
    }
  };

  const handleSelectGrade = (grade: Grade) => {
    if (lockedGrade !== null && grade !== lockedGrade) return;
    setSelectedGrade(grade);
  };

  const handleResetIdActivation = (normalizedId: string) => {
    setIdActivations((prev) => {
      const next = { ...prev };
      delete next[normalizedId];
      saveIdActivations(next);
      return next;
    });
  };

  const handleUpdateGitHubConfig = (repoUrl: string, customLinks: string[]) => {
    saveGitHubRepoUrl(repoUrl);
    saveCustomLinks(customLinks);
    setGithubSync((prev) => ({
      ...prev,
      repoUrl,
      customLinks,
    }));
  };

  const handleImportLocalFiles = (newRecords: LocalFileImportRecord[]) => {
    setLocalFiles((prev) => {
      const next = [...newRecords, ...prev];
      saveLocalFiles(next);
      return next;
    });
  };

  const handleDeleteLocalFile = (fileId: string) => {
    setLocalFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId);
      saveLocalFiles(next);
      return next;
    });
  };

  const handleClearLocalFiles = () => {
    setLocalFiles([]);
    saveLocalFiles([]);
  };

  const startCompetitionExam = (
    overrideGrade?: Grade,
    overrideRound?: RoundLevel
  ) => {
    if (!isAuthenticated) return;

    const grade = lockedGrade ?? overrideGrade ?? selectedGrade;
    const round = overrideRound ?? selectedRound;
    const cleanName = studentName.trim() || 'Thí sinh nhí';
    if (!studentName.trim()) {
      handleStudentNameChange(cleanName);
    }

    const { questions, sourceSummary } = buildBalancedExamPaper({
      grade,
      round,
      subjectFilter: 'all',
      githubQuestions: isAuthenticated ? githubQuestions : [],
      localQuestions,
      sampleGenerator: generateSampleQuestions,
      useTestModeSupplement: true,
      targetCount: TARGET_QUESTION_COUNT,
    });

    if (questions.length === 0) return;

    setViewingAttempt(null);
    setActiveExam({
      studentName: cleanName,
      studentId: parsedId.normalized,
      grade,
      round,
      subjectFilter: 'all',
      questions,
      sourceSummary,
      durationSeconds: EXAM_DURATION_SECONDS,
      startedAt: new Date().toISOString(),
      isRetryPractice: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startRetryWrongPractice = (wrongQuestions: Question[]) => {
    if (wrongQuestions.length === 0) return;
    const refAttempt = viewingAttempt;
    const cleanName = refAttempt?.studentName || studentName.trim() || 'Thí sinh nhí';
    const grade = lockedGrade ?? refAttempt?.grade ?? selectedGrade;
    const round = refAttempt?.round || selectedRound;

    const sourceSummary: ExamSourceSummary = {
      github: wrongQuestions.filter((q) => q.source === 'github').length,
      local: wrongQuestions.filter((q) => q.source === 'local').length,
      sample: wrongQuestions.filter((q) => q.source === 'sample').length,
    };

    const practiceDuration = Math.min(
      EXAM_DURATION_SECONDS,
      Math.max(180, wrongQuestions.length * 30)
    );

    setViewingAttempt(null);
    setActiveExam({
      studentName: cleanName,
      studentId: refAttempt?.studentId || (parsedId.isValid ? parsedId.normalized : undefined),
      grade,
      round,
      subjectFilter: 'all',
      questions: wrongQuestions,
      sourceSummary,
      durationSeconds: practiceDuration,
      startedAt: new Date().toISOString(),
      isRetryPractice: true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitExam = useCallback(
    (answers: Record<string, UserAnswer>, timeSpentSeconds: number) => {
      if (!activeExam) return;

      const results = activeExam.questions.map((q) =>
        gradeQuestion(q, answers[q.id] ?? null)
      );

      const totalQuestions = results.length;
      const correctCount = results.filter((r) => r.isCorrect).length;
      const skippedCount = results.filter((r) => !r.isAnswered).length;
      const wrongCount = totalQuestions - correctCount - skippedCount;
      const score10 =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100) / 10
          : 0;
      const accuracyPercent =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      const attempt: ExamAttempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        studentName: activeExam.studentName,
        studentId: activeExam.studentId,
        grade: activeExam.grade,
        round: activeExam.round,
        subjectFilter: activeExam.subjectFilter,
        startedAt: activeExam.startedAt,
        completedAt: new Date().toISOString(),
        durationSeconds: activeExam.durationSeconds,
        timeSpentSeconds,
        totalQuestions,
        correctCount,
        wrongCount,
        skippedCount,
        score10,
        accuracyPercent,
        sourceSummary: activeExam.sourceSummary,
        results,
        isRetryPractice: activeExam.isRetryPractice,
      };

      setHistory((prev) => {
        const next = [attempt, ...prev];
        saveExamHistory(next);
        return next;
      });
      setActiveExam(null);
      setViewingAttempt(attempt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeExam]
  );

  const handleDeleteAttempt = (attemptId: string) => {
    setHistory((prev) => {
      const next = prev.filter((a) => a.id !== attemptId);
      saveExamHistory(next);
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveExamHistory([]);
  };

  const handleJumpToExamFromBank = (grade: Grade, round: RoundLevel) => {
    setSelectedGrade(lockedGrade ?? grade);
    setSelectedRound(round);
    setViewingAttempt(null);
    setActiveTab('setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickStartFromHeader = () => {
    if (activeTab !== 'setup' || viewingAttempt) {
      setViewingAttempt(null);
      setActiveTab('setup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!studentName.trim() || !isAuthenticated) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    startCompetitionExam();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBEB] via-[#F0FDF4] to-[#EFF6FF] text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'bank' && !isAdmin) return;
          setViewingAttempt(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onQuickStart={handleQuickStartFromHeader}
        isExamActive={Boolean(activeExam)}
        isAdmin={isAdmin}
      />

      {activeExam ? (
        <ExamRoomView
          studentName={activeExam.studentName}
          grade={activeExam.grade}
          round={activeExam.round}
          questions={activeExam.questions}
          durationSeconds={activeExam.durationSeconds}
          isRetryPractice={activeExam.isRetryPractice}
          onSubmitExam={handleSubmitExam}
          onExitExam={() => setActiveExam(null)}
        />
      ) : viewingAttempt ? (
        <ResultAnalysisView
          attempt={viewingAttempt}
          onBack={() => {
            setViewingAttempt(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onNewExam={() => {
            setViewingAttempt(null);
            setActiveTab('setup');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRetryWrongQuestions={startRetryWrongPractice}
        />
      ) : activeTab === 'setup' ? (
        <ExamSetupView
          studentName={studentName}
          onStudentNameChange={handleStudentNameChange}
          studentId={studentId}
          onStudentIdChange={handleStudentIdChange}
          studentPass={studentPass}
          onStudentPassChange={handleStudentPassChange}
          selectedGrade={selectedGrade}
          lockedGrade={lockedGrade}
          activationRecord={currentActivation}
          onSelectGrade={handleSelectGrade}
          selectedRound={selectedRound}
          onSelectRound={setSelectedRound}
          onStartExam={() => startCompetitionExam()}
          onOpenLocalUpload={() => setIsLocalUploadOpen(true)}
          onOpenHistory={() => setActiveTab('history')}
          recentAttempts={history}
          onViewAttempt={(att) => {
            setViewingAttempt(att);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : activeTab === 'bank' && isAdmin ? (
        <QuestionBankView
          githubQuestions={githubQuestions}
          githubSync={githubSync}
          onSyncGitHub={(repo, links) => void performGitHubSync(repo, links)}
          onUpdateGitHubConfig={handleUpdateGitHubConfig}
          localFiles={localFiles}
          onImportLocalFiles={handleImportLocalFiles}
          onDeleteLocalFile={handleDeleteLocalFile}
          onClearLocalFiles={handleClearLocalFiles}
          onJumpToExam={handleJumpToExamFromBank}
          idActivations={idActivations}
          onResetIdActivation={handleResetIdActivation}
        />
      ) : (
        <HistoryView
          attempts={history}
          onViewAttempt={(att) => {
            setViewingAttempt(att);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDeleteAttempt={handleDeleteAttempt}
          onClearHistory={handleClearHistory}
          onStartNewExam={() => setActiveTab('setup')}
        />
      )}

      {/* Local JSON Upload Modal triggered by "Tải đề" */}
      <LocalUploadModal
        isOpen={isLocalUploadOpen}
        onClose={() => setIsLocalUploadOpen(false)}
        localFiles={localFiles}
        onImportLocalFiles={handleImportLocalFiles}
        onDeleteLocalFile={handleDeleteLocalFile}
        onClearLocalFiles={handleClearLocalFiles}
      />

      {!activeExam && (
        <footer className="mt-auto border-t-2 border-amber-200/70 bg-white/85">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-600">
            <span>Đấu Trường Trí Tuệ · Sân chơi luyện thi Lớp 1–9</span>
            <span>Học vui mỗi ngày · Tự tin chinh phục đỉnh cao</span>
          </div>
        </footer>
      )}
    </div>
  );
}
