import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileJson,
  FolderUp,
  Github,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  GRADES,
  GitHubSyncStatus,
  Grade,
  LocalFileImportRecord,
  Question,
  ROUNDS,
  RoundLevel,
} from '../types/vioedu';
import {
  generateSampleJsonTemplate,
  parseQuestionsPayload,
} from '../utils/questionParser';

interface QuestionBankViewProps {
  githubQuestions: Question[];
  githubSync: GitHubSyncStatus;
  onSyncGitHub: (repoUrl?: string, customLinks?: string[]) => void;
  onUpdateGitHubConfig: (repoUrl: string, customLinks: string[]) => void;
  localFiles: LocalFileImportRecord[];
  onImportLocalFiles: (newRecords: LocalFileImportRecord[]) => void;
  onDeleteLocalFile: (fileId: string) => void;
  onClearLocalFiles: () => void;
  onJumpToExam: (grade: Grade, round: RoundLevel) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  githubQuestions,
  githubSync,
  onSyncGitHub,
  onUpdateGitHubConfig,
  localFiles,
  onImportLocalFiles,
  onDeleteLocalFile,
  onClearLocalFiles,
  onJumpToExam,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [repoInput, setRepoInput] = useState(githubSync.repoUrl);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [templateGrade, setTemplateGrade] = useState<Grade>(4);
  const [templateRound, setTemplateRound] = useState<RoundLevel>(1);

  const localQuestions = localFiles.flatMap((f) => f.questions);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const imported: LocalFileImportRecord[] = [];
    const errors: string[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed = parseQuestionsPayload(json, 'local', file.name);
        if (parsed.questions.length === 0) {
          errors.push(
            `${file.name}: không tìm thấy câu hỏi hợp lệ (${parsed.warnings[0] || 'kiểm tra cấu trúc JSON'}).`
          );
          continue;
        }
        imported.push({
          id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fileName: file.name,
          importedAt: new Date().toISOString(),
          questionCount: parsed.questions.length,
          detectedSlots: parsed.detectedSlots,
          warnings: parsed.warnings,
          questions: parsed.questions,
        });
      } catch {
        errors.push(`${file.name}: lỗi cú pháp JSON, không thể đọc file.`);
      }
    }

    if (imported.length > 0) {
      onImportLocalFiles(imported);
      const totalAdded = imported.reduce((acc, r) => acc + r.questionCount, 0);
      setUploadNotice(
        `Đã nạp thành công ${imported.length} file (${totalAdded} câu hỏi) và tự động phân loại vào đúng Lớp & Vòng.${
          errors.length > 0 ? ` Lưu ý lỗi: ${errors.join(' ')}` : ''
        }`
      );
    } else if (errors.length > 0) {
      setUploadNotice(`Không thể nạp file: ${errors.join(' ')}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFilesSelected(e.dataTransfer.files);
  };

  const handleSaveRepoAndSync = () => {
    const cleaned = repoInput.trim() || 'https://github.com/junvu1707/VIOEDU_WEB_DE';
    onUpdateGitHubConfig(cleaned, githubSync.customLinks);
    onSyncGitHub(cleaned, githubSync.customLinks);
  };

  const handleAddCustomLink = () => {
    const cleaned = newLinkInput.trim();
    if (!cleaned) return;
    if (githubSync.customLinks.includes(cleaned)) {
      setNewLinkInput('');
      return;
    }
    const nextLinks = [...githubSync.customLinks, cleaned];
    setNewLinkInput('');
    onUpdateGitHubConfig(repoInput.trim(), nextLinks);
    onSyncGitHub(repoInput.trim(), nextLinks);
  };

  const handleRemoveCustomLink = (link: string) => {
    const nextLinks = githubSync.customLinks.filter((l) => l !== link);
    onUpdateGitHubConfig(repoInput.trim(), nextLinks);
    onSyncGitHub(repoInput.trim(), nextLinks);
  };

  const handleDownloadSampleJson = () => {
    const content = generateSampleJsonTemplate(templateGrade, templateRound);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `l${templateGrade}_c${templateRound}_mau_de.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const countForSlot = (grade: Grade, round: RoundLevel) => {
    const gh = githubQuestions.filter((q) => q.grade === grade && q.round === round).length;
    const loc = localQuestions.filter((q) => q.grade === grade && q.round === round).length;
    return { gh, loc, total: gh + loc };
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Quản lý Ngân hàng đề thi
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Hệ thống tự động tải đề mới từ GitHub mỗi khi bật web và cho phép tải cùng lúc nhiều file đề JSON từ máy tính — tự động nhận diện Lớp (L1–L9), Vòng (C1–C5) và Dạng câu (tn, noi, dt, sx, chon) qua mã ID.
        </p>
      </div>

      {/* Top Two Panels: GitHub Auto-Sync & Multi-file Local Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Panel 1: GitHub Auto-Sync */}
        <section className="bg-white border-2 border-sky-200 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Github className="w-5 h-5 text-slate-800" />
                  <span>Nguồn đề ưu tiên từ GitHub</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Tự động quét mọi file .json trong kho mỗi lần mở web.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSyncGitHub(repoInput, githubSync.customLinks)}
                disabled={githubSync.status === 'loading'}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    githubSync.status === 'loading' ? 'animate-spin' : ''
                  }`}
                />
                <span>{githubSync.status === 'loading' ? 'Đang tải...' : 'Tải lại ngay'}</span>
              </button>
            </div>

            {/* Repo URL input */}
            <div className="space-y-1.5">
              <label
                htmlFor="github-repo-url"
                className="block text-xs font-semibold text-slate-700"
              >
                Đường dẫn kho GitHub
              </label>
              <div className="flex gap-2">
                <input
                  id="github-repo-url"
                  type="url"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleSaveRepoAndSync}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-400 text-xs font-semibold text-slate-800 whitespace-nowrap"
                >
                  Lưu & Quét
                </button>
              </div>
            </div>

            {/* Status Readout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-800">
                  Kết quả đồng bộ: {githubSync.questionCount} câu ({githubSync.filesLoaded.length} file)
                </span>
                {githubSync.lastSyncedAt && (
                  <span className="tabular-nums text-slate-400">
                    {new Date(githubSync.lastSyncedAt).toLocaleTimeString('vi-VN')}
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">{githubSync.message}</p>
            </div>

            {/* Optional direct JSON links per grade/round */}
            <div className="space-y-2 pt-1">
              <label
                htmlFor="custom-json-link"
                className="block text-xs font-semibold text-slate-700"
              >
                Thêm link đề JSON riêng theo lớp/vòng (tùy chọn)
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-json-link"
                  type="url"
                  value={newLinkInput}
                  onChange={(e) => setNewLinkInput(e.target.value)}
                  placeholder="https://github.com/.../blob/main/l4_c1.json"
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLink}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm link</span>
                </button>
              </div>

              {githubSync.customLinks.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {githubSync.customLinks.map((link) => (
                    <li
                      key={link}
                      className="flex items-center justify-between gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0 text-slate-700 font-mono truncate">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{link}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomLink(link)}
                        aria-label="Xóa link đề"
                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Panel 2: Local Multi-File Upload */}
        <section className="bg-white border-2 border-amber-200 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderUp className="w-5 h-5 text-emerald-600" />
                  <span>Tải nhiều file đề từ máy tính</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn nhiều file .json cùng lúc — tự nhận diện mã ID (vd: l4_c1_tn_0001) để xếp vào đúng Lớp & Vòng.
                </p>
              </div>
              {localFiles.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLocalFiles}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-slate-300 bg-slate-50/60 hover:border-emerald-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                multiple
                onChange={(e) => void handleFilesSelected(e.target.files)}
                className="hidden"
                id="local-json-upload"
              />
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-slate-900">
                Kéo thả nhiều file đề .json vào đây
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Hỗ trợ chọn cùng lúc nhiều file cho nhiều lớp và nhiều vòng khác nhau
              </p>
              <label
                htmlFor="local-json-upload"
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <FileJson className="w-4 h-4" />
                <span>Chọn file từ máy tính</span>
              </label>
            </div>

            {uploadNotice && (
              <div className="flex items-start gap-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{uploadNotice}</span>
              </div>
            )}

            {/* Uploaded Files List */}
            {localFiles.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                <p className="text-xs font-semibold text-slate-600">
                  File đã tải lên ({localFiles.length} file · {localQuestions.length} câu)
                </p>
                {localFiles.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-mono font-semibold text-slate-900 truncate">
                        {rec.fileName}
                      </p>
                      <p className="text-slate-500 truncate">
                        {rec.questionCount} câu · {rec.detectedSlots.join(' / ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteLocalFile(rec.id)}
                      aria-label={`Xóa file ${rec.fileName}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Coverage Matrix: Grade 1-9 × 5 Rounds */}
      <section className="bg-white border-2 border-emerald-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Phân bổ ngân hàng đề theo Lớp (1–9) và 5 Vòng thi
            </h2>
            <p className="text-xs text-slate-500">
              Hiển thị số câu đã nạp từ GitHub + Máy tính cho từng vòng. Nhấn vào bất kỳ ô nào để vào thi ngay vòng đó.
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            Tổng GitHub: <strong className="text-slate-900">{githubQuestions.length}</strong> · Tổng Máy:{' '}
            <strong className="text-slate-900">{localQuestions.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Khối lớp</th>
                {ROUNDS.map((r) => (
                  <th key={r.level} className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                    <div>Cấp {r.level} · {r.roundName}</div>
                    <div className="text-[11px] font-normal text-slate-500">{r.tierName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GRADES.map((g) => (
                <tr key={g} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    Lớp {g}
                  </td>
                  {ROUNDS.map((r) => {
                    const stats = countForSlot(g, r.level);
                    return (
                      <td key={r.level} className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onJumpToExam(g, r.level)}
                          title={`Vào phòng thi Lớp ${g} - ${r.roundName}`}
                          className={`w-full py-2 px-2 rounded-lg font-mono text-xs tabular-nums transition-colors ${
                            stats.total > 0
                              ? 'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          {stats.total > 0 ? `${stats.total} câu` : 'Test Mode'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* JSON Schema Spec & Downloadable Sample Template */}
      <section className="bg-white border-2 border-violet-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Chuẩn cấu trúc file JSON & Tải file mẫu cho GitHub
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Quy ước ID: <code className="font-mono font-semibold text-emerald-800">l4_c1_loại_0001</code> — trong đó{' '}
              <strong className="font-mono">l1..l9</strong> là Lớp, <strong className="font-mono">c1..c5</strong> là Vòng, và loại câu gồm{' '}
              <strong className="font-mono">tn</strong> (trắc nghiệm), <strong className="font-mono">noi</strong> (nối 2 vế),{' '}
              <strong className="font-mono">dt</strong> (điền từ), <strong className="font-mono">sx</strong> (sắp xếp),{' '}
              <strong className="font-mono">chon</strong> (chọn vào giỏ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Chọn lớp cho file mẫu"
              value={templateGrade}
              onChange={(e) => setTemplateGrade(Number(e.target.value) as Grade)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
            <select
              aria-label="Chọn vòng cho file mẫu"
              value={templateRound}
              onChange={(e) => setTemplateRound(Number(e.target.value) as RoundLevel)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
            >
              {ROUNDS.map((r) => (
                <option key={r.level} value={r.level}>
                  Cấp {r.level} · {r.roundName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownloadSampleJson}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải file JSON mẫu</span>
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
{`[
  {
    "id": "l${templateGrade}_c${templateRound}_tn_0001",
    "subject": "toan", // toan | tieng_viet | toan_tieng_anh | tieng_anh
    "topic": "Thứ tự thực hiện phép tính",
    "prompt": "Giá trị của biểu thức 125 + 75 × 2 là bao nhiêu?",
    "options": ["400", "275", "250", "350"],
    "correctIndex": 1,
    "explanation": "Tính nhân trước: 75 × 2 = 150, sau đó 125 + 150 = 275."
  }
]`}
        </pre>
      </section>
    </main>
  );
};
