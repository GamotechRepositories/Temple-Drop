import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

/**
 * Draws the 3D sculpted Aztec/Egyptian Temple Wheel with spiked bronze rim,
 * glossy color wedges, and central sunburst + cyan gem hub.
 */
function drawTempleWheel(ctx, size, rotationDeg, outcomes) {
  const center = size / 2;
  const radius = size * 0.4; // Leaves clean room for outer spikes & glow
  const sliceAngle = (Math.PI * 2) / outcomes.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  // 1. Outer ambient golden aura behind the wheel
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
  ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  ctx.restore();

  // 2. Sculpted bright golden triangular spikes around outer perimeter
  const spikeCount = 12;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (i * Math.PI * 2) / spikeCount;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-7, -(radius + 6));
    ctx.lineTo(0, -(radius + 17));
    ctx.lineTo(7, -(radius + 6));
    ctx.closePath();

    const spikeGrad = ctx.createLinearGradient(-7, -(radius + 17), 7, -(radius + 6));
    spikeGrad.addColorStop(0, '#fef9c3');
    spikeGrad.addColorStop(0.5, '#fbbf24');
    spikeGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = spikeGrad;
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Equal-sized vibrant glossy wedges
  let currentAngle = 0;
  outcomes.forEach((outcome) => {
    const wedgeAngle = sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, currentAngle, currentAngle + wedgeAngle);
    ctx.closePath();

    // Radial gloss from hub out to rim
    const midAngle = currentAngle + wedgeAngle / 2;
    const gx = Math.cos(midAngle) * radius * 0.65;
    const gy = Math.sin(midAngle) * radius * 0.65;
    const wedgeGrad = ctx.createRadialGradient(0, 0, 18, gx, gy, radius);
    wedgeGrad.addColorStop(0, outcome.color);
    wedgeGrad.addColorStop(1, outcome.color);
    ctx.fillStyle = wedgeGrad;
    ctx.fill();

    // Subtle inner highlight overlay
    ctx.save();
    ctx.clip();
    const shineGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    shineGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
    shineGrad.addColorStop(0.55, 'rgba(255,255,255,0.12)');
    shineGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();

    // Golden metallic divider spoke
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Crisp bold white text along the wedge
    ctx.save();
    ctx.rotate(midAngle);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    const labelText = outcome.wedgeLabel || outcome.label;
    ctx.font = `900 ${labelText.length > 4 ? 13 : 17}px system-ui, -apple-system, sans-serif`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(labelText, radius - 16, 0);
    ctx.restore();

    currentAngle += wedgeAngle;
  });

  // 4. Proper bright sculpted golden outer bezel ring
  ctx.beginPath();
  ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
  const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  rimGrad.addColorStop(0, '#fef08a');
  rimGrad.addColorStop(0.25, '#fbbf24');
  rimGrad.addColorStop(0.5, '#f59e0b');
  rimGrad.addColorStop(0.75, '#fde047');
  rimGrad.addColorStop(1, '#d97706');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 10;
  ctx.stroke();

  // Bright golden outer highlight & subtle inner rim
  ctx.beginPath();
  ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Center 10-point golden sunburst medallion
  const starPoints = 10;
  const outerStarR = 42;
  const innerStarR = 26;
  ctx.beginPath();
  for (let i = 0; i < starPoints * 2; i++) {
    const r = i % 2 === 0 ? outerStarR : innerStarR;
    const a = (i * Math.PI) / starPoints;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  const starGrad = ctx.createRadialGradient(0, -6, 4, 0, 0, outerStarR);
  starGrad.addColorStop(0, '#fef08a');
  starGrad.addColorStop(0.5, '#d97706');
  starGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = starGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hub bronze bezel
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fillStyle = '#78350f';
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 6. Faceted glowing cyan diamond/hexagon gem in the hub
  const gemR = 17;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const gx = Math.cos(a) * gemR;
    const gy = Math.sin(a) * gemR;
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  }
  ctx.closePath();
  const gemGrad = ctx.createLinearGradient(-gemR, -gemR, gemR, gemR);
  gemGrad.addColorStop(0, '#e0f2fe');
  gemGrad.addColorStop(0.45, '#38bdf8');
  gemGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = gemGrad;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner gem facet highlight
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const gx = Math.cos(a) * (gemR * 0.55);
    const gy = Math.sin(a) * (gemR * 0.55);
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export const WheelModal = ({
  isOpen,
  onClose,
  onSpin,
  spinsRemaining,
}) => {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);

  const currentRotationRef = useRef(0);

  const renderCanvas = useCallback((rotationDeg) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 340;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const outcomes = GAME_CONFIG.WHEEL_OUTCOMES;
    drawTempleWheel(ctx, size, rotationDeg, outcomes);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    renderCanvas(currentRotationRef.current);
  }, [isOpen, renderCanvas]);

  const handleStartSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);
    soundManager.playButtonClick();

    try {
      const result = await onSpin();

      const outcomes = GAME_CONFIG.WHEEL_OUTCOMES;
      const sliceDeg = 360 / outcomes.length;
      const outcomeIndex = Math.max(
        0,
        outcomes.findIndex((o) => o.id === result.outcome.id)
      );
      const visualCenterDeg = outcomeIndex * sliceDeg + sliceDeg / 2;

      const startRot = currentRotationRef.current % 360;
      const numFullTurns = 5;
      const targetDeg = 270 - visualCenterDeg;
      const forwardOffset = ((targetDeg - startRot) % 360 + 360) % 360;
      const totalDelta = numFullTurns * 360 + forwardOffset;

      const duration = 3800;
      const startTime = performance.now();
      let lastTickAngle = startRot;

      const animateWheel = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        const ease = 1 - Math.pow(1 - progress, 3);
        const currentDeg = startRot + totalDelta * ease;
        currentRotationRef.current = currentDeg;

        if (Math.abs(currentDeg - lastTickAngle) >= 25) {
          soundManager.playWheelTick();
          lastTickAngle = currentDeg;
        }

        renderCanvas(currentDeg);

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          setIsSpinning(false);
          setSpinResult(result);
          if (result.grossPayoutCents > 0) {
            soundManager.playWheelWin(false);
          }
        }
      };

      requestAnimationFrame(animateWheel);
    } catch {
      setIsSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none animate-fade-in"
      style={{
        background:
          'radial-gradient(circle at 50% 48%, rgba(168, 85, 247, 0.22) 0%, rgba(15, 23, 42, 0.92) 55%, rgba(2, 6, 23, 0.97) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Close Button */}
      {!isSpinning && (
        <button
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2.5 text-slate-950 rounded-full transition-all shadow-lg z-30 hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 55%, #d97706 100%)',
            border: '2px solid #fef08a',
          }}
          aria-label="Close spin wheel"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="relative flex flex-col items-center max-w-md w-full">
        {/* 3D Metallic Bronze/Gold "FREE SPIN" Header */}
        <div className="flex flex-col items-center mb-1 z-20">
          <h2
            className="font-display font-black text-4xl sm:text-5xl uppercase tracking-wider text-center leading-none"
            style={{
              background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 55%, #92400e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9))',
            }}
          >
            FREE SPIN
          </h2>
          <span className="mt-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/40 text-[11px] font-bold text-amber-300 tracking-wider uppercase shadow">
            Spins Remaining: {spinsRemaining}
          </span>
        </div>

        {/* Wheel + Top Cyan Diamond Pointer */}
        <div className="relative flex items-center justify-center mt-1">
          {/* Sculpted Bronze & Cyan Diamond Pointer at Top */}
          <div className="absolute -top-2 z-20 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]">
            <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
              {/* Bronze bezel */}
              <path
                d="M23 44 L4 10 L13 2 L33 2 L42 10 Z"
                fill="url(#bronzeBezel)"
                stroke="#451a03"
                strokeWidth="2"
              />
              {/* Glowing cyan diamond */}
              <path
                d="M23 37 L10 12 L16 6 L30 6 L36 12 Z"
                fill="url(#cyanDiamond)"
                stroke="#bae6fd"
                strokeWidth="1.2"
              />
              <path d="M23 37 L16 12 L23 6 L30 12 Z" fill="rgba(255,255,255,0.35)" />
              <defs>
                <linearGradient id="bronzeBezel" x1="4" y1="2" x2="42" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="cyanDiamond" x1="10" y1="6" x2="36" y2="37" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="45%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <canvas
            ref={canvasRef}
            style={{ width: '320px', height: '320px' }}
            className="sm:w-[340px] sm:h-[340px]"
          />
        </div>

        {/* Result Banner */}
        {spinResult && (
          <div
            className="mt-2 px-5 py-3 rounded-2xl w-full max-w-[320px] text-center animate-bounce"
            style={{
              background: 'linear-gradient(180deg, #0c172c 0%, #070e1c 100%)',
              border: '2.5px solid #d97706',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.35), inset 0 0 12px rgba(245, 158, 11, 0.15)',
            }}
          >
            {spinResult.outcome.id === 'BETTER_LUCK' || spinResult.outcome.num === 0 ? (
              <div className="flex flex-col items-center space-y-0.5">
                <span className="text-purple-300 font-display font-black text-lg">
                  Better Luck Next Time
                </span>
                <span className="text-xs text-slate-400">
                  Keep dropping to earn more Free Spins!
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                  Won Multiplier
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  +{centsToCredits(spinResult.grossPayoutCents)} ₹
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  ({spinResult.outcome.label} on bet per ball)
                </span>
                {spinResult.payoutCapReached && (
                  <span className="text-[10px] text-rose-400 mt-1 font-bold">
                    Max Round Cap (5,000 ₹) Reached!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 w-full max-w-[300px]">
          {spinResult ? (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                if (spinsRemaining > 0) {
                  setSpinResult(null);
                } else {
                  onClose();
                }
              }}
              className="w-full py-3.5 rounded-2xl font-display font-black tracking-widest uppercase text-sm text-slate-950 shadow-glow-gold transition-all active:scale-95 hover:brightness-110"
              style={{
                background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
                border: '1.5px solid #fef08a',
              }}
            >
              {spinsRemaining > 0 ? 'Next Spin' : 'Continue'}
            </button>
          ) : (
            <button
              disabled={isSpinning}
              onClick={handleStartSpin}
              className="w-full py-3.5 rounded-2xl font-display font-black tracking-widest uppercase text-base text-slate-950 shadow-glow-gold flex items-center justify-center space-x-2 transition-all active:scale-95 hover:brightness-110 disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
                border: '1.5px solid #fef08a',
              }}
            >
              <Sparkles className="w-5 h-5" />
              <span>{isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
