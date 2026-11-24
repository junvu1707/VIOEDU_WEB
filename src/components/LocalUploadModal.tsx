import React, { useRef, useState } from 'react';
import { CheckCircle2, FileJson, Trash2, Upload, X } from 'lucide-react';
import { LocalFileImportRecord } from '../types/vioedu';
import { parseQuestionsPayload } from '../utils/questionParser';

interface LocalUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  localFiles: LocalFileImportRecord[];
  onImportLocalFiles: (newRecords: LocalFileImportRecord[]) => void;
  onDeleteLocalFile: (fileId: string) => void;
  onClearLocalFiles: () => void;
}

export const LocalUploadModal: React.FC<LocalUploadModalProps> = ({
  isOpen,
  onClose,
  localFiles,
  onImportLocalFiles,
  onDeleteLocalFile,
  onClearLocalFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setNotice(null);
    setErrorMsg(null);

    const imported: LocalFileImportRecord[] = [];
    const errors: string[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed = parseQuestionsPayload(json, 'local', file.name);
        if (parsed.questions.length === 0) {
          errors.push(`${file.name}: không đúng định dạng đề thi.`);
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
        errors.push(`${file.name}: file JSON không hợp lệ.`);
      }
    }

    if (imported.length > 0) {
      onImportLocalFiles(imported);
      setNotice(
        `Đã tải lên thành công ${imported.length} file đề và tự động xếp vào đúng lớp, vòng thi.`
      );
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(' '));
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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="local-upload-title"
    >
      <div className="bg-white rounded-3xl border-2 border-amber-200 max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="local-upload-title"
            className="font-display text-xl font-extrabold text-slate-900"
          >
            Tải đề từ máy tính
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ tải đề"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              : 'border-sky-300 bg-sky-50/40 hover:border-sky-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            multiple
            onChange={(e) => void handleFilesSelected(e.target.files)}
            className="hidden"
            id="modal-local-json-upload"
          />
          <Upload className="w-9 h-9 text-sky-600 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-900">
            Kéo thả nhiều file đề (.json) vào đây
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Hệ thống tự động nhận diện và xếp file vào đúng lớp và vòng thi
          </p>
          <label
            htmlFor="modal-local-json-upload"
            className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white text-sm font-extrabold cursor-pointer transition-all active:translate-y-px"
          >
            <FileJson className="w-4 h-4" />
            <span>Chọn file từ máy</span>
          </label>
        </div>

        {notice && (
          <div className="flex items-start gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl p-3">
            {errorMsg}
          </div>
        )}

        {localFiles.length > 0 && (
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                File đề đã nạp ({localFiles.length} file)
              </span>
              <button
                type="button"
                onClick={onClearLocalFiles}
                className="text-xs font-bold text-rose-600 hover:text-rose-800"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="space-y-2">
              {localFiles.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono font-bold text-slate-900 truncate">
                      {rec.fileName}
                    </p>
                    <p className="text-slate-600 truncate">
                      {rec.detectedSlots.join(' · ')}
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
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
