import React from 'react';
import { Flame, Disc, Sparkles } from 'lucide-react';
import { centsToCredits } from '@temple-drop/shared';

export const MetersPanel = ({
  spinPoints,
  energyPoints,
  pendingFeatures,
  hasActiveBonus,
  lastWinCents,
  payoutCapReached,
  onOpenWheel,
}) => {
  const pendingSpinsCount = pendingFeatures.filter((f) => f.type === 'WHEEL_SPIN').length;
  const pendingBonusCount = pendingFeatures.filter((f) => f.type === 'BONUS').length;

  const spinPercent = Math.min(100, (spinPoints / 10) * 100);
  const energyPercent = Math.min(100, (energyPoints / 100) * 100);

  return (
    <aside className="w-full lg:w-72 flex flex-col space-y-3 px-3 py-2 z-20">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Disc className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-200 uppercase">
              Free Spin
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            {spinPoints} / 10
          </span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-full transition-all duration-300 shadow-glow-gold"
            style={{ width: `${spinPercent}%` }}
          />
        </div>

        {pendingSpinsCount > 0 && !hasActiveBonus && (
          <button
            onClick={onOpenWheel}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-glow-gold flex items-center justify-center space-x-1.5 animate-pulse"
          >
            <Sparkles className="w-4 h-4" />
            <span>Spin Wheel ({pendingSpinsCount})</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-200 uppercase">
              Bonus Energy
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-teal-300">
            {energyPoints} / 100
          </span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-teal-700 via-teal-500 to-cyan-300 rounded-full transition-all duration-300 shadow-glow-teal"
            style={{ width: `${energyPercent}%` }}
          />
        </div>

        {(hasActiveBonus || pendingBonusCount > 0) && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-500/50 flex items-center justify-between text-xs">
            <span className="text-teal-300 font-semibold">Bonus Game Ready</span>
            <span className="px-1.5 py-0.5 rounded bg-teal-500 text-slate-950 font-bold text-[10px]">
              ACTIVE
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg backdrop-blur-md flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Latest Win
          </span>
          {payoutCapReached && (
            <span className="text-[10px] bg-rose-900/80 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-600">
              CAP (5,000 CR)
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline space-x-1">
          <span className="text-2xl font-black font-mono text-emerald-400">
            {centsToCredits(lastWinCents)}
          </span>
          <span className="text-xs text-slate-400">CR</span>
        </div>
      </div>
    </aside>
  );
};
