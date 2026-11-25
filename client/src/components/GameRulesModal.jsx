import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const GameRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-all"
          aria-label="Close game rules"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-teal-400" />
          <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider">
            Game Rules & Limits
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Bet limits and payout specifications are presented below.
        </p>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Min Bet</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-100 mt-1">
                {centsToCredits(GAME_CONFIG.MIN_BET_CENTS)} ₹
              </span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Max Bet</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-100 mt-1">
                {centsToCredits(GAME_CONFIG.MAX_TOTAL_BET_CENTS)} ₹
              </span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Max Win</span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-1">
                {centsToCredits(GAME_CONFIG.PAYOUT_CAP_CENTS)} ₹
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              15 Landing Slot Multipliers
            </h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {GAME_CONFIG.SLOTS.map((s) => (
                <div
                  key={s.index}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col"
                >
                  <span className="text-[10px] text-slate-400">Slot {s.index + 1}</span>
                  <span
                    className="font-bold font-mono text-xs mt-0.5"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Temple Wheel Outcomes & Weights
            </h3>
            <div className="space-y-2">
              {GAME_CONFIG.WHEEL_OUTCOMES.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80 last:border-0"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="font-bold text-slate-200">{w.label}</span>
                  </div>
                  <span className="font-mono text-slate-400">{w.weight}% Chance</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-teal-300">
              Bonus Round Regulations
            </h3>
            <p className="leading-relaxed text-slate-400">
              • Starts with 5 free balls at the triggering bet value. Free balls do not debit your
              balance.
            </p>
            <p className="leading-relaxed text-slate-400">
              • Each bumper hit grants +10 bonus energy. Every 100 energy adds 3 extra free balls.
            </p>
            <p className="leading-relaxed text-slate-400 font-semibold text-teal-400">
              • Total free balls granted per bonus session are capped at 50 balls max.
            </p>
            <p className="leading-relaxed text-slate-400">
              • Combined payouts from the originating drop, wheel spins, and bonus rounds are capped
              at 5,000 ₹.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
