import React from 'react';
import { Flame, Play, Sparkles } from 'lucide-react';
import { centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const BonusOverlay = ({
  activeBonus,
  onDropBonusBall,
  isDropping,
  autoPlayBonus,
  onToggleAutoPlayBonus,
}) => {
  const energyPercent = Math.min(100, (activeBonus.bonusEnergy / 100) * 100);

  return (
    <div className="w-full max-w-xl mx-auto px-3 py-2 z-20">
      <div className="bg-gradient-to-r from-teal-950/90 via-slate-900/95 to-teal-950/90 border-2 border-teal-500 rounded-3xl p-3 sm:p-4 shadow-glow-teal backdrop-blur-md flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm sm:text-base text-teal-300 tracking-wider uppercase">
                Temple Bonus Round
              </h2>
              <span className="text-[10px] text-teal-400/80 font-medium">
                Bet: {centsToCredits(activeBonus.betPerBallCents)} ₹ / ball (FREE)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Remaining Balls
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-teal-300">
              {activeBonus.remainingBalls}{' '}
              <span className="text-xs text-slate-400 font-normal">
                / {activeBonus.totalBallsGranted}
              </span>
            </span>
          </div>
        </div>

        <div className="bg-slate-950/80 rounded-xl p-3 border border-teal-900 flex items-center justify-between">
          <span className="text-xs uppercase text-slate-400 font-semibold">
            Bonus Win
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
            +{centsToCredits(activeBonus.accumulatedWinCents)} ₹
          </span>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onToggleAutoPlayBonus();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
              autoPlayBonus
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Auto Play {autoPlayBonus ? 'ON' : 'OFF'}
          </button>

          <button
            disabled={isDropping || activeBonus.remainingBalls <= 0}
            onClick={() => {
              soundManager.playButtonClick();
              onDropBonusBall();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-glow-teal flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isDropping ? 'DROPPING...' : 'DROP FREE BALL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
