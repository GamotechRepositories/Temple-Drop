import React, { useState } from 'react';
import {
  HelpCircle,
  Maximize2,
  Minimize2,
  Menu,
  Coins,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const Header = ({
  user,
  balanceCents,
  avatarIcon,
  onOpenHowToPlay,
  onOpenSettings,
  onRefill,
  canRefill,
  currencySymbol = '🪙',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    soundManager.playButtonClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const displayName = user?.email
    ? user.email.includes('@')
      ? user.email.split('@')[0]
      : user.email
    : 'Explorer';

  return (
    <header className="w-full bg-[#070c14]/90 backdrop-blur-md border-b border-slate-800/80 px-2 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between z-30 transition-all select-none">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300 shrink-0">
          <span className="text-xl sm:text-2xl leading-none">🗿</span>
        </div>
        <h1 className="font-display font-black text-xs xs:text-sm sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 uppercase whitespace-nowrap">
          Temple Drop
        </h1>
      </div>

      {/* Middle: How to Play Button */}
      <div className="flex items-center shrink-0">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onOpenHowToPlay();
          }}
          className="flex items-center justify-center space-x-1.5 w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
          aria-label="How to play instructions"
        >
          <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">How to play?</span>
        </button>
      </div>

      {/* Right Controls: Balance, Fullscreen, Menu */}
      <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
        {/* Balance Display */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900/95 border border-slate-700/80 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-inner">
          <span className="text-xs sm:text-sm font-black font-mono text-white tracking-wide">
            {centsToCredits(balanceCents)}
          </span>
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-4.5 sm:h-4.5 inline-block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0">
            <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" fill="#fbbf24" />
            <circle cx="12" cy="12" r="7.5" stroke="#b45309" strokeWidth="1.2" fill="#f59e0b" />
            <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#451a03" fontFamily="sans-serif">₹</text>
          </svg>

          {canRefill && (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onRefill();
              }}
              title="Refill 10,000 Demo Credits"
              className="ml-1 p-0.5 sm:p-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center animate-bounce shadow-glow-gold"
              aria-label="Refill demo balance"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hidden sm:flex items-center justify-center transition-all"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* User Profile / Settings Menu Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onOpenSettings();
          }}
          className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
          aria-label="Player profile and settings"
        >
          <span className="text-sm font-semibold hidden md:inline text-slate-300">
            {displayName}
          </span>
          <span className="text-base sm:text-lg leading-none">{avatarIcon || '🤠'}</span>
          <Menu className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
