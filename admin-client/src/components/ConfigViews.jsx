import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle2, GitCompare, X } from 'lucide-react';
import { Panel, Toggle, NumberField, WheelPreviewSvg, SearchInput } from './UiPrimitives.jsx';

const formatCredits = (cents) =>
  ((cents || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const GameSettingsView = ({ config, onChange, validationErrors }) => {
  const [newBetPerBall, setNewBetPerBall] = useState('');
  const [newBallsPerDrop, setNewBallsPerDrop] = useState('');
  const [newAutoDrop, setNewAutoDrop] = useState('');

  const withAutoLimits = (nextStakes, nextBalls, extraPatch = {}) => {
    const minStake = nextStakes.length > 0 ? Math.min(...nextStakes) : 50;
    const maxStake = nextStakes.length > 0 ? Math.max(...nextStakes) : 5000;
    const minBalls = nextBalls.length > 0 ? Math.min(...nextBalls) : 10;
    const maxBalls = nextBalls.length > 0 ? Math.max(...nextBalls) : 50;

    const minBetCents = Math.multiplyExact
      ? minStake * minBalls
      : minStake * minBalls;
    const maxTotalBetCents = maxStake * maxBalls;
    const payoutCapCents = maxTotalBetCents * 2;

    onChange({
      ...config,
      betPerBallOptionsCents: nextStakes,
      ballsPerDropOptions: nextBalls,
      minBetCents,
      maxTotalBetCents,
      payoutCapCents,
      ...extraPatch,
    });
  };

  const addBetPerBall = () => {
    const valCents = Math.round(Number(newBetPerBall) * 100);
    if (!Number.isFinite(valCents) || valCents <= 0) return;
    const current = config.betPerBallOptionsCents || [];
    if (!current.includes(valCents)) {
      const next = [...current, valCents].sort((a, b) => a - b);
      withAutoLimits(next, config.ballsPerDropOptions || []);
    }
    setNewBetPerBall('');
  };

  const removeBetPerBall = (cents) => {
    const current = config.betPerBallOptionsCents || [];
    if (current.length <= 1) return;
    const next = current.filter((c) => c !== cents);
    const nextDefault = next.includes(config.defaultBetPerBallCents)
      ? config.defaultBetPerBallCents
      : next[0];
    withAutoLimits(next, config.ballsPerDropOptions || [], {
      defaultBetPerBallCents: nextDefault,
    });
  };

  const addBallsPerDrop = () => {
    const val = Math.round(Number(newBallsPerDrop));
    if (!Number.isFinite(val) || val <= 0) return;
    const current = config.ballsPerDropOptions || [];
    if (!current.includes(val)) {
      const next = [...current, val].sort((a, b) => a - b);
      withAutoLimits(config.betPerBallOptionsCents || [], next);
    }
    setNewBallsPerDrop('');
  };

  const removeBallsPerDrop = (balls) => {
    const current = config.ballsPerDropOptions || [];
    if (current.length <= 1) return;
    const next = current.filter((b) => b !== balls);
    const nextDefault = next.includes(config.defaultBallsPerDrop)
      ? config.defaultBallsPerDrop
      : next[0];
    withAutoLimits(config.betPerBallOptionsCents || [], next, {
      defaultBallsPerDrop: nextDefault,
    });
  };

  const addAutoDropCount = () => {
    const val = Math.round(Number(newAutoDrop));
    if (!Number.isFinite(val) || val <= 0) return;
    const current = config.autoDropCounts || [];
    if (!current.includes(val)) {
      const next = [...current, val].sort((a, b) => a - b);
      onChange({
        ...config,
        autoDropCounts: next,
        maxAutoDropCount: Math.max(...next),
      });
    }
    setNewAutoDrop('');
  };

  const removeAutoDropCount = (count) => {
    const current = config.autoDropCounts || [];
    if (current.length <= 1) return;
    const next = current.filter((c) => c !== count);
    onChange({
      ...config,
      autoDropCounts: next,
      maxAutoDropCount: Math.max(...next),
    });
  };

  return (
    <div className="space-y-4">
      {validationErrors?.length > 0 && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-xs text-red-200 space-y-1">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <Panel title="Core Game Rules" subtitle="Game availability, Bet Per Ball, Balls Per Drop, and payout limits">
        <div className="space-y-5">
          {/* Game Enabled Row */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0b0e14] px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-white">Game Enabled</div>
              <div className="text-[11px] text-slate-400">Allow players to start new paid drops</div>
            </div>
            <Toggle
              checked={Boolean(config.gameEnabled)}
              onChange={(v) => onChange({ ...config, gameEnabled: v })}
              label={config.gameEnabled ? 'On' : 'Paused'}
            />
          </div>

          {/* Bet Per Ball & Balls Per Drop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bet Per Ball Card */}
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-4 flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">Bet Per Ball</div>
                    <div className="text-[11px] text-slate-400">Allowed stakes in demo credits</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">Default</span>
                    <select
                      value={config.defaultBetPerBallCents}
                      onChange={(e) =>
                        onChange({ ...config, defaultBetPerBallCents: Number(e.target.value) })
                      }
                      className="rounded-md border border-white/[0.1] bg-[#131822] px-2.5 py-1 text-xs text-white font-mono focus:border-rose-500/60 focus:outline-none"
                    >
                      {(config.betPerBallOptionsCents || []).map((c) => (
                        <option key={c} value={c}>
                          {(c / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(config.betPerBallOptionsCents || []).map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#131822] px-2.5 py-1 text-xs font-mono text-white"
                    >
                      {(c / 100).toFixed(2)}
                      {(config.betPerBallOptionsCents || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBetPerBall(c)}
                          className="text-slate-400 hover:text-rose-400 transition"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <NumberField
                  step="0.5"
                  min="0.1"
                  value={newBetPerBall}
                  onChange={(e) => setNewBetPerBall(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBetPerBall();
                    }
                  }}
                  placeholder="Add bet (e.g. 10)"
                  className="w-full bg-[#131822]"
                />
                <button
                  type="button"
                  onClick={addBetPerBall}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Balls Per Drop Card */}
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-4 flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">Balls Per Drop</div>
                    <div className="text-[11px] text-slate-400">Allowed ball counts per round</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">Default</span>
                    <select
                      value={config.defaultBallsPerDrop}
                      onChange={(e) =>
                        onChange({ ...config, defaultBallsPerDrop: Number(e.target.value) })
                      }
                      className="rounded-md border border-white/[0.1] bg-[#131822] px-2.5 py-1 text-xs text-white font-mono focus:border-rose-500/60 focus:outline-none"
                    >
                      {(config.ballsPerDropOptions || []).map((b) => (
                        <option key={b} value={b}>
                          {b} balls
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(config.ballsPerDropOptions || []).map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#131822] px-2.5 py-1 text-xs font-mono text-white"
                    >
                      {b}
                      {(config.ballsPerDropOptions || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBallsPerDrop(b)}
                          className="text-slate-400 hover:text-rose-400 transition"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                <NumberField
                  step="1"
                  min="1"
                  value={newBallsPerDrop}
                  onChange={(e) => setNewBallsPerDrop(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBallsPerDrop();
                    }
                  }}
                  placeholder="Add balls (e.g. 15)"
                  className="w-full bg-[#131822]"
                />
                <button
                  type="button"
                  onClick={addBallsPerDrop}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Auto Drop Options Card */}
          <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-white">Auto Drop Limit</div>
                <div className="text-[11px] text-slate-400">
                  Allowed Auto Drop round counts (Max limit: <span className="font-mono text-emerald-400">{config.maxAutoDropCount || 20}</span>)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NumberField
                  step="1"
                  min="1"
                  value={newAutoDrop}
                  onChange={(e) => setNewAutoDrop(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAutoDropCount();
                    }
                  }}
                  placeholder="Add count (e.g. 50)"
                  className="w-36 bg-[#131822]"
                />
                <button
                  type="button"
                  onClick={addAutoDropCount}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(config.autoDropCounts || []).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#131822] px-2.5 py-1 text-xs font-mono text-white"
                >
                  {c}
                  {(config.autoDropCounts || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAutoDropCount(c)}
                      className="text-slate-400 hover:text-rose-400 transition"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Limits Row (Auto-calculated & read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-400">Min Total Bet</label>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Auto</span>
              </div>
              <div className="w-full rounded-md border border-white/[0.06] bg-[#131822]/70 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-300 select-none">
                {formatCredits(
                  (config.betPerBallOptionsCents?.length && config.ballsPerDropOptions?.length)
                    ? Math.min(...config.betPerBallOptionsCents) * Math.min(...config.ballsPerDropOptions)
                    : config.minBetCents
                )}
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-400">Max Total Bet</label>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Auto</span>
              </div>
              <div className="w-full rounded-md border border-white/[0.06] bg-[#131822]/70 px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-300 select-none">
                {formatCredits(
                  (config.betPerBallOptionsCents?.length && config.ballsPerDropOptions?.length)
                    ? Math.max(...config.betPerBallOptionsCents) * Math.max(...config.ballsPerDropOptions)
                    : config.maxTotalBetCents
                )}
              </div>
            </div>
            <div className="rounded-lg border border-white/[0.07] bg-[#0b0e14] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-400">Max Round Payout</label>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Auto</span>
              </div>
              <div className="w-full rounded-md border border-white/[0.06] bg-[#131822]/70 px-2.5 py-1.5 text-xs font-mono tabular-nums text-amber-400 select-none">
                {formatCredits(
                  (config.betPerBallOptionsCents?.length && config.ballsPerDropOptions?.length)
                    ? Math.max(...config.betPerBallOptionsCents) * Math.max(...config.ballsPerDropOptions) * 2
                    : config.payoutCapCents
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export const FreeSpinView = ({ config, onChange, previewData, validationErrors }) => {
  const outcomes = config.wheelOutcomes || [];
  const totalWeightBps = outcomes.reduce((sum, o) => sum + Math.max(0, Number(o.weightBps || 0)), 0);
  const totalPct = totalWeightBps / 100;

  const updateOutcome = (idx, patch) => {
    const next = outcomes.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    onChange({ ...config, wheelOutcomes: next });
  };

  const addOutcome = () => {
    const nextId = `OUTCOME_${outcomes.length + 1}`;
    onChange({
      ...config,
      wheelOutcomes: [
        ...outcomes,
        {
          id: nextId,
          label: '3x',
          wedgeLabel: '3x',
          type: 'MULTIPLIER',
          num: 3,
          den: 1,
          weightBps: 0,
          color: '#0284c7',
        },
      ],
    });
  };

  const removeOutcome = (idx) => {
    if (outcomes.length <= 1) return;
    onChange({
      ...config,
      wheelOutcomes: outcomes.filter((_, i) => i !== idx),
    });
  };

  const est = previewData?.estimate;
  const targetRtp = Number(config.targetRtpPct ?? 92);
  const targetMargin = Math.round((100 - targetRtp) * 100) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Left: Free Spin Settings Form */}
      <div className="lg:col-span-7 space-y-4">
        <Panel title="Free Spin Settings" subtitle="Configure spin triggers, carryover, and wheel probability weights">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-medium text-white">Free Spin Enabled</span>
              <Toggle
                checked={Boolean(config.freeSpinEnabled)}
                onChange={(v) => onChange({ ...config, freeSpinEnabled: v })}
                label={config.freeSpinEnabled ? 'On' : 'Off'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Points per SPIN Hit</label>
                <NumberField
                  min="0"
                  value={config.spinPointsPerHit ?? 1}
                  onChange={(e) =>
                    onChange({ ...config, spinPointsPerHit: Math.max(0, Math.round(Number(e.target.value))) })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Points Required</label>
                <NumberField
                  min="1"
                  value={config.spinPointsThreshold ?? 10}
                  onChange={(e) =>
                    onChange({ ...config, spinPointsThreshold: Math.max(1, Math.round(Number(e.target.value))) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-white/[0.06] pb-3">
              <div>
                <div className="text-xs font-medium text-white">Carry Forward</div>
                <div className="text-[11px] text-slate-400">Keep remaining points after a Free Spin is used.</div>
              </div>
              <Toggle
                checked={Boolean(config.carryForwardPoints)}
                onChange={(v) => onChange({ ...config, carryForwardPoints: v })}
                label={config.carryForwardPoints ? 'On' : 'Off'}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-semibold text-white">Wheel Outcomes</h3>
                  <p className="text-[11px] text-slate-400">
                    Define outcome IDs, types, multipliers, colors, and fixed-point weights (total = 100%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOutcome}
                  className="inline-flex items-center gap-1 rounded border border-white/[0.10] bg-[#0b0e14] px-2.5 py-1 text-[11px] text-emerald-400 hover:border-emerald-400"
                >
                  <Plus className="w-3 h-3" /> Add Outcome
                </button>
              </div>

              <div className="overflow-x-auto rounded border border-white/[0.08]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0e14] text-slate-300 border-b border-white/[0.07]">
                    <tr>
                      <th className="px-2.5 py-2">ID / Label</th>
                      <th className="px-2.5 py-2">Type</th>
                      <th className="px-2.5 py-2">Multiplier</th>
                      <th className="px-2.5 py-2">Weight %</th>
                      <th className="px-2.5 py-2">Color</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] bg-[#0b0e14]/70">
                    {outcomes.map((o, idx) => (
                      <tr key={o.id || idx}>
                        <td className="px-2.5 py-2 space-y-1">
                          <input
                            value={o.label}
                            onChange={(e) => updateOutcome(idx, { label: e.target.value, wedgeLabel: e.target.value })}
                            placeholder="Label"
                            className="w-28 rounded border border-white/[0.08] bg-[#0b0e14] px-2 py-1 text-xs text-white"
                          />
                          <input
                            value={o.id}
                            onChange={(e) => updateOutcome(idx, { id: e.target.value })}
                            placeholder="ID"
                            className="w-28 block rounded border border-white/[0.06] bg-[#0b0e14] px-2 py-0.5 text-[10px] font-mono text-slate-400"
                          />
                        </td>
                        <td className="px-2.5 py-2">
                          <select
                            value={o.type || (o.num === 0 ? 'NO_WIN' : 'MULTIPLIER')}
                            onChange={(e) => {
                              const t = e.target.value;
                              updateOutcome(idx, {
                                type: t,
                                num: t === 'NO_WIN' ? 0 : Math.max(1, o.num || 1),
                                den: 1,
                              });
                            }}
                            className="rounded border border-white/[0.08] bg-[#0b0e14] px-2 py-1 text-xs text-white"
                          >
                            <option value="NO_WIN">NO_WIN</option>
                            <option value="MULTIPLIER">MULTIPLIER</option>
                          </select>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1">
                            <NumberField
                              value={o.num}
                              disabled={o.type === 'NO_WIN'}
                              onChange={(e) =>
                                updateOutcome(idx, { num: Math.max(0, Math.round(Number(e.target.value))) })
                              }
                              className="w-14"
                            />
                            <span className="text-slate-400">x</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1">
                            <NumberField
                              step="0.5"
                              value={Number(((o.weightBps || 0) / 100).toFixed(2))}
                              onChange={(e) =>
                                updateOutcome(idx, {
                                  weightBps: Math.max(0, Math.round(Number(e.target.value) * 100)),
                                })
                              }
                              className="w-16"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="px-2.5 py-2">
                          <input
                            type="color"
                            value={o.color || '#14b8a6'}
                            onChange={(e) => updateOutcome(idx, { color: e.target.value })}
                            className="h-6 w-8 rounded border border-white/[0.08] bg-transparent cursor-pointer"
                          />
                        </td>
                        <td className="px-2.5 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeOutcome(idx)}
                            className="p-1 text-slate-400 hover:text-red-400"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0b0e14] border-t border-white/[0.08]">
                    <tr>
                      <td colSpan={3} className="px-2.5 py-2 font-semibold text-white">
                        Total Weight
                      </td>
                      <td
                        colSpan={3}
                        className={`px-2.5 py-2 font-mono font-bold ${totalWeightBps === 10000 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                      >
                        {totalPct.toFixed(2)}% ({totalWeightBps} bps)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {validationErrors?.length > 0 && (
              <div className="rounded border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-200 space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Right: Wheel Preview + Payout & Profit Preview */}
      <div className="lg:col-span-5 space-y-4">
        <Panel
          title="Wheel Preview"
          subtitle={`Originating payout basis: ${((config.defaultBetPerBallCents || 50) / 100).toFixed(2)} credits / ball`}
        >
          <WheelPreviewSvg outcomes={outcomes} />
        </Panel>

        <Panel
          title="Payout & Profit Preview"
          right={
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
              Demo Credits
            </span>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <label className="text-slate-300">Target Margin</label>
              <div className="flex items-center gap-1">
                <NumberField
                  step="0.5"
                  value={targetMargin}
                  onChange={(e) => {
                    const m = Math.min(99, Math.max(0.1, Number(e.target.value)));
                    onChange({ ...config, targetRtpPct: Math.round((100 - m) * 100) / 100 });
                  }}
                  className="w-20 text-right"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-slate-300">Target RTP</label>
              <div className="flex items-center gap-1">
                <NumberField
                  step="0.5"
                  value={targetRtp}
                  onChange={(e) => {
                    const r = Math.min(99.9, Math.max(1, Number(e.target.value)));
                    onChange({ ...config, targetRtpPct: r });
                  }}
                  className="w-20 text-right"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Estimated RTP</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {est ? `${est.totalEstimatedRtpPct.toFixed(2)}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Estimated Margin</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {est ? `${est.estimatedMarginPct.toFixed(2)}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export const PayoutProfitView = ({
  config,
  onChange,
  previewData,
  selectedStakeCents,
  selectedBallCount,
  onSelectStake,
  onSelectBalls,
  payoutReport,
}) => {
  const est = previewData?.estimate;
  const targetRtp = Number(config.targetRtpPct ?? 92);
  const targetMargin = Math.round((100 - targetRtp) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Analysis Controls */}
        <div className="lg:col-span-6 space-y-4">
          <Panel
            title="RTP & Margin Analysis"
            subtitle="Analysis-only target; payout rules change only when publishing a configuration"
          >
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Target Margin (%)</label>
                  <NumberField
                    step="0.5"
                    value={targetMargin}
                    onChange={(e) => {
                      const m = Math.min(99, Math.max(0.1, Number(e.target.value)));
                      onChange({ ...config, targetRtpPct: Math.round((100 - m) * 100) / 100 });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Target RTP (%)</label>
                  <NumberField
                    step="0.5"
                    value={targetRtp}
                    onChange={(e) => {
                      const r = Math.min(99.9, Math.max(1, Number(e.target.value)));
                      onChange({ ...config, targetRtpPct: r });
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              {est && (
                <div className="rounded border border-white/[0.07] bg-[#0b0e14] p-3 text-[11px] text-slate-400 space-y-1">
                  <div>
                    <strong className="text-white">Sample Size:</strong>{' '}
                    {est.simulationSampleSize.toLocaleString()} simulated rounds
                  </div>
                  <div>{est.assumptions}</div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Right: Live Estimate Output */}
        <div className="lg:col-span-6 space-y-4">
          <Panel title="Estimated Payout Breakdown" subtitle="Theoretical model for selected stake & ball count">
            {est ? (
              <div className="space-y-2.5 text-xs">
                <Row label="Base-Game RTP (Binomial 14)" value={`${est.baseRtpPct.toFixed(2)}%`} />
                <Row label="Free Spin Wheel Contribution" value={`${est.wheelContributionPct.toFixed(2)}%`} />
                <Row
                  label="Total Estimated RTP (Capped)"
                  value={`${est.totalEstimatedRtpPct.toFixed(2)}%`}
                  highlight
                />
                <Row label="Estimated Margin" value={`${est.estimatedMarginPct.toFixed(2)}%`} highlight />
                <Row
                  label="Difference from Target RTP"
                  value={`${est.diffFromTargetRtpPct >= 0 ? '+' : ''}${est.diffFromTargetRtpPct.toFixed(2)}%`}
                />
                <Row label="SPIN Slot Hit Probability" value={`${est.spinTriggerProbabilityPct.toFixed(2)}%`} />
              </div>
            ) : (
              <div className="text-xs text-slate-400">Click Validate & Preview to compute estimate.</div>
            )}
          </Panel>
        </div>
      </div>

      {/* Global RTP & Historical Settlements (All Players' Settled Rounds) */}
      <Panel
        title="Global RTP & Historical Settlements (All Players)"
        subtitle="Computed across all players' settled rounds (Board + originating-round Free Spin payouts)"
        badge={
          payoutReport?.hasIncompletePeriods ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
              Incomplete Period ({payoutReport.pendingSpinsCount} Pending Spins)
            </span>
          ) : (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              All Periods Settled
            </span>
          )
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <StatBox label="Settled Rounds" value={payoutReport?.totalRounds ?? 0} />
            <StatBox label="Total Wagered" value={formatCredits(payoutReport?.totalWageredCents)} />
            <StatBox
              label="Total Paid"
              value={formatCredits(payoutReport?.totalGrossPayoutCents)}
            />
            <StatBox label="Net Credits" value={formatCredits(payoutReport?.netCreditsCents)} />
            <StatBox label="Global RTP" value={`${(payoutReport?.historicalRtpPct ?? 0).toFixed(2)}%`} />
            <StatBox
              label="Pending Spins"
              value={`${payoutReport?.pendingSpinsCount ?? 0} (${formatCredits(payoutReport?.pendingSpinsBetBasisSumCents)} basis)`}
            />
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0b0e14] px-3.5 py-2.5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              Board Payout: <strong className="font-mono text-slate-200">{formatCredits(payoutReport?.totalBoardPayoutCents)}</strong>
              {' · '}
              Free Spin Wheel Payout (attached to origin round): <strong className="font-mono text-slate-200">{formatCredits(payoutReport?.totalWheelPayoutCents)}</strong>
            </span>
            <span className="text-amber-400/90">
              92% RTP (8% margin) is a long-term target; per-player/session results vary under the same published rules.
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export const ConfigHistoryView = ({ versions = [], onCompare, compareResult }) => {
  const publishedOrArchived = versions.filter((v) => v.version > 0);
  const [v1, setV1] = useState(publishedOrArchived[1]?.version || publishedOrArchived[0]?.version || 1);
  const [v2, setV2] = useState(publishedOrArchived[0]?.version || 1);

  return (
    <div className="space-y-4">
      <Panel
        title="Configuration Versions"
        subtitle="Published & archived snapshots with publish reasons"
        right={
          publishedOrArchived.length >= 2 && (
            <div className="flex items-center gap-2 text-xs">
              <select
                value={v1}
                onChange={(e) => setV1(Number(e.target.value))}
                className="rounded border border-white/[0.08] bg-[#0b0e14] px-2 py-1 text-xs text-white"
              >
                {publishedOrArchived.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">vs</span>
              <select
                value={v2}
                onChange={(e) => setV2(Number(e.target.value))}
                className="rounded border border-white/[0.08] bg-[#0b0e14] px-2 py-1 text-xs text-white"
              >
                {publishedOrArchived.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onCompare(v1, v2)}
                className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
              >
                <GitCompare className="w-3.5 h-3.5" /> Compare
              </button>
            </div>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
              <tr>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Publish Reason</th>
                <th className="px-3 py-2">Published By</th>
                <th className="px-3 py-2">Free Spin</th>
                <th className="px-3 py-2">Payout Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {versions.map((v, idx) => (
                <tr key={v.id || idx}>
                  <td className="px-3 py-2 font-mono font-semibold text-white">
                    {v.version > 0 ? `v${v.version}` : 'Draft'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.status === 'PUBLISHED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : v.status === 'DRAFT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'bg-slate-800 text-slate-300'
                        }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{v.publishReason || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{v.publishedBy || '—'}</td>
                  <td className="px-3 py-2 text-slate-200">
                    {v.freeSpinEnabled ? `ON (${v.spinPointsThreshold} pts)` : 'OFF'}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-200">{formatCredits(v.payoutCapCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {compareResult && (
        <Panel title={`Comparison: v${compareResult.fromVersion} vs v${compareResult.toVersion}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-white/[0.07] bg-[#0b0e14] p-3 space-y-1">
              <div className="font-semibold text-white">v{compareResult.fromVersion}</div>
              <div className="text-slate-400">Free Spin: {compareResult.from?.freeSpinEnabled ? 'ON' : 'OFF'}</div>
              <div className="text-slate-400">Payout Cap: {formatCredits(compareResult.from?.payoutCapCents)}</div>
              <div className="text-slate-400">Spin Threshold: {compareResult.from?.spinPointsThreshold}</div>
            </div>
            <div className="rounded border border-emerald-500/30 bg-[#0b0e14] p-3 space-y-1">
              <div className="font-semibold text-emerald-400">v{compareResult.toVersion}</div>
              <div className="text-slate-400">Free Spin: {compareResult.to?.freeSpinEnabled ? 'ON' : 'OFF'}</div>
              <div className="text-slate-400">Payout Cap: {formatCredits(compareResult.to?.payoutCapCents)}</div>
              <div className="text-slate-400">Spin Threshold: {compareResult.to?.spinPointsThreshold}</div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
};

export const AdminAuditView = ({ logs = [] }) => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? logs.filter((l) =>
      [l.adminUsername, l.action, l.targetType, l.targetId, l.summary]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
    : logs;

  return (
    <Panel
      title="Admin Audit Log"
      subtitle="Immutable record of config drafts, publishes, wallet adjustments, and player changes"
      right={<SearchInput value={query} onChange={setQuery} placeholder="Search audit logs..." />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0e14] text-slate-400 border-b border-white/[0.07]">
            <tr>
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  No audit entries found.
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 font-medium text-white">{l.adminUsername}</td>
                  <td className="px-3 py-2 font-mono text-emerald-400">{l.action}</td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {l.targetType}:{l.targetId}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{l.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

const Row = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
    <span className="text-slate-300">{label}</span>
    <span className={`font-mono font-semibold ${highlight ? 'text-emerald-400 text-sm' : 'text-white'}`}>
      {value}
    </span>
  </div>
);

const StatBox = ({ label, value }) => (
  <div className="rounded border border-white/[0.07] bg-[#0b0e14] p-3">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className="text-sm font-semibold font-mono text-white mt-1">{value}</div>
  </div>
);
