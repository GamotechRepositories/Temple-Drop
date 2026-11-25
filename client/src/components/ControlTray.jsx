import React, { useState } from 'react';
import { Play, Square, Zap, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const ControlTray = ({
  betPerBallCents,
  ballCount,
  onChangeBet,
  onChangeBallCount,
  fastMode,
  onToggleFastMode,
  isDropping,
  hasPendingFeatures,
  hasActiveBonus,
  onDrop,
  autoDropCount,
  onStartAutoDrop,
  onStopAutoDrop,
  lastWinCents,
}) => {
  const [showAutoDropModal, setShowAutoDropModal] = useState(false);

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
  const isActionDisabled = isDropping || hasPendingFeatures || hasActiveBonus;

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800/80 px-2 sm:px-6 py-2 pb-safe z-30 shadow-2xl backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center justify-between w-full md:w-auto space-x-3 sm:space-x-5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onToggleFastMode();
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
              fastMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle fast mode animation"
          >
            <Zap className={`w-4 h-4 ${fastMode ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span className="hidden xs:inline">FAST</span>
          </button>

          <div className="flex flex-col text-left">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
              Total Bet
            </span>
            <span className="text-xs sm:text-base font-bold font-mono text-slate-100">
              {centsToCredits(totalBetCents)} ₹
            </span>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">
              Win
            </span>
            <span className="text-xs sm:text-base font-bold font-mono text-emerald-400">
              {centsToCredits(lastWinCents)} ₹
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full md:w-auto">
          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1 space-x-1 min-h-[44px]">
            <div className="flex flex-col pr-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Bet/Ball
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-amber-300">
                {centsToCredits(betPerBallCents)}
              </span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <button
                disabled={currentBetIndex >= betOptions.length - 1 || isDropping}
                onClick={handleNextBet}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-all"
                aria-label="Increase bet per ball"
              >
                <ChevronUp className="w-3.5 h-3.5 text-slate-200" />
              </button>
              <button
                disabled={currentBetIndex <= 0 || isDropping}
                onClick={handlePrevBet}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-all"
                aria-label="Decrease bet per ball"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
              </button>
            </div>
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-xl px-2 py-1 space-x-1 min-h-[44px]">
            <div className="flex flex-col pr-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Balls
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono text-teal-300">
                {ballCount}
              </span>
            </div>
            <div className="flex flex-col space-y-0.5">
              <button
                disabled={currentBallIndex >= ballOptions.length - 1 || isDropping}
                onClick={handleNextBall}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-all"
                aria-label="Increase balls per drop"
              >
                <ChevronUp className="w-3.5 h-3.5 text-slate-200" />
              </button>
              <button
                disabled={currentBallIndex <= 0 || isDropping}
                onClick={handlePrevBall}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-all"
                aria-label="Decrease balls per drop"
              >
                <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full md:w-auto justify-end">
          {isAutoPlaying ? (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onStopAutoDrop();
              }}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase min-h-[44px] transition-all animate-pulse"
              aria-label="Stop auto drop"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>STOP ({autoDropCount})</span>
            </button>
          ) : (
            <div className="relative">
              <button
                disabled={isActionDisabled}
                onClick={() => {
                  soundManager.playButtonClick();
                  setShowAutoDropModal(!showAutoDropModal);
                }}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-30 transition-all"
                aria-label="Open auto drop settings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {showAutoDropModal && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-col space-y-1.5 min-w-[120px] z-50">
                  <span className="text-[10px] text-slate-400 font-semibold px-2 uppercase">
                    Auto Drop
                  </span>
                  {GAME_CONFIG.AUTO_DROP_COUNTS.map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        soundManager.playButtonClick();
                        setShowAutoDropModal(false);
                        onStartAutoDrop(count);
                      }}
                      className="py-1.5 px-3 text-xs font-bold rounded-lg hover:bg-slate-800 text-left text-slate-200 transition-all"
                    >
                      {count} Drops
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            disabled={isActionDisabled}
            onClick={() => {
              soundManager.playButtonClick();
              onDrop();
            }}
            className={`flex-1 md:flex-initial px-6 sm:px-10 py-3 rounded-2xl font-display font-black text-base sm:text-lg tracking-wider uppercase transition-all shadow-lg min-h-[48px] flex items-center justify-center space-x-2 ${
              isActionDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-glow-teal border border-emerald-300 active:scale-95'
            }`}
            aria-label="Drop Plinko balls"
          >
            {isDropping ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>DROP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
