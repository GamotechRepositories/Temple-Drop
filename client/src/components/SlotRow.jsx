import React from 'react';

export const SLOTS_DATA = [
  { index: 0, label: '100', multiplier: '100×', color: '#ec4899', glow: 'rgba(236,72,153,0.8)', textColor: '#ffffff' },
  { index: 1, label: '50', multiplier: '50×', color: '#f43f5e', glow: 'rgba(244,63,94,0.8)', textColor: '#ffffff' },
  { index: 2, label: '20', multiplier: '20×', color: '#ef4444', glow: 'rgba(239,68,68,0.8)', textColor: '#ffffff' },
  { index: 3, label: '10', multiplier: '10×', color: '#f97316', glow: 'rgba(249,115,22,0.8)', textColor: '#ffffff' },
  { index: 4, label: '2', multiplier: '2×', color: '#f59e0b', glow: 'rgba(245,158,11,0.8)', textColor: '#ffffff' },
  { index: 5, label: '0.5', multiplier: '0.5×', color: '#eab308', glow: 'rgba(234,179,8,0.8)', textColor: '#422006' },
  { index: 6, label: '0.2', multiplier: '0.2×', color: '#fef08a', glow: 'rgba(254,240,138,0.8)', textColor: '#422006' },
  { index: 7, label: 'SPIN', multiplier: 'SPIN', isSpin: true, color: '#06b6d4', glow: 'rgba(6,182,212,0.95)', textColor: '#ffffff' },
  { index: 8, label: '0.2', multiplier: '0.2×', color: '#fef08a', glow: 'rgba(254,240,138,0.8)', textColor: '#422006' },
  { index: 9, label: '0.5', multiplier: '0.5×', color: '#eab308', glow: 'rgba(234,179,8,0.8)', textColor: '#422006' },
  { index: 10, label: '2', multiplier: '2×', color: '#f59e0b', glow: 'rgba(245,158,11,0.8)', textColor: '#ffffff' },
  { index: 11, label: '10', multiplier: '10×', color: '#f97316', glow: 'rgba(249,115,22,0.8)', textColor: '#ffffff' },
  { index: 12, label: '20', multiplier: '20×', color: '#ef4444', glow: 'rgba(239,68,68,0.8)', textColor: '#ffffff' },
  { index: 13, label: '50', multiplier: '50×', color: '#f43f5e', glow: 'rgba(244,63,94,0.8)', textColor: '#ffffff' },
  { index: 14, label: '100', multiplier: '100×', color: '#ec4899', glow: 'rgba(236,72,153,0.8)', textColor: '#ffffff' },
];

export const SlotRow = ({ activeSlotFlashes = {} }) => {
  return (
    <div className="w-full mx-auto select-none">
      {/* 15 Vertical Chutes Row immediately above labels */}
      <div className="grid grid-cols-15 gap-[1.5px] h-8 sm:h-9 items-end mb-1">
        {SLOTS_DATA.map((slot) => {
          const isFlashed = Boolean(activeSlotFlashes[slot.index]);
          return (
            <div
              key={`chute-${slot.index}`}
              className="relative h-full flex flex-col justify-end items-center"
            >
              {/* Vertical transparent/illuminated guide chute */}
              <div
                className={`w-full rounded-t-sm transition-all duration-150 relative overflow-hidden ${
                  isFlashed ? 'h-full opacity-100' : 'h-3/4 opacity-40'
                }`}
                style={{
                  background: isFlashed
                    ? `linear-gradient(to top, ${slot.glow}, rgba(255,255,255,0.4))`
                    : 'linear-gradient(to top, rgba(255,255,255,0.08), transparent)',
                  borderLeft: '1px solid rgba(255,255,255,0.1)',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isFlashed ? `0 0 12px ${slot.glow}` : 'none',
                }}
              >
                {/* Guide pin indicator at the top of chute */}
                <div
                  className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${
                    isFlashed ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-slate-500/50'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 15 Landing Slot Buttons */}
      <div className="grid grid-cols-15 gap-[2px] items-stretch">
        {SLOTS_DATA.map((slot) => {
          const isFlashed = Boolean(activeSlotFlashes[slot.index]);
          const isSpin = slot.isSpin;

          return (
            <div
              key={`slot-${slot.index}`}
              className={`relative flex items-center justify-center rounded-[3px] py-1 transition-all duration-150 transform cursor-default ${
                isFlashed ? '-translate-y-0.5 scale-105 z-10' : ''
              }`}
              style={{
                backgroundColor: slot.color,
                color: slot.textColor,
                boxShadow: isFlashed
                  ? `0 0 16px ${slot.glow}, 0 2px 8px rgba(0,0,0,0.8)`
                  : '0 2px 4px rgba(0,0,0,0.5)',
                border: isSpin
                  ? '1.5px solid #a5f3fc'
                  : isFlashed
                  ? '1px solid #ffffff'
                  : '1px solid rgba(0,0,0,0.2)',
              }}
            >
              <span
                className={`tracking-tighter leading-none text-center font-bold ${
                  isSpin
                    ? 'text-[10px] sm:text-[11px] font-black'
                    : 'text-[9px] sm:text-[10px]'
                }`}
              >
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
