import React, { useMemo } from 'react';

/**
 * BackgroundAnimation
 * Atmospheric Egyptian Desert Night animations:
 * - NO animation behind the temple pyramid (strictly outside the board)
 * - Richer flying falcons, shooting stars, and celestial particles in the top open sky
 * - Torch embers and fireflies on the left and right flanks
 */
export const BackgroundAnimation = () => {
  // 1. TOP SKY PARTICLES (Above the temple apex, across the open night sky & moon)
  const topSkyParticles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: `top-${i}`,
      left: `${(i * 5.4 + 2) % 96}%`,
      top: `${3 + (i % 5) * 3.8}%`, // 3% to 19% height (strictly in the top sky)
      size: 2 + (i % 3) * 1.5, // 2px to 5px
      tx: `${((i % 5) - 2) * 18}px`,
      ty: `${((i % 3) - 1) * 12}px`,
      duration: `${3 + (i % 4) * 1.2}s`,
      delay: `${(i * 0.35) % 4}s`,
      color: i % 4 === 0 ? '#38bdf8' : '#fde047', // soft cyan celestial & golden stars
      glow: i % 4 === 0 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(251, 191, 36, 0.85)',
    }));
  }, []);

  // 2. LEFT FLANK PARTICLES (Left of temple pyramid: 0% to 16% width)
  const leftFlankParticles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: `left-${i}`,
      left: `${2 + (i % 4) * 3.5}%`, // 2% to 15.5%
      top: `${26 + (i * 6.5) % 48}%`, // 26% to 74%
      size: 2.5 + (i % 3) * 1.5,
      tx: `${((i % 3) - 1) * 15}px`,
      duration: `${3.8 + (i % 3) * 1.2}s`,
      delay: `${(i * 0.5) % 4}s`,
    }));
  }, []);

  // 3. RIGHT FLANK PARTICLES (Right of temple pyramid: 84% to 98% width, near torches & palms)
  const rightFlankParticles = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: `right-${i}`,
      left: `${84 + (i % 4) * 3.6}%`, // 84% to 98%
      top: `${24 + (i * 5.8) % 52}%`, // 24% to 76%
      size: 2.5 + (i % 3) * 1.8,
      tx: `${((i % 3) - 1) * 15}px`,
      duration: `${3.2 + (i % 4) * 1.1}s`,
      delay: `${(i * 0.4) % 4}s`,
    }));
  }, []);

  // 4. BOTTOM DUNES PARTICLES (Below the multiplier chutes: bottom 2% to 12%)
  const bottomParticles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `bottom-${i}`,
      left: `${12 + (i * 15) % 76}%`,
      bottom: `${2 + (i % 3) * 3.5}%`,
      size: 2.5 + (i % 2) * 1.5,
      tx: `${((i % 3) - 1) * 16}px`,
      duration: `${4 + (i % 3) * 1.2}s`,
      delay: `${(i * 0.6) % 3}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-[2]">
      {/* ========================================================
          1. SHOOTING STARS IN TOP SKY
      ======================================================== */}
      {/* Star 1: Across top right sky */}
      <div
        className="absolute top-[6%] right-[10%] w-32 h-[1.5px] bg-gradient-to-l from-transparent via-cyan-100 to-white rounded-full shadow-[0_0_10px_#38bdf8] origin-right"
        style={{
          animation: 'shootingStar 7.5s ease-out infinite',
          animationDelay: '1.2s',
        }}
      />
      {/* Star 2: Across top left sky past the moon */}
      <div
        className="absolute top-[9%] left-[30%] w-24 h-[1.2px] bg-gradient-to-l from-transparent via-amber-100 to-white rounded-full shadow-[0_0_8px_#fbbf24] origin-right"
        style={{
          animation: 'shootingStar 9.5s ease-out infinite',
          animationDelay: '5s',
        }}
      />

      {/* ========================================================
          2. FLOCK OF MOONLIT FALCONS (High in Top Sky: 4vh - 9vh)
      ======================================================== */}
      {/* Falcon 1: Lead Falcon */}
      <div
        className="absolute top-0 left-0"
        style={{
          animation: 'flyAcross1 17s linear infinite',
          animationDelay: '0s',
        }}
      >
        <div
          className="text-amber-100/90 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]"
          style={{
            animation: 'wingFlap 0.48s ease-in-out infinite',
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 64 32" className="w-10 h-5 fill-current">
            <path d="M32 16 C24 5, 11 3, 1 9 C12 16, 22 15, 32 17 C42 15, 52 16, 63 9 C53 3, 40 5, 32 16 Z" />
          </svg>
        </div>
      </div>

      {/* Falcon 2: Wingman Top */}
      <div
        className="absolute top-0 left-0"
        style={{
          animation: 'flyAcross1 17s linear infinite',
          animationDelay: '0.4s',
          transform: 'translateY(-12px) scale(0.82)',
        }}
      >
        <div
          className="text-amber-200/80 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]"
          style={{
            animation: 'wingFlap 0.45s ease-in-out infinite',
            animationDelay: '0.1s',
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 64 32" className="w-8 h-4 fill-current">
            <path d="M32 16 C24 5, 11 3, 1 9 C12 16, 22 15, 32 17 C42 15, 52 16, 63 9 C53 3, 40 5, 32 16 Z" />
          </svg>
        </div>
      </div>

      {/* Falcon 3: Wingman Bottom */}
      <div
        className="absolute top-0 left-0"
        style={{
          animation: 'flyAcross1 17s linear infinite',
          animationDelay: '0.8s',
          transform: 'translateY(14px) scale(0.78)',
        }}
      >
        <div
          className="text-amber-200/75 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
          style={{
            animation: 'wingFlap 0.5s ease-in-out infinite',
            animationDelay: '0.18s',
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 64 32" className="w-7 h-3.5 fill-current">
            <path d="M32 16 C24 5, 11 3, 1 9 C12 16, 22 15, 32 17 C42 15, 52 16, 63 9 C53 3, 40 5, 32 16 Z" />
          </svg>
        </div>
      </div>

      {/* Falcon 4: High Distant Falcon (Right to Left across Moon) */}
      <div
        className="absolute top-0 left-0"
        style={{
          animation: 'flyAcross3 20s linear infinite',
          animationDelay: '6s',
        }}
      >
        <div
          className="text-amber-100/75 drop-shadow-[0_0_7px_rgba(251,191,36,0.65)]"
          style={{
            animation: 'wingFlap 0.54s ease-in-out infinite',
            animationDelay: '0.2s',
            transformOrigin: '50% 50%',
          }}
        >
          <svg viewBox="0 0 64 32" className="w-8 h-4 fill-current">
            <path d="M32 16 C24 5, 11 3, 1 9 C12 16, 22 15, 32 17 C42 15, 52 16, 63 9 C53 3, 40 5, 32 16 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================
          3. TOP SKY CELESTIAL PARTICLES & TWINKLES
      ======================================================== */}
      {topSkyParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, #ffffff 20%, ${p.color} 80%, transparent)`,
            boxShadow: `0 0 ${p.size * 2.5}px ${p.glow}, 0 0 ${p.size * 4}px ${p.glow}`,
            animation: `skyTwinkle ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ========================================================
          4. LEFT FLANK PARTICLES (Desert & Pyramids side)
      ======================================================== */}
      {leftFlankParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, #fef08a 25%, #f59e0b 80%, transparent)',
            boxShadow: `0 0 ${p.size * 2}px #f59e0b, 0 0 ${p.size * 3}px rgba(251, 191, 36, 0.7)`,
            '--tx': p.tx,
            animation: `floatingEmber ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ========================================================
          5. RIGHT FLANK PARTICLES (Torches & Palms side)
      ======================================================== */}
      {rightFlankParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, #fef08a 25%, #f59e0b 80%, transparent)',
            boxShadow: `0 0 ${p.size * 2}px #f59e0b, 0 0 ${p.size * 3.5}px rgba(251, 191, 36, 0.75)`,
            '--tx': p.tx,
            animation: `floatingEmber ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* ========================================================
          6. BOTTOM DUNES PARTICLES (Below temple multipliers)
      ======================================================== */}
      {bottomParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, #fef08a 25%, #f59e0b 80%, transparent)',
            boxShadow: `0 0 ${p.size * 2}px #f59e0b, 0 0 ${p.size * 3}px rgba(251, 191, 36, 0.65)`,
            '--tx': p.tx,
            animation: `floatingEmber ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};
