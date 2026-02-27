'use client';

import { useState } from 'react';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isDemo?: boolean;
}

export default function MobileHeader({ onMenuToggle, isDemo = false }: MobileHeaderProps) {
  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-transparent backdrop-blur-md border-b border-purple-500/20"
      style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
    >
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] -ml-1 rounded-xl text-white/90 hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent truncate">
        SkillAntra{isDemo ? ' (Demo)' : ''}
      </span>
      {/* Spacer for visual balance */}
      <div className="w-11" />
    </header>
  );
}
