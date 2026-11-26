import React, { useMemo, useState } from 'react';
import { X, Trophy, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, Zap, Disc3, Copy, Check } from 'lucide-react';
import { centsToCredits, GAME_CONFIG } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => {});
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

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
  const [copiedId, setCopiedId] = useState(null);

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
    payoutCapReached = false,
    isBonusRound = false,
    isAutoDropSummary = false,
    autoDropRounds = [],
  } = resultData || {};

  const isAutoSummary = Boolean(isAutoDropSummary && autoDropRounds.length > 0);

  const summaryTotals = useMemo(() => {
    if (!isAutoSummary) return null;
    const roundsCount = autoDropRounds.length;
    const totalWager = autoDropRounds.reduce((acc, r) => acc + (r.totalBetCents || 0), 0);
    const totalGross = autoDropRounds.reduce((acc, r) => acc + (r.grossPayoutCents || 0), 0);
    const totalNet = totalGross - totalWager;
    const lastRound = autoDropRounds[roundsCount - 1];
    return {
      roundsCount,
      totalWager,
      totalGross,
      totalNet,
      finalBalance: lastRound?.walletBalanceCents ?? walletBalanceCents,
    };
  }, [isAutoSummary, autoDropRounds, walletBalanceCents]);

  const effectiveNetCents = isAutoSummary ? summaryTotals.totalNet : netPayoutCents;
  const isWin = effectiveNetCents > 0;
  const isBreakEven = effectiveNetCents === 0;

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

  const spinPointsEarned = useMemo(() => {
    if (!balls) return 0;
    return balls.filter((b) => b.isSpin).length * GAME_CONFIG.SPIN_POINTS_PER_HIT;
  }, [balls]);

  if (!isOpen || !resultData) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div
        className="rounded-3xl p-3.5 sm:p-4 max-w-md w-full relative shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden transition-all"
        style={{
          background:
            isWin
              ? 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.16) 0%, #0c172c 42%, #060d1a 100%)'
              : isBreakEven
              ? 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.16) 0%, #0c172c 42%, #060d1a 100%)'
              : 'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.13) 0%, #0c172c 42%, #060d1a 100%)',
          border: '2px solid #d97706',
          boxShadow:
            '0 24px 50px rgba(0, 0, 0, 0.92), inset 0 0 22px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 text-slate-950 rounded-full transition-all hover:brightness-110 active:scale-95 z-10"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
          aria-label="Close result modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Header & Outcome Badge */}
        <div className="shrink-0 flex flex-col items-center text-center pt-0.5 pb-2.5 border-b border-slate-800/70 mb-2.5">
          <span
            className={`text-[11px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full mb-1 ${
              isWin
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isBreakEven
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isAutoSummary
              ? `Auto Drop Summary (${summaryTotals.roundsCount} Round${summaryTotals.roundsCount > 1 ? 's' : ''})`
              : isBonusRound
              ? 'Bonus Round Outcome'
              : isWin
              ? 'Bet Won!'
              : isBreakEven
              ? 'Break Even'
              : 'Round Over'}
          </span>

          {/* Main Net Amount */}
          <div className="flex items-baseline justify-center space-x-1.5 my-0.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight ${
                isWin
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                  : isBreakEven
                  ? 'text-amber-300'
                  : 'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.3)]'
              }`}
            >
              {isWin ? '+' : ''}
              {centsToCredits(effectiveNetCents)}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {GAME_CONFIG.CURRENCY_SYMBOL}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium max-w-[300px] leading-snug">
            {isAutoSummary
              ? `Completed ${summaryTotals.roundsCount} auto drop round${summaryTotals.roundsCount > 1 ? 's' : ''}.`
              : isWin
              ? 'Congratulations! Your drop returned a net profit!'
              : isBreakEven
              ? 'Your total return matched your wager.'
              : 'The temple claimed this round. Next drop could trigger the wheel!'}
          </p>

          {!isAutoSummary && payoutCapReached && (
            <div className="mt-1.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/50 px-2.5 py-0.5 rounded-lg">
              Payout cap of {centsToCredits(GAME_CONFIG.PAYOUT_CAP_CENTS)} {GAME_CONFIG.CURRENCY_SYMBOL} reached!
            </div>
          )}
        </div>

        {/* Scrollable Middle Details */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2.5">

        {isAutoSummary ? (
          <>
            {/* Top: Total Summary Across All Auto Drop Rounds */}
            <div className="bg-[#080d18] border border-slate-800 rounded-2xl p-3.5 mb-3 shadow-inner">
              <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider mb-2 border-b border-slate-800 pb-1">
                Total Auto Drop Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase">Rounds Played</span>
                  <span className="font-mono font-bold text-slate-200">
                    {summaryTotals.roundsCount} Rounds
                  </span>
                </div>
                <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase">Total Wagered</span>
                  <span className="font-mono font-bold text-slate-200">
                    {centsToCredits(summaryTotals.totalWager)} {GAME_CONFIG.CURRENCY_SYMBOL}
                  </span>
                </div>
                <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase">Total Payout</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {centsToCredits(summaryTotals.totalGross)} {GAME_CONFIG.CURRENCY_SYMBOL}
                  </span>
                </div>
                <div className="flex flex-col bg-[#0f172a]/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase">New Balance</span>
                  <span className="font-mono font-bold text-amber-300">
                    {centsToCredits(summaryTotals.finalBalance)} {GAME_CONFIG.CURRENCY_SYMBOL}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom: Each Individual Bet Summary */}
            <div className="mb-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Each Bet Details ({summaryTotals.roundsCount})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {autoDropRounds.map((r, idx) => {
                  const rNet = r.netPayoutCents ?? ((r.grossPayoutCents || 0) - (r.totalBetCents || 0));
                  const rWin = rNet >= 0;
                  return (
                    <div
                      key={r.roundId || idx}
                      className="bg-[#0b1426] border border-slate-800 rounded-xl p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-amber-300">Bet #{idx + 1}</span>
                        <div className="inline-flex items-center space-x-1 min-w-0 font-mono text-[10px] text-slate-400">
                          <span className="truncate max-w-[140px]">ID: {r.roundId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playButtonClick();
                              copyText(r.roundId);
                              setCopiedId(r.roundId);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            title={`Copy Bet ID: ${r.roundId}`}
                            className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors shrink-0"
                            aria-label="Copy Bet ID"
                          >
                            {copiedId === r.roundId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          {r.ballCount} balls • Bet: {centsToCredits(r.totalBetCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                        </span>
                        <div className="flex items-center space-x-2 font-mono font-bold">
                          <span className="text-slate-200">
                            Win: +{centsToCredits(r.grossPayoutCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                          </span>
                          <span className={rWin ? 'text-emerald-400' : 'text-rose-400'}>
                            ({rWin ? '+' : ''}{centsToCredits(rNet)} {GAME_CONFIG.CURRENCY_SYMBOL})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
        {/* Bet Details Grid (4 key stats) */}
        <div className="bg-[#080d18]/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-inner">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
            <span className="shrink-0">Round Specifications</span>
            <div className="inline-flex items-center space-x-1.5 min-w-0 font-mono text-[10px] text-slate-400 normal-case">
              <span className="truncate">ID: {roundId}</span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playButtonClick();
                  copyText(roundId);
                  setCopiedId(roundId);
                  setTimeout(() => setCopiedId(null), 1500);
                }}
                title={`Copy Bet ID: ${roundId}`}
                className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors shrink-0"
                aria-label="Copy Bet ID"
              >
                {copiedId === roundId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex flex-col bg-[#0f172a]/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">Bet Per Ball</span>
              <span className="font-mono font-bold text-slate-200">
                {centsToCredits(betPerBallCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">Balls Dropped</span>
              <span className="font-mono font-bold text-slate-200">{ballCount} Balls</span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Wager</span>
              <span className="font-mono font-bold text-slate-200">
                {centsToCredits(totalBetCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>

            <div className="flex flex-col bg-[#0f172a]/70 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 uppercase tracking-wide">Gross Payout</span>
              <span className="font-mono font-bold text-emerald-300">
                {centsToCredits(grossPayoutCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>
          </div>

          {walletBalanceCents !== undefined && (
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">New Wallet Balance:</span>
              <span className="font-mono font-black text-amber-300">
                {centsToCredits(walletBalanceCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
              </span>
            </div>
          )}
        </div>

        {/* Slot Landings Breakdown */}
        {slotBreakdown.length > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Slot Hits Distribution
            </span>
            <div className="flex flex-wrap gap-1.5">
              {slotBreakdown.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-sm text-[11px]"
                >
                  <span
                    className="font-black font-mono px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: s.color, color: '#000' }}
                  >
                    {s.label}
                  </span>
                  <span className="font-bold text-slate-200">× {s.count}</span>
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

        {/* Spin Meter Progress Alert */}
        {spinPointsEarned > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1.5 flex items-center space-x-2 text-[11px] text-amber-300">
            <Disc3 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>+{spinPointsEarned} Spin Point{spinPointsEarned > 1 ? 's' : ''}!</strong> ({spinPoints}/10 towards Free Wheel Spin)
            </span>
          </div>
        )}
          </>
        )}
        </div>

        {/* Pinned Action Button: Play Again / Continue */}
        <div className="shrink-0 pt-2.5 mt-1 border-t border-slate-800/60">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="w-full py-2.5 sm:py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-950 transition-all transform active:scale-95 hover:brightness-110 shadow-lg flex items-center justify-center space-x-2"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue / Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
