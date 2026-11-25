import React, { useState } from 'react';
import { X, CheckCircle, Disc, Flame, Award, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager.js';

export const HowToPlayModal = ({
  isOpen,
  onClose,
  initialDontShowAgain,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(initialDontShowAgain);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Choose your Bet & Ball Count',
      desc: 'Select your bet per ball (0.50 to 50 ₹) and number of balls per drop (10 to 50), then press BET.',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    {
      num: 2,
      title: 'Landed Multipliers',
      desc: 'Balls bounce down 14 rows into 15 slots paying 0.2x up to 100x your bet per ball.',
      icon: <Award className="w-4 h-4 text-emerald-400" />,
    },
    {
      num: 3,
      title: 'Center SPIN Gate',
      desc: 'Each ball landing in the center SPIN slot adds 1 point to the Spin Meter. 10 points = 1 Free Wheel Spin!',
      icon: <Disc className="w-4 h-4 text-amber-400" />,
    },
    {
      num: 4,
      title: 'Free Wheel Spin',
      desc: 'Spin the Temple Wheel when you reach 10 spin points! Win 1x, 2x, 5x, or 10x multipliers on your bet per ball.',
      icon: <Flame className="w-4 h-4 text-teal-400" />,
    },
    {
      num: 5,
      title: 'Auto Drop & Fast Mode',
      desc: 'Enable Fast Mode for quicker drops or use Auto Drop to run multiple rounds automatically.',
      icon: <CheckCircle className="w-4 h-4 text-teal-300" />,
    },
    {
      num: 6,
      title: 'Demo Credits & Payout Cap',
      desc: 'All credits are demo tokens. Combined payouts per paid round are capped at 5,000 ₹. Free refills are available below 0.50 ₹!',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div
        className="rounded-3xl p-4 sm:p-5 max-w-md w-full relative shadow-2xl max-h-[82dvh] flex flex-col transition-all"
        style={{
          background: 'linear-gradient(180deg, #0b162a 0%, #060d1a 100%)',
          border: '2.5px solid #d97706',
          boxShadow:
            '0 24px 50px rgba(0, 0, 0, 0.9), inset 0 0 18px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose(dontShowAgain);
          }}
          className="absolute top-4 right-4 p-2 text-slate-950 rounded-full transition-all hover:brightness-110 active:scale-95 z-10"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
          aria-label="Close how to play"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-3.5 mb-3.5 border-b border-slate-800/80 pr-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.35)] border border-amber-300 shrink-0">
            <HelpCircle className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-black text-lg text-slate-100 uppercase tracking-wider leading-tight">
              How to Play?
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Quick guide to dropping balls &amp; winning multipliers
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-3">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-[#0b1426] border border-amber-600/35 shadow-inner"
            >
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                  {s.num}. {s.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer: Don't Show Again Toggle + Close Button */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={dontShowAgain}
            onClick={() => {
              soundManager.playButtonClick();
              setDontShowAgain(!dontShowAgain);
            }}
            className="flex items-center space-x-2.5 text-xs font-semibold text-slate-300 cursor-pointer select-none"
          >
            <div
              className="w-9 h-5 rounded-full p-0.5 transition-all duration-200 flex items-center shrink-0"
              style={{
                background: dontShowAgain
                  ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)'
                  : '#0f172a',
                border: dontShowAgain ? '1.5px solid #fef08a' : '1.5px solid #d97706',
              }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${
                  dontShowAgain ? 'translate-x-4 bg-white' : 'translate-x-0 bg-amber-300'
                }`}
              />
            </div>
            <span>Don&apos;t show next time</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose(dontShowAgain);
            }}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
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
