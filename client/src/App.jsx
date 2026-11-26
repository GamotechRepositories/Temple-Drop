import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GAME_CONFIG } from '@temple-drop/shared';
import { api } from './api/client.js';
import { providerSdkBridge } from './api/providerSdk.js';
import { soundManager } from './audio/soundManager.js';
import { Header } from './components/Header.jsx';
import { GameStage } from './components/GameStage.jsx';
import { WheelModal } from './components/WheelModal.jsx';
import { HowToPlayModal } from './components/HowToPlayModal.jsx';
import { GameRulesModal } from './components/GameRulesModal.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { BetResultModal } from './components/BetResultModal.jsx';
import { TempleIntro, shouldShowTempleIntro } from './components/TempleIntro.jsx';

export const App = () => {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({
    balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
    initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
    version: 0,
  });
  const [spinPoints, setSpinPoints] = useState(0);
  const [energyPoints, setEnergyPoints] = useState(0);
  const [pendingFeatures, setPendingFeatures] = useState([]);
  const [activeBonus, setActiveBonus] = useState(null);

  const [betPerBallCents, setBetPerBallCents] = useState(
    GAME_CONFIG.DEFAULT_BET_PER_BALL_CENTS
  );
  const [ballCount, setBallCount] = useState(GAME_CONFIG.DEFAULT_BALLS_PER_DROP);
  const [fastMode, setFastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [isDropping, setIsDropping] = useState(false);
  const [betCountdown, setBetCountdown] = useState(null);
  const betCountdownTimerRef = useRef(null);
  const [ballsToAnimate, setBallsToAnimate] = useState(null);
  const [lastWinCents, setLastWinCents] = useState(0);
  const [payoutCapReached, setPayoutCapReached] = useState(false);
  const [dropError, setDropError] = useState(null);
  const pendingDropSettlementRef = useRef(null);

  const [autoDropCount, setAutoDropCount] = useState(null);
  const autoDropCountRef = useRef(null);
  const autoDropTimerRef = useRef(null);
  const autoDropSessionRoundsRef = useRef([]);
  const isAutoSessionRef = useRef(false);
  const [autoPlayBonus, setAutoPlayBonus] = useState(false);

  const stopAutoDrop = useCallback((showSummaryIfReady = false) => {
    autoDropCountRef.current = null;
    setAutoDropCount(null);
    if (autoDropTimerRef.current) {
      clearTimeout(autoDropTimerRef.current);
      autoDropTimerRef.current = null;
    }
    if (showSummaryIfReady && isAutoSessionRef.current && autoDropSessionRoundsRef.current.length > 0) {
      const rounds = [...autoDropSessionRoundsRef.current];
      const last = rounds[rounds.length - 1];
      isAutoSessionRef.current = false;
      autoDropSessionRoundsRef.current = [];
      setLatestRoundResult({
        ...last,
        isAutoDropSummary: true,
        autoDropRounds: rounds,
      });
      setShowBetResult(true);
    }
  }, []);

  useEffect(() => {
    providerSdkBridge.initIfPresent();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && autoDropCountRef.current !== null) {
        stopAutoDrop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (autoDropTimerRef.current) {
        clearTimeout(autoDropTimerRef.current);
      }
    };
  }, [stopAutoDrop]);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGameRules, setShowGameRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIntro, setShowIntro] = useState(() => shouldShowTempleIntro(false));
  const [introAssetsReady, setIntroAssetsReady] = useState(false);
  const gameShellRef = useRef(null);
  const wasShowingIntroRef = useRef(showIntro);

  useEffect(() => {
    if (gameShellRef.current) {
      gameShellRef.current.inert = showIntro;
    }
    if (wasShowingIntroRef.current && !showIntro) {
      document.getElementById('game-title')?.focus({ preventScroll: true });
    }
    wasShowingIntroRef.current = showIntro;
  }, [showIntro]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);
  const [showWheel, setShowWheel] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showBetResult, setShowBetResult] = useState(false);
  const [latestRoundResult, setLatestRoundResult] = useState(null);

  const [preferences, setPreferences] = useState({
    soundEnabled: true,
    musicEnabled: true,
    animationEnabled: true,
    fastMode: false,
    reducedMotion: false,
    avatarId: 'explorer',
    dontShowHowToPlay: false,
  });

  // Query server state
  const { data: gameState, refetch: refetchGameState } = useQuery({
    queryKey: ['gameState'],
    queryFn: async () => {
      try {
        return await api.getGameState();
      } catch (err) {
        await api.guestLogin();
        return await api.getGameState();
      }
    },
    staleTime: 5000,
  });

  useEffect(() => {
    if (!gameState) return;
    setUser(gameState.user);
    setWallet(gameState.wallet);
    setSpinPoints(gameState.spinPoints);
    setEnergyPoints(gameState.energyPoints);
    setPendingFeatures(gameState.pendingFeatures);
    setActiveBonus(gameState.activeBonus);

    if (gameState.user?.preferences) {
      setPreferences(gameState.user.preferences);
      setFastMode(gameState.user.preferences.fastMode);
      setReducedMotion(gameState.user.preferences.reducedMotion);
      soundManager.setSoundEnabled(gameState.user.preferences.soundEnabled);
      if (!showIntro) {
        soundManager.setMusicEnabled(gameState.user.preferences.musicEnabled);
      } else if (!gameState.user.preferences.musicEnabled) {
        soundManager.setMusicEnabled(false);
      }
    }
    api.fetchCsrfToken();
  }, [gameState]);

  useEffect(() => {
    if (!showIntro && preferences.musicEnabled && !soundManager.isMusicPlaying) {
      soundManager.setMusicEnabled(true);
    }
  }, [showIntro, preferences.musicEnabled]);

  const handleUpdatePreferences = async (updated) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    if (updated.fastMode !== undefined) setFastMode(updated.fastMode);
    if (updated.reducedMotion !== undefined) setReducedMotion(updated.reducedMotion);
    if (updated.soundEnabled !== undefined) soundManager.setSoundEnabled(updated.soundEnabled);
    if (updated.musicEnabled !== undefined) soundManager.setMusicEnabled(updated.musicEnabled);

    try {
      await api.updatePreferences(updated);
    } catch { }
  };

  const cancelBetCountdown = useCallback(() => {
    if (betCountdownTimerRef.current) {
      clearTimeout(betCountdownTimerRef.current);
      betCountdownTimerRef.current = null;
    }
    setBetCountdown(null);
  }, []);

  useEffect(() => {
    return () => {
      if (betCountdownTimerRef.current) {
        clearTimeout(betCountdownTimerRef.current);
      }
    };
  }, []);

  // Execute paid drop against backend & trigger ball animation
  const executeDrop = async () => {
    if (isDropping) return;

    const totalBetCents = betPerBallCents * ballCount;
    if (wallet.balanceCents < totalBetCents) {
      setDropError('Insufficient credits for this bet. Refill or reduce your bet.');
      setTimeout(() => setDropError(null), 4000);
      stopAutoDrop();
      return;
    }

    setIsDropping(true);
    setBallsToAnimate(null);

    const prevBalance = wallet.balanceCents;
    // Optimistically deduct bet from wallet
    setWallet((prev) => ({
      ...prev,
      balanceCents: Math.max(0, prev.balanceCents - totalBetCents),
    }));

    try {
      const dropRes = await api.postDrop(betPerBallCents, ballCount);
      providerSdkBridge.notifyRoundStart({
        roundId: dropRes.roundId,
        betAmount: totalBetCents / 100,
      });
      pendingDropSettlementRef.current = dropRes;
      setBallsToAnimate(dropRes.balls);
    } catch (err) {
      setWallet((prev) => ({ ...prev, balanceCents: prevBalance }));
      setIsDropping(false);
      stopAutoDrop();
      setDropError(err.message || 'Drop failed');
      setTimeout(() => setDropError(null), 4000);
      refetchGameState();
    }
  };

  const executeDropRef = useRef(executeDrop);
  useEffect(() => {
    executeDropRef.current = executeDrop;
  });

  // Regular / Active Drop Handler (starts 3-2-1 countdown for manual BET, or cancels if counting down)
  const handleDrop = async () => {
    if (isDropping) return;

    if (betCountdown !== null) {
      cancelBetCountdown();
      return;
    }

    // If active bonus is in progress, route to bonus drop
    if (activeBonus) {
      return handleBonusDrop();
    }

    // If pending features exist, trigger wheel or bonus (allow auto-drop to finish queued rounds if only WHEEL_SPIN is pending)
    if (pendingFeatures && pendingFeatures.length > 0) {
      const hasBonus = pendingFeatures.some((f) => f.type === 'BONUS');
      if (hasBonus) {
        return handleBonusDrop();
      }
      if (autoDropCountRef.current === null) {
        const hasSpins = pendingFeatures.some((f) => f.type === 'WHEEL_SPIN');
        if (hasSpins) {
          setShowWheel(true);
          return;
        }
        return handleBonusDrop();
      }
    }

    const totalBetCents = betPerBallCents * ballCount;
    if (wallet.balanceCents < totalBetCents) {
      setDropError('Insufficient credits for this bet. Refill or reduce your bet.');
      setTimeout(() => setDropError(null), 4000);
      stopAutoDrop();
      return;
    }

    // Auto-drop rounds execute immediately without repeating the 3-2-1 countdown
    if (autoDropCountRef.current !== null) {
      return executeDrop();
    }

    // Start 3 -> 2 -> 1 countdown before placing bet & dropping balls
    const stepMs = 850;
    const runStep = (value) => {
      setBetCountdown(value);
      betCountdownTimerRef.current = setTimeout(() => {
        if (value > 1) {
          runStep(value - 1);
        } else {
          betCountdownTimerRef.current = null;
          setBetCountdown(null);
          executeDropRef.current();
        }
      }, stepMs);
    };

    runStep(3);
  };

  const handleDropRef = useRef(handleDrop);
  useEffect(() => {
    handleDropRef.current = handleDrop;
  });

  // Bonus Drop
  const handleBonusDrop = async () => {
    if (isDropping || !activeBonus || activeBonus.remainingBalls <= 0) return;

    setIsDropping(true);
    setBallsToAnimate(null);

    try {
      const res = await api.postBonusDrop();
      pendingDropSettlementRef.current = res;
      setBallsToAnimate([res.ball]);
    } catch (err) {
      setIsDropping(false);
      setAutoPlayBonus(false);
      setDropError(err.message || 'Bonus drop failed');
      setTimeout(() => setDropError(null), 4000);
      refetchGameState();
    }
  };

  // Called when all dropped balls settle at the bottom
  const handleAnimationComplete = useCallback(() => {
    setIsDropping(false);

    if (pendingDropSettlementRef.current) {
      const data = pendingDropSettlementRef.current;
      pendingDropSettlementRef.current = null;

      if (data.roundId) {
        const payoutCredits = (data.grossPayoutCents ?? 0) / 100;
        providerSdkBridge.notifyRoundEnd({
          roundId: data.roundId,
          payout: payoutCredits,
          result: payoutCredits > 0 ? 'WIN' : 'LOSS',
        });
      }

      if (data.walletBalanceCents !== undefined) {
        setWallet((prev) => ({ ...prev, balanceCents: data.walletBalanceCents }));
      }
      if (data.grossPayoutCents !== undefined) {
        setLastWinCents(data.grossPayoutCents);
      }
      if (data.payoutCapReached !== undefined) {
        setPayoutCapReached(data.payoutCapReached);
      }
      if (data.spinPoints !== undefined) {
        setSpinPoints(data.spinPoints);
      }
      if (data.energyPoints !== undefined) {
        setEnergyPoints(data.energyPoints);
      }
      if (data.pendingFeatures !== undefined) {
        setPendingFeatures(data.pendingFeatures);
      }
      if (data.activeBonus !== undefined) {
        setActiveBonus(data.activeBonus);
      }

      // Check for pending wheel spins
      const isAutoRunning = autoDropCountRef.current !== null;
      const inAutoSession = isAutoSessionRef.current;

      if (inAutoSession) {
        autoDropSessionRoundsRef.current.push(data);
      }

      if (data.pendingFeatures && data.pendingFeatures.length > 0) {
        const hasSpins = data.pendingFeatures.some((f) => f.type === 'WHEEL_SPIN');
        if (hasSpins && !data.activeBonus && !isAutoRunning) {
          setShowWheel(true);
        }
      }

      // Handle auto drop loop using live refs (avoids stale isDropping/balance closures)
      if (isAutoRunning) {
        const hasBonusPending =
          Boolean(data.activeBonus) ||
          Boolean(data.pendingFeatures && data.pendingFeatures.some((f) => f.type === 'BONUS'));
        const nextTotalBetCents = betPerBallCents * ballCount;
        const hasEnoughBalance = (data.walletBalanceCents ?? 0) >= nextTotalBetCents;

        if (hasBonusPending || !hasEnoughBalance || document.hidden || autoDropCountRef.current <= 1) {
          const rounds = [...autoDropSessionRoundsRef.current];
          isAutoSessionRef.current = false;
          autoDropSessionRoundsRef.current = [];
          stopAutoDrop(false);
          setLatestRoundResult({
            ...data,
            isAutoDropSummary: true,
            autoDropRounds: rounds,
          });
          setShowBetResult(true);
        } else {
          const nextRemaining = autoDropCountRef.current - 1;
          autoDropCountRef.current = nextRemaining;
          setAutoDropCount(nextRemaining);
          autoDropTimerRef.current = setTimeout(() => {
            if (autoDropCountRef.current !== null && !document.hidden) {
              handleDropRef.current();
            }
          }, fastMode ? 120 : 350);
        }
      } else if (inAutoSession) {
        // User pressed Stop while this final in-flight auto-drop round was animating
        const rounds = [...autoDropSessionRoundsRef.current];
        isAutoSessionRef.current = false;
        autoDropSessionRoundsRef.current = [];
        setLatestRoundResult({
          ...data,
          isAutoDropSummary: true,
          autoDropRounds: rounds,
        });
        setShowBetResult(true);
      } else {
        setLatestRoundResult(data);
        setShowBetResult(true);
      }

      // Handle auto play bonus loop
      if (autoPlayBonus && data.activeBonus && data.activeBonus.remainingBalls > 0) {
        setTimeout(() => {
          handleBonusDrop();
        }, fastMode ? 100 : 350);
      }
    }
  }, [autoPlayBonus, betPerBallCents, ballCount, fastMode, handleBonusDrop, stopAutoDrop]);

  const handleSpinWheel = async () => {
    const res = await api.postSpin();
    setWallet((prev) => ({ ...prev, balanceCents: res.walletBalanceCents }));
    setPendingFeatures(res.pendingFeatures);
    setActiveBonus(res.activeBonus);
    setLastWinCents(res.grossPayoutCents);
    setPayoutCapReached(res.payoutCapReached);
    return res;
  };

  const handleCloseBetResult = () => {
    soundManager.playButtonClick();
    setShowBetResult(false);
    if (latestRoundResult?.pendingFeatures && latestRoundResult.pendingFeatures.length > 0) {
      const hasSpins = latestRoundResult.pendingFeatures.some((f) => f.type === 'WHEEL_SPIN');
      if (hasSpins && !latestRoundResult.activeBonus) {
        setShowWheel(true);
      }
    }
  };

  const handleRefill = async () => {
    try {
      const res = await api.refillWallet();
      setWallet((prev) => ({ ...prev, balanceCents: res.wallet.balanceCents }));
      alert('Your wallet has been refilled with 10,000 demo credits!');
    } catch (err) {
      alert(err.message || 'Refill failed');
    }
  };

  // Keyboard controls: Space to drop, Esc to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntro) return;
      if (e.code === 'Space') {
        if (showBetResult) {
          e.preventDefault();
          handleCloseBetResult();
          return;
        }

        const isAnyModalOpen =
          showHowToPlay ||
          showGameRules ||
          showHistory ||
          showSettings ||
          showWheel ||
          showAuth ||
          showBetResult;

        if (!isAnyModalOpen && !isDropping) {
          e.preventDefault();
          if (activeBonus) {
            handleBonusDrop();
          } else {
            handleDrop();
          }
        }
      } else if (e.code === 'Escape') {
        if (showBetResult) {
          handleCloseBetResult();
        }
        setShowHowToPlay(false);
        setShowGameRules(false);
        setShowHistory(false);
        setShowSettings(false);
        setShowAuth(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showIntro,
    showHowToPlay,
    showGameRules,
    showHistory,
    showSettings,
    showWheel,
    showAuth,
    showBetResult,
    isDropping,
    activeBonus,
    handleDrop,
    handleBonusDrop,
    handleCloseBetResult,
  ]);

  const canRefill = wallet.balanceCents < GAME_CONFIG.MIN_BET_CENTS && pendingFeatures.length === 0 && !activeBonus;
  const currentAvatar = GAME_CONFIG.AVATARS.find((a) => a.id === preferences.avatarId)?.icon || 'E';

  return (
    <div className="relative w-full h-screen h-[100dvh] max-h-[100dvh] bg-[#050811] text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* 0. TEMPLE DOOR OPENING ANIMATION */}
      {showIntro && (
        <TempleIntro
          reducedMotion={reducedMotion}
          onAssetsReady={() => setIntroAssetsReady(true)}
          onComplete={handleIntroComplete}
        />
      )}

      {/* UNDERLYING GAME SHELL (inert while door intro is active) */}
      <div
        ref={gameShellRef}
        aria-hidden={showIntro || undefined}
        className={`flex-1 flex flex-col justify-between overflow-hidden ${showIntro ? 'pointer-events-none' : ''
          }`}
      >
        {/* 1. TOP HEADER */}
        <Header
          user={user}
          balanceCents={wallet.balanceCents}
          avatarIcon={currentAvatar}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
          onRefill={handleRefill}
          canRefill={canRefill}
          currencySymbol="₹"
        />

        {/* 2. MAIN GAME STAGE VIEWPORT */}
        <main className={`relative flex-1 flex flex-col w-full overflow-hidden ${showIntro && introAssetsReady ? 'animate-game-back-to-forward' : showIntro ? 'scale-[0.86]' : ''}`}>
          {dropError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-950/95 border border-rose-500 text-rose-200 text-xs sm:text-sm font-bold shadow-2xl flex items-center space-x-2 animate-bounce">
              <span>{dropError}</span>
              <button
                onClick={() => setDropError(null)}
                className="ml-2 text-rose-400 hover:text-white font-black"
              >
                Close
              </button>
            </div>
          )}
          <GameStage
            ballsToAnimate={ballsToAnimate}
            onAnimationComplete={handleAnimationComplete}
            fastMode={fastMode}
            onToggleFastMode={() => handleUpdatePreferences({ fastMode: !fastMode })}
            reducedMotion={reducedMotion}
            spinPoints={spinPoints}
            energyPoints={energyPoints}
            pendingFeatures={pendingFeatures}
            activeBonus={activeBonus}
            onOpenWheel={() => setShowWheel(true)}
            betPerBallCents={betPerBallCents}
            ballCount={ballCount}
            onChangeBet={setBetPerBallCents}
            onChangeBallCount={setBallCount}
            isDropping={isDropping}
            betCountdown={betCountdown}
            onCancelBetCountdown={cancelBetCountdown}
            onDrop={handleDrop}
            onBonusDrop={handleBonusDrop}
            autoDropCount={autoDropCount}
            onStartAutoDrop={(count) => {
              if (isDropping || activeBonus || pendingFeatures.some((f) => f.type === 'BONUS')) {
                handleDrop();
                return;
              }
              autoDropSessionRoundsRef.current = [];
              isAutoSessionRef.current = true;
              autoDropCountRef.current = count;
              setAutoDropCount(count);
              handleDrop();
            }}
            onStopAutoDrop={() => stopAutoDrop(!isDropping)}
            lastWinCents={lastWinCents}
            currencySymbol="₹"
          />
        </main>
      </div>

      {/* 3. MODAL DIALOGS */}
      <WheelModal
        isOpen={showWheel}
        onClose={() => setShowWheel(false)}
        onSpin={handleSpinWheel}
        spinsRemaining={pendingFeatures.filter((f) => f.type === 'WHEEL_SPIN').length}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={(dontShow) => {
          setShowHowToPlay(false);
          if (dontShow !== preferences.dontShowHowToPlay) {
            handleUpdatePreferences({ dontShowHowToPlay: dontShow });
          }
        }}
        initialDontShowAgain={preferences.dontShowHowToPlay}
      />

      <GameRulesModal
        isOpen={showGameRules}
        onClose={() => setShowGameRules(false)}
      />

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onOpenRules={() => setShowGameRules(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenAuth={() => setShowAuth(true)}
        onLogout={async () => {
          await api.logout();
          setUser(null);
          queryClient.invalidateQueries({ queryKey: ['gameState'] });
        }}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={(data) => {
          setUser(data.user);
          setWallet(data.wallet);
          queryClient.invalidateQueries({ queryKey: ['gameState'] });
        }}
      />

      <BetResultModal
        isOpen={showBetResult}
        onClose={handleCloseBetResult}
        resultData={latestRoundResult}
      />
    </div>
  );
};
