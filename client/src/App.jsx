import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GAME_CONFIG } from '@temple-drop/shared';
import { api } from './api/client.js';
import { soundManager } from './audio/soundManager.js';
import { Header } from './components/Header.jsx';
import { GameStage } from './components/GameStage.jsx';
import { WheelModal } from './components/WheelModal.jsx';
import { HowToPlayModal } from './components/HowToPlayModal.jsx';
import { GameRulesModal } from './components/GameRulesModal.jsx';
import { HistoryModal } from './components/HistoryModal.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';

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
  const [ballsToAnimate, setBallsToAnimate] = useState(null);
  const [lastWinCents, setLastWinCents] = useState(0);
  const [payoutCapReached, setPayoutCapReached] = useState(false);
  const [dropError, setDropError] = useState(null);
  const pendingDropSettlementRef = useRef(null);

  const [autoDropCount, setAutoDropCount] = useState(null);
  const [autoPlayBonus, setAutoPlayBonus] = useState(false);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGameRules, setShowGameRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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
      soundManager.setMusicEnabled(gameState.user.preferences.musicEnabled);
    }
  }, [gameState]);

  const handleUpdatePreferences = async (updated) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    if (updated.fastMode !== undefined) setFastMode(updated.fastMode);
    if (updated.reducedMotion !== undefined) setReducedMotion(updated.reducedMotion);
    if (updated.soundEnabled !== undefined) soundManager.setSoundEnabled(updated.soundEnabled);
    if (updated.musicEnabled !== undefined) soundManager.setMusicEnabled(updated.musicEnabled);

    try {
      await api.updatePreferences(updated);
    } catch {}
  };

  // Regular Drop
  const handleDrop = async () => {
    if (isDropping || pendingFeatures.length > 0 || activeBonus) return;

    const totalBetCents = betPerBallCents * ballCount;
    if (wallet.balanceCents < totalBetCents) {
      setDropError('Insufficient credits for this bet. Refill or reduce your bet.');
      setTimeout(() => setDropError(null), 4000);
      setAutoDropCount(null);
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
      pendingDropSettlementRef.current = dropRes;
      setBallsToAnimate(dropRes.balls);
    } catch (err) {
      setWallet((prev) => ({ ...prev, balanceCents: prevBalance }));
      setIsDropping(false);
      setAutoDropCount(null);
      setDropError(err.message || 'Drop failed');
      setTimeout(() => setDropError(null), 4000);
      refetchGameState();
    }
  };

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
      if (data.pendingFeatures && data.pendingFeatures.length > 0) {
        const hasSpins = data.pendingFeatures.some((f) => f.type === 'WHEEL_SPIN');
        if (hasSpins && !data.activeBonus) {
          setShowWheel(true);
        }
      }

      // Handle auto drop loop
      if (autoDropCount !== null) {
        if (data.pendingFeatures && data.pendingFeatures.length > 0) {
          setAutoDropCount(null);
        } else if (autoDropCount > 1) {
          setAutoDropCount((prev) => (prev ? prev - 1 : null));
          setTimeout(() => {
            handleDrop();
          }, fastMode ? 100 : 350);
        } else {
          setAutoDropCount(null);
        }
      }

      // Handle auto play bonus loop
      if (autoPlayBonus && data.activeBonus && data.activeBonus.remainingBalls > 0) {
        setTimeout(() => {
          handleBonusDrop();
        }, fastMode ? 100 : 350);
      }
    }
  }, [autoDropCount, autoPlayBonus, fastMode, handleDrop, handleBonusDrop]);

  const handleSpinWheel = async () => {
    const res = await api.postSpin();
    setWallet((prev) => ({ ...prev, balanceCents: res.walletBalanceCents }));
    setPendingFeatures(res.pendingFeatures);
    setActiveBonus(res.activeBonus);
    setLastWinCents(res.grossPayoutCents);
    setPayoutCapReached(res.payoutCapReached);
    return res;
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
      if (e.code === 'Space') {
        const isAnyModalOpen =
          showHowToPlay ||
          showGameRules ||
          showHistory ||
          showSettings ||
          showWheel ||
          showAuth;

        if (!isAnyModalOpen && !isDropping) {
          e.preventDefault();
          if (activeBonus) {
            handleBonusDrop();
          } else {
            handleDrop();
          }
        }
      } else if (e.code === 'Escape') {
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
    showHowToPlay,
    showGameRules,
    showHistory,
    showSettings,
    showWheel,
    showAuth,
    isDropping,
    activeBonus,
    handleDrop,
    handleBonusDrop,
  ]);

  const canRefill = wallet.balanceCents < GAME_CONFIG.MIN_BET_CENTS && pendingFeatures.length === 0 && !activeBonus;
  const currentAvatar = GAME_CONFIG.AVATARS.find((a) => a.id === preferences.avatarId)?.icon || '🤠';

  return (
    <div className="relative w-full h-screen max-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER */}
      <Header
        user={user}
        balanceCents={wallet.balanceCents}
        avatarIcon={currentAvatar}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenSettings={() => setShowSettings(true)}
        onRefill={handleRefill}
        canRefill={canRefill}
        currencySymbol="🪙"
      />

      {/* 2. MAIN GAME STAGE VIEWPORT */}
      <main className="relative flex-1 flex flex-col w-full overflow-hidden">
        {dropError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-950/95 border border-rose-500 text-rose-200 text-xs sm:text-sm font-bold shadow-2xl flex items-center space-x-2 animate-bounce">
            <span>⚠️ {dropError}</span>
            <button
              onClick={() => setDropError(null)}
              className="ml-2 text-rose-400 hover:text-white font-black"
            >
              ✕
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
          onDrop={handleDrop}
          onBonusDrop={handleBonusDrop}
          autoDropCount={autoDropCount}
          onStartAutoDrop={(count) => {
            setAutoDropCount(count);
            handleDrop();
          }}
          onStopAutoDrop={() => setAutoDropCount(null)}
          lastWinCents={lastWinCents}
          currencySymbol="🪙"
        />
      </main>

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
    </div>
  );
};
