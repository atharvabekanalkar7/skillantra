'use client';

import { useState } from 'react';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isDemo?: boolean;
}

export default function MobileHeader({ onMenuToggle, isDemo = false }: MobileHeaderProps) {
  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-slate-950 border-b border-slate-800"
      style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
    >
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 rounded-xl text-slate-300 hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="text-lg font-bold text-slate-100 truncate">
        Skill<span className="text-indigo-500">Antra</span>{isDemo ? ' (Demo)' : ''}
      </span>
      {/* Spacer for visual balance */}
      <div className="w-11" />
    </header>
  );
}
