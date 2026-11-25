import React, { useMemo } from 'react';
import { X, Trophy, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, Zap, Disc3 } from 'lucide-react';
import { centsToCredits, GAME_CONFIG } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

/**
 * BetResultModal
 * Comprehensive round outcome popup showing complete bet details:
 * - Won / Loss / Break-even status with celebratory theme
 * - Net profit or loss amount and total gross return
 * - Bet per ball, balls dropped, total wager
 * - Breakdown of slots hit with multipliers
 * - Bumper energy hits and spin points earned
 * - Updated wallet balance
 */
export const BetResultModal = ({ isOpen, onClose, resultData }) => {
  if (!isOpen || !resultData) return null;

  const {
    roundId = 'N/A',
    betPerBallCents = 50,
    ballCount = 10,
    totalBetCents = 500,
    grossPayoutCents = 0,
    netPayoutCents = grossPayoutCents - totalBetCents,
    walletBalanceCents,
    balls = [],
    spinPoints = 0,
    energyPoints = 0,
    payoutCapReached = false,
    pendingFeatures = [],
    activeBonus = null,
    isBonusRound = false,
  } = resultData;

  const isWin = netPayoutCents > 0;
  const isBreakEven = netPayoutCents === 0;
  const isLoss = netPayoutCents < 0;

  // Breakdown of balls landed in each slot
  const slotBreakdown = useMemo(() => {
    if (!balls || balls.length === 0) return [];
    const counts = {};
    balls.forEach((b) => {
      const label = b.slotLabel || (b.isSpin ? 'SPIN' : '0x');
      const slotDef = GAME_CONFIG.SLOTS[b.slotIndex] || {};
      if (!counts[label]) {
        counts[label] = {
          label,
          count: 0,
          isSpin: Boolean(b.isSpin),
          slotIndex: b.slotIndex,
          color: slotDef.color || '#3b82f6',
          totalPayoutCents: 0,
        };
      }
      counts[label].count += 1;
      counts[label].totalPayoutCents += b.creditedPayoutCents || 0;
    });
    return Object.values(counts).sort((a, b) => b.slotIndex - a.slotIndex);
  }, [balls]);

  // Total bumper hits across all balls
  const totalBumperHits = useMemo(() => {
    if (!balls) return 0;
    return balls.reduce((acc, b) => acc + (b.bumperHits ? b.bumperHits.length : 0), 0);
  }, [balls]);

  const spinPointsEarned = useMemo(() => {
    if (!balls) return 0;
    return balls.filter((b) => b.isSpin).length * GAME_CONFIG.SPIN_POINTS_PER_HIT;
  }, [balls]);

  const energyEarned = totalBumperHits * GAME_CONFIG.ENERGY_PER_BUMPER_HIT;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 xs:p-4 select-none animate-fadeIn">
      <div
        className={`bg-[#0d1424] border rounded-3xl p-5 xs:p-6 max-w-md w-full relative shadow-2xl max-h-[92vh] flex flex-col overflow-y-auto transition-all ${
          isWin
            ? 'border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
            : isBreakEven
            ? 'border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
            : 'border-rose-900/60 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all"
          aria-label="Close result modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header & Outcome Badge */}
        <div className="flex flex-col items-center text-center mt-1 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-lg ${
              isWin
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-emerald-900/50 animate-bounce'
                : isBreakEven
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-white shadow-amber-900/50'
                : 'bg-gradient-to-tr from-rose-900 to-slate-800 text-rose-300 shadow-rose-950/50'
            }`}
          >
            {isWin ? (
              <Trophy className="w-8 h-8 drop-shadow" />
            ) : isBreakEven ? (
              <RefreshCw className="w-7 h-7 drop-shadow" />
            ) : (
              <AlertCircle className="w-8 h-8 drop-shadow" />
            )}
          </div>

          <span
            className={`text-xs xs:text-sm font-black uppercase tracking-widest px-3 py-0.5 rounded-full mb-1.5 ${
              isWin
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isBreakEven
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isBonusRound
              ? 'Bonus Round Outcome'
              : isWin
              ? '🎉 Bet Won!'
              : isBreakEven
              ? '⚖️ Break Even'
              : '💀 Round Over'}
          </span>

          {/* Main Net Amount */}
          <div className="flex items-baseline justify-center space-x-1.5 my-1">
            <span
              className={`text-3xl xs:text-4xl font-black font-mono leading-none tracking-tight ${
                isWin
                  ? 'text-emerald-400'
                  : isBreakEven
                  ? 'text-amber-300'
                  : 'text-rose-400'
              }`}
            >
              {isWin ? '+' : ''}
              {centsToCredits(netPayoutCents)}
            </span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              {GAME_CONFIG.CURRENCY_SYMBOL}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium max-w-[280px]">
            {isWin
              ? 'Congratulations! Your drop returned a net profit!'
              : isBreakEven
              ? 'Your total return matched your wager.'
              : 'The temple claimed this round. Next drop could trigger the wheel!'}
          </p>

          {payoutCapReached && (
            <div className="mt-2 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/50 px-2.5 py-1 rounded-lg">
              ⚠️ Payout cap of {centsToCredits(GAME_CONFIG.PAYOUT_CAP_CENTS)} {GAME_CONFIG.CURRENCY_SYMBOL} reached for this round!
            </div>
          )}
        </div>

        {/* Bet Details Grid (4 key stats) */}
        <div className="bg-[#080d18] border border-slate-800 rounded-2xl p-3.5 mb-3.5 shadow-inner">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>Round Specifications</span>
            <span className="font-mono text-[9px] text-slate-500">ID: {roundId.slice(0, 16)}...</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase">Bet Per Ball</span>
              <span className="font-mono font-bold text-slate-200">
                {centsToCredits(betPerBallCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase">Balls Dropped</span>
              <span className="font-mono font-bold text-slate-200">{ballCount} Balls</span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase">Total Wager</span>
              <span className="font-mono font-bold text-slate-200">
                {centsToCredits(totalBetCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase">Gross Payout</span>
              <span className="font-mono font-bold text-emerald-300">
                {centsToCredits(grossPayoutCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>
          </div>

          {walletBalanceCents !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">New Wallet Balance:</span>
              <span className="font-mono font-black text-amber-300">
                {centsToCredits(walletBalanceCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>
          )}
        </div>

        {/* Slot Landings Breakdown */}
        {slotBreakdown.length > 0 && (
          <div className="mb-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Slot Hits Distribution
            </span>
            <div className="flex flex-wrap gap-1.5">
              {slotBreakdown.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm text-xs"
                >
                  <span
                    className="font-black font-mono px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: s.color, color: '#000' }}
                  >
                    {s.label}
                  </span>
                  <span className="font-bold text-slate-200 text-xs">× {s.count}</span>
                  {s.totalPayoutCents > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      ({centsToCredits(s.totalPayoutCents)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Meter Progress Alerts */}
        {(spinPointsEarned > 0 || energyEarned > 0) && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 mb-4 flex flex-col space-y-1.5 text-xs">
            {spinPointsEarned > 0 && (
              <div className="flex items-center space-x-2 text-amber-300">
                <Disc3 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>+{spinPointsEarned} Spin Point{spinPointsEarned > 1 ? 's' : ''}!</strong> ({spinPoints}/10 towards Free Wheel Spin)
                </span>
              </div>
            )}
            {energyEarned > 0 && (
              <div className="flex items-center space-x-2 text-cyan-300">
                <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  <strong>+{energyEarned} Bumper Energy!</strong> ({energyPoints}/100)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button: Play Again / Continue */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-950 transition-all transform active:scale-95 hover:brightness-110 shadow-lg flex items-center justify-center space-x-2"
          style={{
            background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Continue / Play Again</span>
        </button>
      </div>
    </div>
  );
};
