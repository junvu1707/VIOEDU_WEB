import React from 'react';

export type ActiveTab = 'setup' | 'bank' | 'history';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onQuickStart: () => void;
  isExamActive: boolean;
  isAdmin: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onQuickStart,
  isExamActive,
  isAdmin,
}) => {
  if (isExamActive) {
    return null;
  }

  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'setup', label: 'Phòng thi' },
    ...(isAdmin ? [{ id: 'bank' as ActiveTab, label: 'Ngân hàng đề' }] : []),
    { id: 'history', label: 'Lịch sử & Phân tích' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('setup')}
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-amber-200 transition-colors"
        >
          Đấu Trường Trí Tuệ
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'text-amber-200 font-bold'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 bg-amber-300 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="hidden sm:flex items-center shrink-0">
          <button
            type="button"
            onClick={onQuickStart}
            className="px-4 py-2 text-sm font-extrabold text-slate-900 bg-amber-300 hover:bg-amber-200 border-b-2 border-amber-500 rounded-xl active:translate-y-px transition-all whitespace-nowrap shrink-0"
          >
            Vào thi ngay
          </button>
        </div>
      </div>
    </header>
  );
};
