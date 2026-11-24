import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Link2,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { Question, UserAnswer } from '../types/vioedu';

interface QuestionInteractiveProps {
  question: Question;
  answer: UserAnswer | null;
  onChange: (answer: UserAnswer) => void;
}

function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.length >= 2 && arr.every((val, idx) => val === items[idx])) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

const OPTION_THEMES = [
  {
    letterBg: 'bg-sky-500 text-white',
    idle: 'bg-sky-50/60 border-sky-200 hover:border-sky-400 hover:bg-sky-50',
    selected: 'bg-sky-100 border-sky-500 ring-2 ring-sky-300',
  },
  {
    letterBg: 'bg-emerald-500 text-white',
    idle: 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
    selected: 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-300',
  },
  {
    letterBg: 'bg-amber-500 text-white',
    idle: 'bg-amber-50/60 border-amber-200 hover:border-amber-400 hover:bg-amber-50',
    selected: 'bg-amber-100 border-amber-500 ring-2 ring-amber-300',
  },
  {
    letterBg: 'bg-rose-500 text-white',
    idle: 'bg-rose-50/60 border-rose-200 hover:border-rose-400 hover:bg-rose-50',
    selected: 'bg-rose-100 border-rose-500 ring-2 ring-rose-300',
  },
  {
    letterBg: 'bg-violet-500 text-white',
    idle: 'bg-violet-50/60 border-violet-200 hover:border-violet-400 hover:bg-violet-50',
    selected: 'bg-violet-100 border-violet-500 ring-2 ring-violet-300',
  },
];

const PAIR_ACCENTS = [
  'bg-emerald-100 border-emerald-500 text-emerald-950',
  'bg-sky-100 border-sky-500 text-sky-950',
  'bg-amber-100 border-amber-500 text-amber-950',
  'bg-violet-100 border-violet-500 text-violet-950',
  'bg-rose-100 border-rose-500 text-rose-950',
];

const BASKET_THEMES = [
  {
    border: 'border-sky-300 bg-sky-50/50',
    active: 'border-sky-500 bg-sky-100/70',
    header: 'text-sky-900 border-sky-200',
    chip: 'bg-sky-500 text-white border-sky-700',
  },
  {
    border: 'border-orange-300 bg-orange-50/50',
    active: 'border-orange-500 bg-orange-100/70',
    header: 'text-orange-900 border-orange-200',
    chip: 'bg-orange-500 text-white border-orange-700',
  },
  {
    border: 'border-violet-300 bg-violet-50/50',
    active: 'border-violet-500 bg-violet-100/70',
    header: 'text-violet-900 border-violet-200',
    chip: 'bg-violet-500 text-white border-violet-700',
  },
];

const TILE_COLORS = [
  'bg-sky-500 border-sky-700 text-white hover:bg-sky-600',
  'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-600',
  'bg-amber-500 border-amber-700 text-white hover:bg-amber-600',
  'bg-violet-500 border-violet-700 text-white hover:bg-violet-600',
  'bg-rose-500 border-rose-700 text-white hover:bg-rose-600',
];

export const QuestionInteractive: React.FC<QuestionInteractiveProps> = ({
  question,
  answer,
  onChange,
}) => {
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [selectedBasketItemId, setSelectedBasketItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const shuffledRightPairs = useMemo(() => {
    if (question.type !== 'noi' || !question.pairs) return [];
    return deterministicShuffle(question.pairs, question.id);
  }, [question.id, question.pairs, question.type]);

  const sxPool = useMemo(() => {
    if (question.type !== 'sx') return [];
    return deterministicShuffle(
      question.orderItems || question.correctOrder || [],
      `${question.id}_sx`
    );
  }, [question.id, question.orderItems, question.correctOrder, question.type]);

  // ------------------------------------------------------------------
  // 1. TRẮC NGHIỆM (tn)
  // ------------------------------------------------------------------
  if (question.type === 'tn') {
    const options = question.options || [];
    const selectedIndex = answer && answer.type === 'tn' ? answer.selectedIndex : null;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup">
        {options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
          return (
            <button
              key={idx}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange({ type: 'tn', selectedIndex: idx })}
              className={`min-h-[62px] p-4 rounded-2xl border-2 border-b-4 text-left flex items-center gap-3.5 transition-all active:translate-y-px ${
                isSelected ? theme.selected : theme.idle
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 font-mono shadow-xs ${theme.letterBg}`}
              >
                {letters[idx] ?? idx + 1}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug flex-1">
                {opt}
              </span>
              {isSelected && (
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. NỐI 2 VẾ (noi)
  // ------------------------------------------------------------------
  if (question.type === 'noi') {
    const pairs = question.pairs || [];
    const mapping: Record<string, string> =
      answer && answer.type === 'noi' ? answer.mapping : {};

    const assignedLeftIds = pairs.map((p) => p.id).filter((id) => Boolean(mapping[id]));
    const getPairNumberForLeft = (leftId: string) => {
      const idx = assignedLeftIds.indexOf(leftId);
      return idx >= 0 ? idx + 1 : null;
    };
    const getLeftIdForRight = (rightId: string) =>
      Object.keys(mapping).find((lId) => mapping[lId] === rightId) || null;

    const handleLeftClick = (leftId: string) => {
      setActiveLeftId((prev) => (prev === leftId ? null : leftId));
    };

    const handleRightClick = (rightId: string) => {
      const existingLeft = getLeftIdForRight(rightId);
      if (!activeLeftId) {
        if (existingLeft) {
          const next = { ...mapping };
          delete next[existingLeft];
          onChange({ type: 'noi', mapping: next });
        }
        return;
      }

      const next = { ...mapping };
      if (existingLeft) {
        delete next[existingLeft];
      }
      next[activeLeftId] = rightId;
      onChange({ type: 'noi', mapping: next });
      setActiveLeftId(null);
    };

    const handleClearOne = (leftId: string) => {
      const next = { ...mapping };
      delete next[leftId];
      onChange({ type: 'noi', mapping: next });
    };

    const handleResetAll = () => {
      setActiveLeftId(null);
      onChange({ type: 'noi', mapping: {} });
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-sky-900 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-2.5">
          <span>
            {activeLeftId
              ? 'Tuyệt! Bây giờ em hãy nhấn vào ô tương ứng bên phải để nối nhé.'
              : 'Nhấn chọn một ô bên trái rồi nhấn ô khớp bên phải để nối thành cặp.'}
          </span>
          {Object.keys(mapping).length > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nối lại
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-sky-700">Cột trái</p>
            {pairs.map((p) => {
              const pairNum = getPairNumberForLeft(p.id);
              const isActive = activeLeftId === p.id;
              const styleClass =
                pairNum !== null
                  ? PAIR_ACCENTS[(pairNum - 1) % PAIR_ACCENTS.length]
                  : isActive
                  ? 'bg-indigo-600 border-indigo-800 text-white'
                  : 'bg-white border-sky-200 text-slate-900 hover:border-sky-400 hover:bg-sky-50/50';

              return (
                <div key={p.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLeftClick(p.id)}
                    className={`flex-1 min-h-[54px] px-4 py-3 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between gap-3 transition-all active:translate-y-px ${styleClass}`}
                  >
                    <span className="text-sm sm:text-base font-bold">{p.left}</span>
                    {pairNum !== null ? (
                      <span className="text-xs font-mono font-extrabold whitespace-nowrap shrink-0">
                        Cặp {pairNum}
                      </span>
                    ) : isActive ? (
                      <span className="text-xs font-bold text-amber-300 whitespace-nowrap shrink-0">
                        Đang chọn
                      </span>
                    ) : (
                      <Link2 className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                  </button>
                  {pairNum !== null && (
                    <button
                      type="button"
                      onClick={() => handleClearOne(p.id)}
                      aria-label={`Bỏ nối ${p.left}`}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-bold text-orange-700">Cột phải</p>
            {shuffledRightPairs.map((p) => {
              const linkedLeftId = getLeftIdForRight(p.id);
              const pairNum = linkedLeftId ? getPairNumberForLeft(linkedLeftId) : null;
              const styleClass =
                pairNum !== null
                  ? PAIR_ACCENTS[(pairNum - 1) % PAIR_ACCENTS.length]
                  : activeLeftId
                  ? 'bg-amber-50 border-amber-400 text-slate-900 hover:bg-amber-100'
                  : 'bg-white border-orange-200 text-slate-900 hover:border-orange-400 hover:bg-orange-50/40';

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleRightClick(p.id)}
                  className={`w-full min-h-[54px] px-4 py-3 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between gap-3 transition-all active:translate-y-px ${styleClass}`}
                >
                  <span className="text-sm sm:text-base font-bold">{p.right}</span>
                  {pairNum !== null && (
                    <span className="text-xs font-mono font-extrabold whitespace-nowrap shrink-0">
                      Cặp {pairNum}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 3. ĐIỀN TỪ (dt)
  // ------------------------------------------------------------------
  if (question.type === 'dt') {
    const blankCount = Math.max(1, question.acceptedAnswers?.length || 1);
    const values =
      answer && answer.type === 'dt'
        ? Array.from({ length: blankCount }, (_, i) => answer.values[i] || '')
        : Array.from({ length: blankCount }, () => '');

    const handleValueChange = (idx: number, val: string) => {
      const next = [...values];
      next[idx] = val;
      onChange({ type: 'dt', values: next });
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((val, idx) => (
            <div key={idx} className="space-y-1.5">
              <label
                htmlFor={`dt-input-${question.id}-${idx}`}
                className="block text-xs font-bold text-indigo-700"
              >
                {blankCount > 1 ? `Ô trống số ${idx + 1}` : 'Nhập đáp án của em'}
              </label>
              <div className="relative">
                <input
                  id={`dt-input-${question.id}-${idx}`}
                  type="text"
                  value={val}
                  autoComplete="off"
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  placeholder={
                    question.placeholders?.[idx] || 'Gõ số hoặc từ cần điền...'
                  }
                  className="w-full min-h-[54px] px-4 pr-10 py-3 rounded-2xl border-2 border-sky-300 bg-sky-50/40 text-lg font-mono font-extrabold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                />
                {val && (
                  <button
                    type="button"
                    onClick={() => handleValueChange(idx, '')}
                    aria-label="Xóa nội dung ô trống"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 4. SẮP XẾP (sx)
  // ------------------------------------------------------------------
  if (question.type === 'sx') {
    const pool = sxPool;
    const ordered = answer && answer.type === 'sx' ? answer.ordered : [];

    const remainingPool: string[] = [];
    const usedCounts = new Map<string, number>();
    for (const item of ordered) {
      usedCounts.set(item, (usedCounts.get(item) || 0) + 1);
    }
    for (const item of pool) {
      const c = usedCounts.get(item) || 0;
      if (c > 0) {
        usedCounts.set(item, c - 1);
      } else {
        remainingPool.push(item);
      }
    }

    const addItem = (text: string) => {
      onChange({ type: 'sx', ordered: [...ordered, text] });
    };

    const removeAt = (idx: number) => {
      onChange({ type: 'sx', ordered: ordered.filter((_, i) => i !== idx) });
    };

    const moveItem = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= ordered.length) return;
      const next = [...ordered];
      [next[idx], next[target]] = [next[target], next[idx]];
      onChange({ type: 'sx', ordered: next });
    };

    return (
      <div className="space-y-5">
        {/* Ordered Answer Tray */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">
              Thứ tự em đã xếp ({question.orderDirectionLabel || 'Từ trái sang phải'})
            </span>
            {ordered.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ type: 'sx', ordered: [] })}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xếp lại
              </button>
            )}
          </div>

          <div className="min-h-[82px] p-4 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 flex flex-wrap items-center gap-2.5">
            {ordered.length === 0 ? (
              <span className="text-sm font-medium text-emerald-800/70">
                Nhấn lần lượt vào các thẻ màu bên dưới để xếp vào đây nhé...
              </span>
            ) : (
              ordered.map((text, idx) => (
                <div
                  key={`${text}-${idx}`}
                  className="inline-flex items-center gap-1 bg-white border-2 border-b-4 border-emerald-500 rounded-2xl pl-3 pr-1.5 py-2 shadow-xs"
                >
                  <span className="text-xs font-mono font-extrabold text-emerald-600 mr-1 tabular-nums">
                    {idx + 1}.
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 mr-1">
                    {text}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Chuyển sang trái"
                    className="p-1 rounded text-slate-500 hover:text-sky-600 disabled:opacity-30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === ordered.length - 1}
                    aria-label="Chuyển sang phải"
                    className="p-1 rounded text-slate-500 hover:text-sky-600 disabled:opacity-30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    aria-label={`Bỏ ${text}`}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unplaced Pool */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-600">
            Các thẻ chưa xếp ({remainingPool.length})
          </span>
          <div className="flex flex-wrap gap-2.5 min-h-[52px]">
            {remainingPool.length === 0 ? (
              <span className="text-xs font-bold text-emerald-700">
                Em đã xếp đủ tất cả các thẻ rồi!
              </span>
            ) : (
              remainingPool.map((text, idx) => (
                <button
                  key={`${text}-pool-${idx}`}
                  type="button"
                  onClick={() => addItem(text)}
                  className={`min-h-[48px] px-4 py-2.5 rounded-2xl border-2 border-b-4 text-sm sm:text-base font-extrabold transition-all active:translate-y-px shadow-xs ${
                    TILE_COLORS[idx % TILE_COLORS.length]
                  }`}
                >
                  {text}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 5. CHỌN VÀO GIỎ TƯƠNG ỨNG (chon)
  // ------------------------------------------------------------------
  const baskets = question.baskets || [];
  const items = question.basketItems || [];
  const placements: Record<string, string> =
    answer && answer.type === 'chon' ? answer.placements : {};

  const unplacedItems = items.filter((it) => !placements[it.id]);

  const placeInBasket = (itemId: string, basketId: string) => {
    const next = { ...placements, [itemId]: basketId };
    onChange({ type: 'chon', placements: next });
    setSelectedBasketItemId(null);
    setDraggedItemId(null);
  };

  const removeFromBasket = (itemId: string) => {
    const next = { ...placements };
    delete next[itemId];
    onChange({ type: 'chon', placements: next });
  };

  const clearAllBaskets = () => {
    setSelectedBasketItemId(null);
    onChange({ type: 'chon', placements: {} });
  };

  return (
    <div className="space-y-5">
      {/* Unplaced Items Tray */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-700">
            {selectedBasketItemId
              ? 'Đang cầm thẻ — nhấn vào chiếc giỏ đúng bên dưới để thả vào nhé!'
              : `Nhấn chọn hoặc kéo thả từng thẻ vào giỏ đúng (${unplacedItems.length} thẻ còn lại)`}
          </span>
          {Object.keys(placements).length > 0 && (
            <button
              type="button"
              onClick={clearAllBaskets}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Làm lại
            </button>
          )}
        </div>

        <div className="min-h-[68px] p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-wrap gap-2.5 items-center">
          {unplacedItems.length === 0 ? (
            <span className="text-xs font-bold text-emerald-700">
              Tất cả các thẻ đã vào giỏ! Nhấn vào thẻ trong giỏ nếu muốn lấy ra xếp lại.
            </span>
          ) : (
            unplacedItems.map((it, idx) => {
              const isSelected = selectedBasketItemId === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedItemId(it.id)}
                  onDragEnd={() => setDraggedItemId(null)}
                  onClick={() =>
                    setSelectedBasketItemId(isSelected ? null : it.id)
                  }
                  className={`min-h-[46px] px-4 py-2 rounded-2xl border-2 border-b-4 text-sm sm:text-base font-extrabold transition-all cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'bg-slate-900 border-slate-950 text-amber-300 scale-105 shadow-md'
                      : TILE_COLORS[idx % TILE_COLORS.length]
                  }`}
                >
                  {it.text}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Colorful Baskets Grid */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          baskets.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        }`}
      >
        {baskets.map((b, bIdx) => {
          const placedHere = items.filter((it) => placements[it.id] === b.id);
          const canReceive = Boolean(selectedBasketItemId || draggedItemId);
          const theme = BASKET_THEMES[bIdx % BASKET_THEMES.length];

          return (
            <div
              key={b.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedItemId) placeInBasket(draggedItemId, b.id);
              }}
              onClick={() => {
                if (selectedBasketItemId) {
                  placeInBasket(selectedBasketItemId, b.id);
                }
              }}
              className={`min-h-[150px] p-4 rounded-3xl border-2 border-b-4 transition-all flex flex-col justify-between ${
                canReceive ? `${theme.active} cursor-pointer` : theme.border
              }`}
            >
              <div className={`flex items-center justify-between gap-2 pb-3 border-b ${theme.header}`}>
                <h4 className="font-display text-sm sm:text-base font-extrabold">
                  {b.label}
                </h4>
                <span className="text-xs font-mono font-bold tabular-nums opacity-80">
                  {placedHere.length} thẻ
                </span>
              </div>

              <div className="flex-1 pt-3 flex flex-wrap content-start gap-2">
                {placedHere.length === 0 ? (
                  <p className="text-xs font-medium text-slate-500">
                    {canReceive
                      ? 'Nhấn hoặc thả thẻ vào giỏ này'
                      : 'Giỏ đang trống'}
                  </p>
                ) : (
                  placedHere.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromBasket(it.id);
                      }}
                      title="Nhấn để lấy thẻ ra khỏi giỏ"
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl border-b-2 text-sm font-extrabold hover:opacity-90 transition-opacity ${theme.chip}`}
                    >
                      <span>{it.text}</span>
                      <X className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
