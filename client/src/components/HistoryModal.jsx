import React, { useState, useEffect } from 'react';
import { X, History, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { centsToCredits } from '@temple-drop/shared';
import { api } from '../api/client.js';
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

export const HistoryModal = ({ isOpen, onClose }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedRoundId, setExpandedRoundId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getHistory(page, 8);
        if (mounted) {
          setHistoryItems(res.items);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [isOpen, page]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl p-5 max-w-2xl w-full relative shadow-2xl max-h-[82dvh] flex flex-col"
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
          aria-label="Close history modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-2">
          <History className="w-6 h-6 text-amber-400" />
          <h2 className="font-display font-black text-xl text-slate-100 uppercase tracking-wider">
            My Bet History
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Review your previous drops, slot outcomes, and net payouts.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading betting history...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No betting history recorded yet. Place your first drop!
            </div>
          ) : (
            historyItems.map((item) => {
              const isExpanded = expandedRoundId === item.roundId;
              const isNetPositive = item.netChangeCents >= 0;

              return (
                <div
                  key={item.roundId}
                  className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3 flex flex-col transition-all"
                >
                  <div
                    onClick={() => {
                      soundManager.playButtonClick();
                      setExpandedRoundId(isExpanded ? null : item.roundId);
                    }}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex flex-col flex-1 min-w-0 pr-3 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <div className="flex items-center space-x-1.5 min-w-0 text-[10px] font-mono text-slate-400">
                        <span className="truncate">
                          ID: {item.roundId}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundManager.playButtonClick();
                            copyText(item.roundId);
                            setCopiedId(item.roundId);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          title={`Copy Bet ID: ${item.roundId}`}
                          className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors shrink-0"
                          aria-label="Copy Bet ID"
                        >
                          {copiedId === item.roundId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-1.5">
                        <span className="text-xs font-bold text-slate-200">
                          {item.ballCount} balls @ {centsToCredits(item.betPerBallCents)} ₹
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Bet: {centsToCredits(item.totalBetCents)} ₹)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-slate-100">
                          Win: +{centsToCredits(item.totalGrossPayoutCents)} ₹
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isNetPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Net: {isNetPositive ? '+' : ''}
                          {centsToCredits(item.netChangeCents)} ₹
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase">Board Payout</span>
                          <div className="font-bold font-mono text-slate-200">
                            {centsToCredits(item.boardPayoutCents)} ₹
                          </div>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase">Wheel Payout</span>
                          <div className="font-bold font-mono text-slate-200">
                            {centsToCredits(item.wheelPayoutCents)} ₹
                          </div>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase">Bonus Payout</span>
                          <div className="font-bold font-mono text-slate-200">
                            {centsToCredits(item.bonusPayoutCents)} ₹
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">
                          Slot Hits Summary:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(item.slotCounts).map(([slotIdx, count]) => (
                            <span
                              key={slotIdx}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300"
                            >
                              Slot {parseInt(slotIdx, 10) + 1}: <strong>{count}x</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => {
              soundManager.playButtonClick();
              setPage((p) => Math.max(1, p - 1));
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl disabled:opacity-30 text-xs font-black text-slate-950 transition-all hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => {
              soundManager.playButtonClick();
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl disabled:opacity-30 text-xs font-black text-slate-950 transition-all hover:brightness-110 active:scale-95"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
              border: '2px solid #fef08a',
            }}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
