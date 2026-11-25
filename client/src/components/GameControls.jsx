import React, { useState } from 'react';
import { Play, Square, ChevronUp, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';
import { SpinMeter } from './SpinMeter.jsx';

export const GameControls = ({
  betPerBallCents,
  ballCount,
  onChangeBet,
  onChangeBallCount,
  isDropping,
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
  currencySymbol = '🪙',
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
  const isActionDisabled = isDropping;

  return (
    <div className="w-full max-w-[940px] mx-auto select-none px-2 z-20">
      <div
        className="w-full h-auto rounded-[16px] px-2.5 sm:px-5 py-2 sm:py-2.5 shadow-2xl relative"
        style={{
          background: 'linear-gradient(180deg, #131c2d 0%, #0a111e 100%)',
          border: '1.5px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* ========================================================
            1. MOBILE VIEW (sm:hidden) - EXACT MATCH TO IMAGE
        ======================================================== */}
        <div className="flex flex-col sm:hidden w-full space-y-2">
          {/* Top Row: BET/WIN on Left, FREE SPIN / FAST GAME on Right */}
          <div className="flex items-center justify-between w-full px-1">
            {/* Left Column: BET & WIN */}
            <div className="flex flex-col space-y-1">
              {/* BET */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  BET :
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-black font-mono text-white leading-none">
                    {centsToCredits(totalBetCents)}
                  </span>
                  <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-slate-900 leading-none">₹</span>
                  </div>
                </div>
              </div>

              {/* WIN */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  WIN :
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-black font-mono text-white leading-none">
                    {centsToCredits(lastWinCents)}
                  </span>
                  <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-slate-900 leading-none">₹</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: FREE SPIN bar + FAST GAME switch */}
            <div className="flex flex-col items-end space-y-1.5">
              <SpinMeter
                spinPoints={spinPoints}
                pendingSpinsCount={pendingSpinsCount}
                onOpenWheel={onOpenWheel}
                disabled={isDropping}
                hideLabel={true}
              />
              <div className="flex items-center space-x-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  FAST GAME
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    if (onToggleFastMode) onToggleFastMode();
                  }}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    fastMode ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      fastMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: BET PER BALL + BALL PER DROP (2 Columns) */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* BET PER BALL Stepper */}
            <div
              className="h-[46px] rounded-[12px] px-2.5 flex items-center justify-between transition-all"
              style={{
                background: 'linear-gradient(180deg, #111a28 0%, #0a101b 100%)',
                border: '1.5px solid #a36940',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  BET PER BALL
                </span>
                <span className="text-base font-black font-mono text-white leading-tight">
                  {centsToCredits(betPerBallCents)}
                </span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <button
                  disabled={currentBetIndex >= betOptions.length - 1 || isDropping}
                  onClick={handleNextBet}
                  className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Increase bet per ball"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBetIndex <= 0 || isDropping}
                  onClick={handlePrevBet}
                  className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Decrease bet per ball"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* BALL PER DROP Stepper */}
            <div
              className="h-[46px] rounded-[12px] px-2.5 flex items-center justify-between transition-all"
              style={{
                background: 'linear-gradient(180deg, #111a28 0%, #0a101b 100%)',
                border: '1.5px solid #a36940',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  BALL PER DROP
                </span>
                <span className="text-base font-black font-mono text-white leading-tight">
                  {ballCount}
                </span>
              </div>
              <div className="flex flex-col space-y-0.5">
                <button
                  disabled={currentBallIndex >= ballOptions.length - 1 || isDropping}
                  onClick={handleNextBall}
                  className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Increase balls per drop"
                >
                  <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button
                  disabled={currentBallIndex <= 0 || isDropping}
                  onClick={handlePrevBall}
                  className="p-0.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-25"
                  aria-label="Decrease balls per drop"
                >
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: AUTO DROP & PLAY (2 Columns) */}
          <div className="grid grid-cols-2 gap-2 w-full relative">
            {/* AUTO DROP Button */}
            <div className="relative w-full">
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  if (isAutoPlaying) {
                    onStopAutoDrop();
                  } else {
                    setShowAutoDropdown(!showAutoDropdown);
                  }
                }}
                className={`w-full h-[46px] rounded-[12px] flex items-center justify-center transition-all ${
                  isAutoPlaying
                    ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-[#182338] border border-slate-600/70 text-slate-200 hover:text-white hover:border-slate-400'
                }`}
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
                aria-label={isAutoPlaying ? 'Stop Auto Drop' : 'Open Auto Drop options'}
              >
                {isAutoPlaying ? (
                  <div className="flex items-center space-x-1.5">
                    <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
                    <span className="text-xs font-bold font-mono text-rose-300">
                      {autoDropCount}
                    </span>
                  </div>
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>

              {/* Auto Drop Popover */}
              {showAutoDropdown && !isAutoPlaying && (
                <div className="absolute bottom-[52px] left-0 bg-slate-900 border border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 flex flex-col space-y-1.5 w-36 backdrop-blur-md">
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

            {/* MAIN PLAY BUTTON (Green with White Play Triangle) */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onDrop();
              }}
              disabled={isActionDisabled}
              className="w-full h-[46px] rounded-[12px] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                border: '1.5px solid #34d399',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 12px rgba(21, 128, 61, 0.5)',
              }}
              aria-label="Play drop"
            >
              {isDropping ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              )}
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
              style={{
                background: 'linear-gradient(180deg, #111a28 0%, #0a101b 100%)',
                border: '1.5px solid #a36940',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
              }}
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
              style={{
                background: 'linear-gradient(180deg, #111a28 0%, #0a101b 100%)',
                border: '1.5px solid #a36940',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
              }}
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
                className={`w-[62px] h-[58px] rounded-[14px] flex items-center justify-center transition-all ${
                  isAutoPlaying
                    ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
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

            {/* MAIN PLAY BUTTON */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onDrop();
              }}
              disabled={isActionDisabled}
              className="w-[115px] h-[58px] rounded-[14px] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                border: '1.5px solid #34d399',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 12px rgba(21, 128, 61, 0.5)',
              }}
              aria-label="Play drop"
            >
              {isDropping ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
