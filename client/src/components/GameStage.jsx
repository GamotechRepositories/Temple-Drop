import React, { useState } from 'react';
import { PlinkoBoard } from './PlinkoBoard.jsx';
import { SlotRow } from './SlotRow.jsx';
import { SpinMeter } from './SpinMeter.jsx';
import { GameControls } from './GameControls.jsx';
import { BackgroundAnimation } from './BackgroundAnimation.jsx';
import { soundManager } from '../audio/soundManager.js';

export const GameStage = ({
  // Ball drop & board props
  ballsToAnimate,
  onAnimationComplete,
  fastMode,
  onToggleFastMode,
  reducedMotion,

  // Meter props
  spinPoints = 0,
  energyPoints = 0,
  pendingFeatures = [],
  activeBonus = null,
  onOpenWheel,

  // Control props
  betPerBallCents,
  ballCount,
  onChangeBet,
  onChangeBallCount,
  isDropping,
  onDrop,
  onBonusDrop,
  autoDropCount,
  onStartAutoDrop,
  onStopAutoDrop,
  lastWinCents = 0,
  currencySymbol = '₹',
}) => {
  // Flash states for the 15 chutes and slots
  const [activeSlotFlashes, setActiveSlotFlashes] = useState({});

  const handleBallLand = (slotIndex) => {
    setActiveSlotFlashes((prev) => ({ ...prev, [slotIndex]: true }));
    // Auto-clear flash after 250ms
    setTimeout(() => {
      setActiveSlotFlashes((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
    }, 280);
  };

  const pendingSpinsCount = pendingFeatures.filter((f) => f.type === 'WHEEL_SPIN').length;
  const energyPercent = activeBonus
    ? Math.min(100, (activeBonus.bonusEnergy / 100) * 100)
    : Math.min(100, (energyPoints / 100) * 100);

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center sm:justify-between pt-3.5 sm:pt-1 pb-1 sm:pb-1.5 overflow-hidden py-0 select-none">
      {/* ========================================================
          1. EGYPTIAN DESERT NIGHT WEBP BACKGROUND
      ======================================================== */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Mobile View Background (<640px) */}
        <img
          src="/images/bg-mobile.webp"
          alt="Egyptian Desert Night Mobile"
          className="block sm:hidden w-full h-full object-cover object-center pointer-events-none select-none"
        />
        {/* Desktop / Tablet View Background (>=640px) */}
        <img
          src="/images/bg-jungle.webp"
          alt="Egyptian Desert Night Desktop"
          className="hidden sm:block w-full h-full object-fill pointer-events-none select-none"
        />
        {/* Background Atmospheric Flying Animations (Birds, Embers, Shooting Star) */}
        <BackgroundAnimation />
        {/* Subtle dark gradient behind bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      {/* ========================================================
          2. STEPPED SANDSTONE TEMPLE SHRINE (Using WebP Frame)
      ======================================================== */}
      <div className="relative z-10 w-[99%] max-w-[min(412px,calc((100dvh-265px)*0.98))] tall-mobile-temple sm:max-w-[min(550px,calc((100vh-170px)*1.08))] flex flex-col items-center select-none">
        {/* Frame Outer Wrapper matching aspect ratio (1024 / 595 = 1.72) */}
        <div className="relative w-full aspect-[1024/595] flex flex-col items-center justify-between">
          {/* Temple Frame WebP Image Overlaid */}
          <img
            src="/images/temple-frame.webp"
            alt="Temple Shrine Frame"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20 drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
          />

          {/* Plinko Board Canvas */}
          <div className="w-full flex justify-center">
            {/* Inner Peg Field (Plinko Canvas) */}
            <div className="w-[79%] pt-[14%] flex justify-center z-10">
              <PlinkoBoard
                ballsToAnimate={ballsToAnimate}
                onAnimationComplete={onAnimationComplete}
                onBallLand={handleBallLand}
                fastMode={fastMode}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>

          {/* 15 Landing Chutes & Slots Row */}
          <div className="w-[79%] pb-[11%] z-20">
            <SlotRow activeSlotFlashes={activeSlotFlashes} />
          </div>
        </div>
      </div>

      {/* ========================================================
          3 & 4. BOTTOM METERS & CONTROL TRAY
      ======================================================== */}
      <div className="relative z-20 w-full flex flex-col items-center mt-auto sm:mt-0 mb-1 sm:mb-1">
        {/* Desktop Feature Meters */}
        <div className="hidden sm:flex relative z-20 w-full max-w-[940px] px-2 sm:px-3 items-end justify-between -mt-2 sm:-mt-8 mb-1">
          {/* FAST GAME Pill Switch above left edge of tray */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2.5 cursor-pointer bg-[#131b2e] border border-slate-700/80 rounded-xl px-3.5 py-1.5 shadow-md hover:border-slate-500 transition-all select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                FAST GAME
              </span>
              <input
                type="checkbox"
                checked={fastMode}
                onChange={() => {
                  soundManager.playButtonClick();
                  onToggleFastMode();
                }}
                className="sr-only"
              />
              {/* Custom slider pill */}
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${fastMode ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${fastMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
              </div>
            </label>
          </div>

          {/* FREE SPIN Progress Bar and Mini Wheel Icon above right edge of tray */}
          <div className="flex items-center">
            <SpinMeter
              spinPoints={spinPoints}
              pendingSpinsCount={pendingSpinsCount}
              onOpenWheel={onOpenWheel}
              disabled={isDropping}
            />
          </div>
        </div>

        {/* Control Tray */}
        <GameControls
          betPerBallCents={betPerBallCents}
          ballCount={ballCount}
          onChangeBet={onChangeBet}
          onChangeBallCount={onChangeBallCount}
          isDropping={isDropping}
          hasPendingFeatures={pendingFeatures.length > 0}
          pendingSpinsCount={pendingSpinsCount}
          spinPoints={spinPoints}
          fastMode={fastMode}
          onToggleFastMode={onToggleFastMode}
          hasActiveBonus={Boolean(activeBonus)}
          activeBonus={activeBonus}
          onDrop={onDrop}
          onOpenWheel={onOpenWheel}
          onBonusDrop={onBonusDrop}
          autoDropCount={autoDropCount}
          onStartAutoDrop={onStartAutoDrop}
          onStopAutoDrop={onStopAutoDrop}
          lastWinCents={lastWinCents}
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
};
