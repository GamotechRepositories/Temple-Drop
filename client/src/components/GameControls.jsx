import React, { useState } from 'react';
import { Play, Square, ChevronUp, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';
import { SpinMeter } from './SpinMeter.jsx';

export const GameControls = ({
  betPerBallCents,
  ballCount,
  onChangeBet,
  onChangeBallCount,
  isDropping,
  betCountdown = null,
  onCancelBetCountdown,
  hasPendingFeatures,
  pendingSpinsCount = 0,
  spinPoints = 0,
  fastMode = false,
  onToggleFastMode,
  hasActiveBonus,
  activeBonus,
  onDrop,
  onOpenWheel,
  onBonusDrop,
  autoDropCount,
  onStartAutoDrop,
  onStopAutoDrop,
  lastWinCents = 0,
  currencySymbol = '₹',
}) => {
  const [showAutoDropdown, setShowAutoDropdown] = useState(false);

  const betOptions = GAME_CONFIG.BET_PER_BALL_OPTIONS_CENTS;
  const ballOptions = GAME_CONFIG.BALLS_PER_DROP_OPTIONS;

  const currentBetIndex = betOptions.indexOf(betPerBallCents);
  const currentBallIndex = ballOptions.indexOf(ballCount);

  const handlePrevBet = () => {
    soundManager.playButtonClick();
    if (currentBetIndex > 0) {
      onChangeBet(betOptions[currentBetIndex - 1]);
    }
  };

  const handleNextBet = () => {
    soundManager.playButtonClick();
    if (currentBetIndex < betOptions.length - 1) {
      onChangeBet(betOptions[currentBetIndex + 1]);
    }
  };

  const handlePrevBall = () => {
    soundManager.playButtonClick();
    if (currentBallIndex > 0) {
      onChangeBallCount(ballOptions[currentBallIndex - 1]);
    }
  };

  const handleNextBall = () => {
    soundManager.playButtonClick();
    if (currentBallIndex < ballOptions.length - 1) {
      onChangeBallCount(ballOptions[currentBallIndex + 1]);
    }
  };

  const totalBetCents = betPerBallCents * ballCount;
  const isAutoPlaying = autoDropCount !== null;
  const isCountingDown = betCountdown !== null;
  const isActionDisabled = isDropping;

  // Adaptive primary button state: Bonus Drop, Wheel Spin, Countdown Stop, or Standard BET
  let handlePrimaryAction = onDrop;
  let primaryLabel = 'BET';
  let primaryBg = 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)';
  let primaryBorder = '2px solid #4ade80';
  let primaryShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(21, 128, 61, 0.55)';

  if (hasActiveBonus || (hasPendingFeatures && pendingSpinsCount === 0)) {
    handlePrimaryAction = onBonusDrop || onDrop;
    primaryLabel = activeBonus?.remainingBalls !== undefined ? `BONUS (${activeBonus.remainingBalls})` : 'BONUS DROP';
    primaryBg = 'linear-gradient(180deg, #9333ea 0%, #6b21a8 100%)';
    primaryBorder = '1.5px solid #c084fc';
    primaryShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(147, 51, 234, 0.6)';
  } else if (hasPendingFeatures && pendingSpinsCount > 0) {
    handlePrimaryAction = onOpenWheel;
    primaryLabel = `SPIN (${pendingSpinsCount})`;
    primaryBg = 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)';
    primaryBorder = '1.5px solid #38bdf8';
    primaryShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(2, 132, 199, 0.6)';
  } else if (isCountingDown) {
    handlePrimaryAction = onCancelBetCountdown || onDrop;
    primaryLabel = `STOP (${betCountdown})`;
    primaryBg = 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)';
    primaryBorder = '2px solid #fca5a5';
    primaryShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 14px rgba(239, 68, 68, 0.6)';
  }

  const stepperCardStyle = {
    background: 'linear-gradient(180deg, #0d182d 0%, #070e1c 100%)',
    border: '2px solid #d97706',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(254, 240, 138, 0.18)',
  };

  return (
    <div className="w-full max-w-[940px] mx-auto select-none px-2 pb-3.5 z-20">
      <div
        className="w-full h-auto rounded-[18px] px-3.5 sm:px-5 py-2.5 shadow-2xl relative"
        style={{
          background: 'linear-gradient(180deg, #0c172c 0%, #070e1c 100%)',
          border: '2.5px solid #d97706',
          boxShadow:
            '0 14px 36px rgba(0, 0, 0, 0.85), inset 0 0 18px rgba(245, 158, 11, 0.14), 0 0 0 1px rgba(254, 240, 138, 0.28)',
        }}
      >
        {/* Top & Bottom Center Egyptian Diamond Gem Medallions */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="#d97706" stroke="#fef08a" strokeWidth="1.5" />
            <path d="M12 4.5 L19.5 12 L12 19.5 L4.5 12 Z" fill="#06b6d4" stroke="#bae6fd" strokeWidth="1" />
            <path d="M12 4.5 L15.5 12 L12 19.5 L8.5 12 Z" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="#d97706" stroke="#fef08a" strokeWidth="1.5" />
            <path d="M12 4.5 L19.5 12 L12 19.5 L4.5 12 Z" fill="#06b6d4" stroke="#bae6fd" strokeWidth="1" />
            <path d="M12 4.5 L15.5 12 L12 19.5 L8.5 12 Z" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
        {/* ========================================================
            1. MOBILE VIEW (sm:hidden) - EXACT MATCH TO IMAGE
        ======================================================== */}
        <div className="flex flex-col sm:hidden w-full space-y-2">
          {/* Top Row: BET/WIN on Left, FREE SPIN / FAST GAME on Right */}
          <div className="flex items-center justify-between w-full px-1">
            {/* Left Column: BET & WIN */}
            <div className="flex flex-col space-y-1.5">
              {/* BET */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  BET :
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-base xs:text-lg font-black font-mono text-white leading-none">
                    {centsToCredits(totalBetCents)}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black text-slate-900 leading-none">₹</span>
                  </div>
                </div>
              </div>

              {/* WIN */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  WIN :
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-base xs:text-lg font-black font-mono text-white leading-none">
                    {centsToCredits(lastWinCents)}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black text-slate-900 leading-none">₹</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: FREE SPIN bar + FAST GAME switch */}
            <div className="flex flex-col items-end space-y-2">
              <SpinMeter
                spinPoints={spinPoints}
                pendingSpinsCount={pendingSpinsCount}
                onOpenWheel={onOpenWheel}
                disabled={isDropping}
                hideLabel={true}
              />
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  FAST GAME
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    if (onToggleFastMode) onToggleFastMode();
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${fastMode ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${fastMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: BET PER BALL + BALL PER DROP (2 Columns on normal, stacked 1 col on tall screens) */}
          <div className="grid grid-cols-2 tall-mobile-stack gap-2.5 w-full">
            {/* BET PER BALL Stepper */}
            <div
              className="h-[60px] xs:h-[64px] tall-mobile-item rounded-[14px] px-3.5 flex items-center justify-between transition-all"
              style={stepperCardStyle}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  BET PER BALL
                </span>
                <span className="text-xl xs:text-2xl font-black font-mono text-white leading-tight">
                  {centsToCredits(betPerBallCents)}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  disabled={currentBetIndex >= betOptions.length - 1 || isDropping}
                  onClick={handleNextBet}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Increase bet per ball"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBetIndex <= 0 || isDropping}
                  onClick={handlePrevBet}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Decrease bet per ball"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* BALL PER DROP Stepper */}
            <div
              className="h-[60px] xs:h-[64px] tall-mobile-item rounded-[14px] px-3.5 flex items-center justify-between transition-all"
              style={stepperCardStyle}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  BALL PER DROP
                </span>
                <span className="text-xl xs:text-2xl font-black font-mono text-white leading-tight">
                  {ballCount}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <button
                  disabled={currentBallIndex >= ballOptions.length - 1 || isDropping}
                  onClick={handleNextBall}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Increase balls per drop"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBallIndex <= 0 || isDropping}
                  onClick={handlePrevBall}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Decrease balls per drop"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: AUTO DROP & PLAY (2 Columns on normal, stacked 1 col on tall screens) */}
          <div className="grid grid-cols-2 tall-mobile-stack-buttons gap-2.5 w-full relative">
            {/* AUTO DROP Button (Order 2 on tall screens) */}
            <div className="tall-mobile-order-2 relative w-full">
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  if (isAutoPlaying) {
                    onStopAutoDrop();
                  } else {
                    setShowAutoDropdown(!showAutoDropdown);
                  }
                }}
                className={`w-full h-[60px] xs:h-[64px] tall-mobile-item rounded-[14px] flex items-center justify-center transition-all ${isAutoPlaying
                  ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'text-slate-950 hover:brightness-110 active:scale-95'
                  }`}
                style={
                  isAutoPlaying
                    ? undefined
                    : {
                        background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
                        border: '2px solid #fef08a',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 4px 12px rgba(217, 119, 6, 0.45)',
                      }
                }
                aria-label={isAutoPlaying ? 'Stop Auto Drop' : 'Open Auto Drop options'}
              >
                {isAutoPlaying ? (
                  <div className="flex items-center space-x-1.5">
                    <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
                    <span className="text-xs font-bold font-mono text-rose-300">
                      {autoDropCount}
                    </span>
                    <span className="text-xs font-bold text-rose-300 hidden tall-mobile-inline">
                      STOP AUTO
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-5 h-5 xs:w-6 xs:h-6 stroke-[2.4] text-slate-950" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-950 hidden tall-mobile-inline">
                      AUTO DROP
                    </span>
                  </div>
                )}
              </button>

              {/* Auto Drop Popover */}
              {showAutoDropdown && !isAutoPlaying && (
                <div className="absolute bottom-full mb-2 left-0 right-0 sm:right-auto bg-slate-900 border border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 flex flex-col space-y-1.5 w-full sm:w-36 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider pb-1 border-b border-slate-800">
                    Auto Drops
                  </span>
                  {[5, 10, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        soundManager.playButtonClick();
                        setShowAutoDropdown(false);
                        onStartAutoDrop(count);
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-300 text-center transition-all"
                    >
                      {count} drops
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MAIN PLAY / BONUS / SPIN BUTTON (Order 1 on tall screens) */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                handlePrimaryAction();
              }}
              disabled={isActionDisabled}
              className="tall-mobile-order-1 w-full h-[60px] xs:h-[64px] tall-mobile-item rounded-[14px] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              style={{
                background: primaryBg,
                border: primaryBorder,
                boxShadow: primaryShadow,
              }}
              aria-label={primaryLabel}
            >
              <span className="text-white font-black text-base sm:text-lg tracking-wider whitespace-nowrap leading-none px-2">
                {primaryLabel}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================
            2. DESKTOP VIEW (hidden sm:flex) - 100% UNCHANGED
        ======================================================== */}
        <div className="hidden sm:flex items-center justify-between gap-3 w-full">
          {/* BET + WIN Panel */}
          <div className="flex items-center justify-start sm:space-x-8 min-w-[150px]">
            {/* BET */}
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                BET :
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-[22px] font-black font-mono text-white leading-tight">
                  {centsToCredits(totalBetCents)}
                </span>
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center self-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-900 leading-none">₹</span>
                </div>
              </div>
            </div>

            {/* WIN */}
            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                WIN :
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-[22px] font-black font-mono text-white leading-tight">
                  {centsToCredits(lastWinCents)}
                </span>
                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center self-center shadow-sm">
                  <span className="text-[10px] font-black text-slate-900 leading-none">₹</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Row: BET PER BALL + BALL PER DROP + AUTO + PLAY */}
          <div className="flex items-center space-x-3 justify-end">
            {/* BET PER BALL Stepper */}
            <div
              className="w-[185px] h-[58px] rounded-[14px] px-3.5 flex items-center justify-between transition-all"
              style={stepperCardStyle}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  BET PER BALL
                </span>
                <span className="text-[20px] font-black font-mono text-white leading-tight">
                  {centsToCredits(betPerBallCents)}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <button
                  disabled={currentBetIndex >= betOptions.length - 1 || isDropping}
                  onClick={handleNextBet}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25 transition-all"
                  aria-label="Increase bet per ball"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBetIndex <= 0 || isDropping}
                  onClick={handlePrevBet}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25 transition-all"
                  aria-label="Decrease bet per ball"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* BALLS PER DROP Stepper */}
            <div
              className="w-[185px] h-[58px] rounded-[14px] px-3.5 flex items-center justify-between transition-all"
              style={stepperCardStyle}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  BALL PER DROP
                </span>
                <span className="text-[20px] font-black font-mono text-white leading-tight">
                  {ballCount}
                </span>
              </div>

              <div className="flex flex-col space-y-0.5">
                <button
                  disabled={currentBallIndex >= ballOptions.length - 1 || isDropping}
                  onClick={handleNextBall}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25 transition-all"
                  aria-label="Increase balls per drop"
                >
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBallIndex <= 0 || isDropping}
                  onClick={handlePrevBall}
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25 transition-all"
                  aria-label="Decrease balls per drop"
                >
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* AUTO DROP Button */}
            <div className="relative">
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  if (isAutoPlaying) {
                    onStopAutoDrop();
                  } else {
                    setShowAutoDropdown(!showAutoDropdown);
                  }
                }}
                className={`w-[62px] h-[58px] rounded-[14px] flex items-center justify-center transition-all ${isAutoPlaying
                  ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'text-slate-950 hover:brightness-110 active:scale-95'
                  }`}
                style={
                  isAutoPlaying
                    ? undefined
                    : {
                        background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
                        border: '2px solid #fef08a',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 4px 12px rgba(217, 119, 6, 0.45)',
                      }
                }
                aria-label={isAutoPlaying ? 'Stop Auto Drop' : 'Open Auto Drop options'}
              >
                {isAutoPlaying ? (
                  <div className="flex flex-col items-center">
                    <Square className="w-5 h-5 fill-rose-400 text-rose-400" />
                    <span className="text-[10px] font-bold font-mono mt-0.5 text-rose-300">
                      {autoDropCount}
                    </span>
                  </div>
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>

              {/* Auto Drop Popover */}
              {showAutoDropdown && !isAutoPlaying && (
                <div className="absolute bottom-[68px] right-0 bg-slate-900 border border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 flex flex-col space-y-1.5 w-36 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider pb-1 border-b border-slate-800">
                    Auto Drops
                  </span>
                  {[5, 10, 25, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        soundManager.playButtonClick();
                        setShowAutoDropdown(false);
                        onStartAutoDrop(count);
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-300 text-center transition-all"
                    >
                      {count} drops
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MAIN PLAY / BONUS / SPIN BUTTON */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                handlePrimaryAction();
              }}
              disabled={isActionDisabled}
              className="min-w-[115px] px-4 h-[58px] rounded-[14px] flex items-center justify-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              style={{
                background: primaryBg,
                border: primaryBorder,
                boxShadow: primaryShadow,
              }}
              aria-label={primaryLabel}
            >
              <span className="text-white font-black text-sm sm:text-base tracking-wider whitespace-nowrap leading-none">
                {primaryLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
