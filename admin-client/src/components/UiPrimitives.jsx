import React, { useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

export const Panel = ({ title, subtitle, badge, right, children, className = '' }) => (
  <section
    className={`rounded-xl border border-white/[0.08] bg-[#131822] shadow-lg shadow-black/30 ${className}`}
  >
    {(title || right || badge) && (
      <div className="px-4 py-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div>
            {title && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {badge}
        </div>
        {right}
      </div>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2.5 focus:outline-none"
  >
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </span>
    {label && <span className="text-xs font-medium text-slate-200">{label}</span>}
  </button>
);

export const NumberField = ({ value, onChange, className = '', ...props }) => (
  <input
    {...props}
    type="number"
    value={value}
    onChange={onChange}
    onWheel={(e) => e.currentTarget.blur()}
    className={`rounded-lg border border-white/[0.08] bg-[#0b0e14] px-2.5 py-1.5 text-xs text-white font-mono tabular-nums focus:border-rose-500/60 focus:outline-none ${className}`}
  />
);

export const PasswordInput = ({ className = '', ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full rounded-lg border border-white/[0.08] bg-[#0b0e14] pl-3 pr-9 py-2 text-xs text-white focus:border-rose-500/60 focus:outline-none ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

export const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative w-full sm:w-60">
    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/[0.08] bg-[#0b0e14] pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-rose-500/60 focus:outline-none"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

export const Modal = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-md rounded-xl border border-white/[0.1] bg-[#131822] p-5 space-y-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const WheelPreviewSvg = ({ outcomes = [] }) => {
  const totalWeight = outcomes.reduce((acc, o) => acc + Math.max(0, Number(o.weightBps || 0)), 0);
  const cx = 130;
  const cy = 130;
  const r = 104;

  let currentDeg = -90;
  const wedges = outcomes.map((o, idx) => {
    const w = Math.max(0, Number(o.weightBps || 0));
    const span = totalWeight > 0 ? (w / totalWeight) * 360 : 360 / Math.max(1, outcomes.length);
    const startDeg = currentDeg;
    const endDeg = currentDeg + span;
    currentDeg = endDeg;

    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = span > 180 ? 1 : 0;

    const midRad = (((startDeg + endDeg) / 2) * Math.PI) / 180;
    const tx = cx + r * 0.62 * Math.cos(midRad);
    const ty = cy + r * 0.62 * Math.sin(midRad);

    const pathD =
      span >= 359.9
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const displayLabel =
      o.type === 'NO_WIN' ? o.wedgeLabel || 'NO WIN' : o.wedgeLabel || o.label || `${o.num}x`;

    return {
      key: o.id || idx,
      pathD,
      color: o.color || '#10b981',
      tx,
      ty,
      displayLabel,
      span,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg viewBox="0 0 260 260" className="w-56 h-56 drop-shadow-xl">
        <circle cx={cx} cy={cy} r={116} fill="#0b0e14" stroke="#334155" strokeWidth="5" />
        <circle cx={cx} cy={cy} r={108} fill="none" stroke="#475569" strokeWidth="1.5" />

        {wedges.map((w) => (
          <g key={w.key}>
            <path d={w.pathD} fill={w.color} stroke="#0b0e14" strokeWidth="1.5" />
            {w.span >= 18 && (
              <text
                x={w.tx}
                y={w.ty}
                fill="#ffffff"
                fontSize={w.displayLabel.length > 5 ? '10' : '13'}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {w.displayLabel}
              </text>
            )}
          </g>
        ))}

        <circle cx={cx} cy={cy} r={22} fill="#131822" stroke="#475569" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={12} fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
        <polygon points="130,24 120,6 140,6" fill="#10b981" stroke="#0b0e14" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
