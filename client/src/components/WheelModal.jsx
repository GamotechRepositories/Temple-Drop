import React, { useRef, useEffect, useState } from 'react';
import { X, Sparkles, Disc } from 'lucide-react';
import { GAME_CONFIG, centsToCredits } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

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

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size * 0.44;
    const outcomes = GAME_CONFIG.WHEEL_OUTCOMES;
    const totalWeight = outcomes.reduce((a, b) => a + b.weight, 0);

    const drawWheel = (rotationDeg) => {
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((rotationDeg * Math.PI) / 180);

      let currentAngle = 0;

      outcomes.forEach((outcome) => {
        const wedgeAngle = (outcome.weight / totalWeight) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, currentAngle, currentAngle + wedgeAngle);
        ctx.closePath();

        ctx.fillStyle = outcome.color;
        ctx.fill();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.rotate(currentAngle + wedgeAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${outcome.isBonus ? 12 : 14}px sans-serif`;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(outcome.label, radius - 15, 5);
        ctx.restore();

        currentAngle += wedgeAngle;
      });

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      const hubGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      hubGrad.addColorStop(0, '#fef08a');
      hubGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    };

    drawWheel(currentRotationRef.current);
  }, [isOpen]);

  const handleStartSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);
    soundManager.playButtonClick();

    try {
      const result = await onSpin();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 320;
      const center = size / 2;
      const radius = size * 0.44;
      const outcomes = GAME_CONFIG.WHEEL_OUTCOMES;
      const totalWeight = outcomes.reduce((a, b) => a + b.weight, 0);

      const startRot = currentRotationRef.current % 360;
      const numFullTurns = 5;
      const targetDeg = 270 - result.angleTargetDegrees;
      const totalDelta = numFullTurns * 360 + ((targetDeg - startRot) % 360);

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

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((currentDeg * Math.PI) / 180);

        let curAngle = 0;
        outcomes.forEach((outcome) => {
          const wedgeAngle = (outcome.weight / totalWeight) * 2 * Math.PI;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, radius, curAngle, curAngle + wedgeAngle);
          ctx.closePath();
          ctx.fillStyle = outcome.color;
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.save();
          ctx.rotate(curAngle + wedgeAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${outcome.isBonus ? 12 : 14}px sans-serif`;
          ctx.fillText(outcome.label, radius - 15, 5);
          ctx.restore();

          curAngle += wedgeAngle;
        });

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.restore();

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          setIsSpinning(false);
          setSpinResult(result);
          soundManager.playWheelWin(result.outcome.isBonus);
        }
      };

      requestAnimationFrame(animateWheel);
    } catch {
      setIsSpinning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full relative shadow-glow-amber flex flex-col items-center">
        {!isSpinning && (
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-all"
            aria-label="Close spin wheel"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 mb-2">
          <Disc className="w-6 h-6 text-amber-400 animate-spin-slow" />
          <h2 className="font-display font-black text-xl text-amber-300 uppercase tracking-wider">
            Temple Wheel
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Spins Remaining: <strong className="text-amber-400">{spinsRemaining}</strong>
        </p>

        <div className="relative flex items-center justify-center my-2">
          <div className="absolute -top-3 z-20 flex flex-col items-center drop-shadow-lg">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400" />
          </div>

          <canvas ref={canvasRef} style={{ width: '300px', height: '300px' }} />
        </div>

        {spinResult && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-800/90 border border-amber-500/40 w-full text-center animate-bounce">
            {spinResult.outcome.isBonus ? (
              <div className="flex flex-col items-center space-y-1">
                <span className="text-amber-400 font-display font-black text-lg">
                  🎉 BONUS UNLOCKED!
                </span>
                <span className="text-xs text-teal-300">
                  5 Free Balls granted in Temple Bonus Round!
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">Won Multiplier</span>
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

        <div className="mt-5 w-full">
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
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wider uppercase text-sm shadow-glow-gold transition-all"
            >
              {spinsRemaining > 0 ? 'Next Spin' : 'Continue'}
            </button>
          ) : (
            <button
              disabled={isSpinning}
              onClick={handleStartSpin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-display font-black tracking-widest uppercase text-base shadow-glow-gold flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
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
