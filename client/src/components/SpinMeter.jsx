import React from 'react';
import { Sparkles } from 'lucide-react';
import { soundManager } from '../audio/soundManager.js';

export const SpinMeter = ({
  spinPoints = 0,
  pendingSpinsCount = 0,
  onOpenWheel,
  disabled = false,
  hideLabel = false,
}) => {
  const percent = Math.min(100, (spinPoints / 10) * 100);
  const isReady = pendingSpinsCount > 0 || spinPoints >= 10;

  return (
    <div
      onClick={() => {
        if (isReady && onOpenWheel && !disabled) {
          soundManager.playButtonClick();
          onOpenWheel();
        }
      }}
      className={`flex flex-col items-end select-none transition-all ${
        isReady ? 'cursor-pointer group' : ''
      }`}
      title={isReady ? 'Click to spin the Reward Wheel!' : `Free Spin Progress: ${spinPoints}/10`}
    >
      {/* Label above progress bar */}
      {!hideLabel && (
        <div className="flex items-center space-x-1 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            FREE SPIN
          </span>
          {pendingSpinsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-bounce shadow-glow-gold">
              +{pendingSpinsCount}
            </span>
          )}
        </div>
      )}

      {/* Horizontal Bar with Mini Wheel Icon */}
      <div className="flex items-center space-x-1.5">
        <div className="w-28 sm:w-36 h-3 bg-black/60 rounded-full p-[2px] border border-slate-700/80 shadow-inner relative overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            style={{ width: `${Math.max(12, percent)}%` }}
          />
        </div>

        {/* Mini Wheel Icon */}
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-amber-300/80 flex items-center justify-center transition-all ${
            isReady ? 'shadow-[0_0_10px_#f59e0b] animate-spin-slow' : ''
          }`}
          style={{
            background:
              'conic-gradient(#ef4444 0% 20%, #f59e0b 20% 40%, #10b981 40% 60%, #06b6d4 60% 80%, #8b5cf6 80% 100%)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-amber-200" />
        </div>
      </div>
    </div>
  );
};
