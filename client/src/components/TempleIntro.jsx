import React, { useEffect, useRef, useCallback, useState } from 'react';

const INTRO_SEEN_KEY = 'temple_drop_intro_seen';
const FALLBACK_TIMEOUT_MS = 2950;
const ASSET_WAIT_TIMEOUT_MS = 8000;

const GOLD_PARTICLES = [
  { id: 1, top: '20%', delay: '460ms', dx: '-26px', dy: '-38px', size: 6 },
  { id: 2, top: '30%', delay: '510ms', dx: '30px', dy: '-28px', size: 5 },
  { id: 3, top: '42%', delay: '480ms', dx: '-34px', dy: '14px', size: 7 },
  { id: 4, top: '54%', delay: '560ms', dx: '28px', dy: '26px', size: 5 },
  { id: 5, top: '66%', delay: '500ms', dx: '-22px', dy: '-20px', size: 6 },
  { id: 6, top: '76%', delay: '600ms', dx: '24px', dy: '-30px', size: 4.5 },
  { id: 7, top: '36%', delay: '630ms', dx: '-16px', dy: '22px', size: 4 },
  { id: 8, top: '60%', delay: '540ms', dx: '34px', dy: '-12px', size: 5.5 },
];

export function hasSeenTempleIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTempleIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Ignore unavailable storage (e.g., private browsing or restricted iframe)
  }
}

export function prefersSystemReducedMotion() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

export function shouldShowTempleIntro(reducedMotionPref = false) {
  if (reducedMotionPref || prefersSystemReducedMotion()) {
    markTempleIntroSeen();
    return false;
  }
  return true;
}

const SandstoneDoorHalf = ({ side, animStyle }) => {
  const isLeft = side === 'left';

  return (
    <div
      className={`absolute inset-y-0 ${
        isLeft ? 'left-0 animate-temple-door-left' : 'right-0 animate-temple-door-right'
      } w-1/2 overflow-hidden will-change-transform`}
      style={{
        ...animStyle,
        background: isLeft
          ? 'radial-gradient(circle at 82% 50%, #9b6a3b 0%, #6f4824 38%, #472c15 74%, #25160a 100%)'
          : 'radial-gradient(circle at 18% 50%, #9b6a3b 0%, #6f4824 38%, #472c15 74%, #25160a 100%)',
        boxShadow: isLeft
          ? 'inset -10px 0 28px rgba(0, 0, 0, 0.75)'
          : 'inset 10px 0 28px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* Full-viewport temple door artwork split seamlessly at the 50vw center seam */}
      <img
        src="/images/temple-doors.jpg"
        alt=""
        aria-hidden="true"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
        className={`absolute top-0 ${
          isLeft ? 'left-0' : 'right-0'
        } w-[100vw] max-w-none h-full object-cover object-center pointer-events-none select-none`}
      />

      {/* Subtle center seam golden highlight */}
      <div
        className={`absolute inset-y-0 ${isLeft ? 'right-0' : 'left-0'} w-1.5 sm:w-2`}
        style={{
          background:
            'linear-gradient(180deg, rgba(69,26,3,0.4) 0%, rgba(217,119,6,0.75) 20%, rgba(254,240,138,0.85) 50%, rgba(217,119,6,0.75) 80%, rgba(69,26,3,0.4) 100%)',
          boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)',
        }}
      />
    </div>
  );
};

export const TempleIntro = ({ reducedMotion = false, onAssetsReady, onComplete }) => {
  const completedRef = useRef(false);
  const [assetsReady, setAssetsReady] = useState(false);

  const completeIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    markTempleIntroSeen();
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Wait for door, scarab, and board frame images to load & decode on slow networks
  useEffect(() => {
    let cancelled = false;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const urls = [
      '/images/temple-doors.jpg',
      '/images/temple-scarab.png',
      '/images/temple-frame.webp',
      isMobile ? '/images/bg-mobile.webp' : '/images/bg-jungle.webp',
    ];
    const settled = new Set();
    const timers = [];

    const finishReady = () => {
      if (cancelled) return;
      setAssetsReady(true);
      if (onAssetsReady) onAssetsReady();
    };

    const maxWaitTimer = setTimeout(finishReady, ASSET_WAIT_TIMEOUT_MS);

    const loadWithRetry = (src, attempt = 0) => {
      if (cancelled || settled.has(src)) return;
      const img = new Image();

      const markDone = () => {
        if (cancelled || settled.has(src)) return;
        settled.add(src);
        if (settled.size >= urls.length) {
          clearTimeout(maxWaitTimer);
          finishReady();
        }
      };

      const handleSuccess = () => {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {}).finally(markDone);
        } else {
          markDone();
        }
      };

      img.onload = handleSuccess;
      img.onerror = () => {
        if (attempt < 1 && !cancelled) {
          const retryTimer = setTimeout(() => loadWithRetry(src, attempt + 1), 450);
          timers.push(retryTimer);
        } else {
          markDone();
        }
      };
      img.src = attempt === 0 ? src : `${src}?retry=${attempt}`;
      if (img.complete && img.naturalWidth > 0) {
        handleSuccess();
      }
    };

    urls.forEach((src) => loadWithRetry(src));

    return () => {
      cancelled = true;
      clearTimeout(maxWaitTimer);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [onAssetsReady]);

  // Immediately exit if Reduced Motion preference or OS reduced motion is enabled
  useEffect(() => {
    if (reducedMotion || prefersSystemReducedMotion()) {
      completeIntro();
      return;
    }

    let mediaQuery;
    const handleMediaChange = (e) => {
      if (e.matches) {
        completeIntro();
      }
    };

    try {
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleMediaChange);
        } else if (mediaQuery.addListener) {
          mediaQuery.addListener(handleMediaChange);
        }
      }
    } catch {
      // Ignore matchMedia errors
    }

    return () => {
      try {
        if (mediaQuery) {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleMediaChange);
          } else if (mediaQuery.removeListener) {
            mediaQuery.removeListener(handleMediaChange);
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [reducedMotion, completeIntro]);

  // Escape key & fallback timer (starts once assets are ready)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        completeIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    const fallbackTimer = assetsReady
      ? setTimeout(completeIntro, FALLBACK_TIMEOUT_MS)
      : null;

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [assetsReady, completeIntro]);

  const handleOverlayAnimationEnd = (e) => {
    if (e.target === e.currentTarget && e.animationName === 'templeOverlayFade') {
      completeIntro();
    }
  };

  const animStyle = { animationPlayState: assetsReady ? 'running' : 'paused' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Temple Drop opening intro"
      onAnimationEnd={handleOverlayAnimationEnd}
      style={animStyle}
      className="fixed inset-0 z-[100] overflow-hidden select-none animate-temple-overlay-fade"
    >
      {/* Soft Gold Dust Particles Near Seam */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-24">
        {GOLD_PARTICLES.map((p) => (
          <span
            key={p.id}
            className="absolute left-1/2 rounded-full animate-temple-dust will-change-transform"
            style={{
              ...animStyle,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: 'radial-gradient(circle, #fef9c3 0%, #fbbf24 65%, transparent 100%)',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.95)',
              animationDelay: p.delay,
              '--dx': p.dx,
              '--dy': p.dy,
            }}
          />
        ))}
      </div>

      {/* Left & Right Sandstone Temple Doors */}
      <SandstoneDoorHalf side="left" animStyle={animStyle} />
      <SandstoneDoorHalf side="right" animStyle={animStyle} />

      {/* Center Winged Turquoise Scarab */}
      <div
        style={animStyle}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-52 h-28 sm:w-72 sm:h-40 animate-temple-scarab will-change-transform"
      >
        <img
          src="/images/temple-scarab.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>

      {/* Real React TEMPLE DROP Title with Pyramid Crest */}
      <div
        style={animStyle}
        className="pointer-events-none absolute inset-x-0 top-[11%] sm:top-[10%] z-20 flex flex-col items-center text-center px-4 animate-temple-title will-change-transform"
      >
        <div className="flex items-center space-x-2.5 mb-1">
          <span className="h-[2px] w-10 sm:w-16 bg-gradient-to-r from-transparent via-amber-400 to-amber-200" />
          <span className="w-3 h-3 rotate-45 bg-teal-400 border border-amber-100 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
          <span className="h-[2px] w-10 sm:w-16 bg-gradient-to-l from-transparent via-amber-400 to-amber-200" />
        </div>
        <h2
          className="font-display text-3xl sm:text-5xl font-black tracking-[0.22em] uppercase text-transparent bg-clip-text"
          style={{
            backgroundImage: 'linear-gradient(180deg, #fef9c3 0%, #fbbf24 50%, #b45309 100%)',
            filter: 'drop-shadow(0 4px 18px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.55))',
          }}
        >
          TEMPLE DROP
        </h2>
      </div>
    </div>
  );
};

