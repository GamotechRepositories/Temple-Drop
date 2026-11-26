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
            {/* Top: Total Auto Drop Summary Table */}
            <div className="rounded-xl border border-slate-800 bg-[#080d18]/90 overflow-hidden mb-3">
              <div className="px-3 py-1.5 bg-[#0b1322] border-b border-slate-800 text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                Total Auto Drop Summary
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-800/70">
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Rounds Played</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-200">
                      {summaryTotals.roundsCount} Rounds
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Total Wagered</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-200">
                      {centsToCredits(summaryTotals.totalWager)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Total Payout</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-300">
                      {centsToCredits(summaryTotals.totalGross)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">New Balance</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-amber-300">
                      {centsToCredits(summaryTotals.finalBalance)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom: Each Individual Bet Table */}
            <div className="rounded-xl border border-slate-800 bg-[#080d18]/90 overflow-hidden mb-2">
              <div className="px-3 py-1.5 bg-[#0b1322] border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Each Bet Details ({summaryTotals.roundsCount})
              </div>
              <div className="max-h-44 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#0b1322]/70 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Bet</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">Wager</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">Win</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {autoDropRounds.map((r, idx) => {
                      const rNet = r.netPayoutCents ?? ((r.grossPayoutCents || 0) - (r.totalBetCents || 0));
                      const rWin = rNet >= 0;
                      return (
                        <tr key={r.roundId || idx}>
                          <td className="px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-300">#{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playButtonClick();
                                  copyText(r.roundId);
                                  setCopiedId(r.roundId);
                                  setTimeout(() => setCopiedId(null), 1500);
                                }}
                                title={`Copy Bet ID: ${r.roundId}`}
                                className="text-slate-500 hover:text-amber-300"
                                aria-label="Copy Bet ID"
                              >
                                {copiedId === r.roundId ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono text-slate-300">
                            {centsToCredits(r.totalBetCents)}
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-mono text-slate-200">
                            {centsToCredits(r.grossPayoutCents)}
                          </td>
                          <td className={`px-2.5 py-1.5 text-right font-mono font-bold ${rWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {rWin ? '+' : ''}{centsToCredits(rNet)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Round Summary Table */}
            <div className="rounded-xl border border-slate-800 bg-[#080d18]/90 overflow-hidden">
              <div className="px-3 py-1.5 bg-[#0b1322] border-b border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
                  Round Summary
                </span>
                <div className="inline-flex items-center space-x-1.5 min-w-0 font-mono text-[10px] text-slate-400">
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

              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-800/70">
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Bet Per Ball</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-200">
                      {centsToCredits(betPerBallCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Balls Dropped</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-200">
                      {ballCount} Balls
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Total Wager</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-200">
                      {centsToCredits(totalBetCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-400">Gross Payout</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-400">
                      {centsToCredits(grossPayoutCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                    </td>
                  </tr>
                  {walletBalanceCents !== undefined && (
                    <tr className="bg-[#0b1322]/50">
                      <td className="px-3 py-1.5 text-slate-300 font-medium">New Wallet Balance</td>
                      <td className="px-3 py-1.5 text-right font-mono font-black text-amber-300">
                        {centsToCredits(walletBalanceCents)} {GAME_CONFIG.CURRENCY_SYMBOL}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Slot Hits Table */}
            {slotBreakdown.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-[#080d18]/90 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1322] text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-1.5 font-semibold">Slot</th>
                      <th className="px-3 py-1.5 font-semibold text-right">Hits</th>
                      <th className="px-3 py-1.5 font-semibold text-right">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {slotBreakdown.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1.5">
                          <span
                            className="inline-block font-black font-mono px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: s.color, color: '#000' }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold text-slate-200">
                          × {s.count}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold text-emerald-400">
                          {s.totalPayoutCents > 0 ? `${centsToCredits(s.totalPayoutCents)} ${GAME_CONFIG.CURRENCY_SYMBOL}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Spin Meter Progress Alert */}
            {spinPointsEarned > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center space-x-2 text-[11px] text-amber-300">
                <Disc3 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>+{spinPointsEarned} Spin Point{spinPointsEarned > 1 ? 's' : ''}!</strong> ({spinPoints}/10 towards Free Wheel Spin)
                </span>
              </div>
            )}
          </>
        )}
        </div>

        {/* Pinned Action Button: Play Again / Continue (no icon) */}
        <div className="shrink-0 pt-2.5 mt-1 border-t border-slate-800/60">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="w-full py-2.5 sm:py-3 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-slate-950 transition-all transform active:scale-95 hover:brightness-110 shadow-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
            }}
          >
            <span>Continue / Play Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
