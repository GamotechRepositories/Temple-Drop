import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const GameRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl p-5 max-w-lg w-full relative shadow-2xl max-h-[82dvh] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0c172c 0%, #070e1c 100%)',
          border: '2.5px solid #d97706',
          boxShadow:
            '0 24px 50px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-950 rounded-full transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
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

          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-amber-300">
              Payout Cap
            </h3>
            <p className="leading-relaxed text-slate-400">
              • Combined payouts from the originating drop and wheel spins are capped at 5,000 ₹.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
