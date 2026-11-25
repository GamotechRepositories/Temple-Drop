import React, { useState } from 'react';
import { X, CheckCircle, Disc, Flame, Award, ShieldAlert, Sparkles } from 'lucide-react';
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
      desc: 'Select your bet per ball (0.50 to 50 ₹) and number of balls per drop (10 to 50), then press PLAY.',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    },
    {
      num: 2,
      title: 'Landed Multipliers',
      desc: 'Balls bounce down 14 rows into 15 slots paying 0.2x up to 100x your bet per ball.',
      icon: <Award className="w-5 h-5 text-emerald-400" />,
    },
    {
      num: 3,
      title: 'Center SPIN Gate',
      desc: 'Each ball landing in the center SPIN slot adds 1 point to the Spin Meter. 10 points = 1 Free Wheel Spin!',
      icon: <Disc className="w-5 h-5 text-amber-400" />,
    },
    {
      num: 4,
      title: 'Free Wheel Spin & Bonus',
      desc: 'Spin the wheel when you reach 10 spin points! Land on BONUS in the wheel spin to unlock the Temple Bonus Round!',
      icon: <Flame className="w-5 h-5 text-teal-400" />,
    },
    {
      num: 5,
      title: 'Temple Bonus Round',
      desc: 'Starts with 5 Free Balls at the triggering bet. In bonus, bumpers grant +10 bonus energy and +3 extra balls at 100 energy (up to 50 balls max)!',
      icon: <CheckCircle className="w-5 h-5 text-teal-300" />,
    },
    {
      num: 6,
      title: 'Demo Credits & Payout Cap',
      desc: 'All credits are demo tokens. Combined payouts per paid round are capped at 5,000 ₹. Free refills are available below 0.50 ₹!',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose(dontShowAgain);
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-all"
          aria-label="Close how to play"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider mb-4">
          How to Play?
        </h2>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 mb-4">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800"
            >
              <div className="mt-0.5 p-2 rounded-xl bg-slate-800/80">{s.icon}</div>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-200">
                  {s.num}. {s.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-teal-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Don&apos;t show next time</span>
          </label>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose(dontShowAgain);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
