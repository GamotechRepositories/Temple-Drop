import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GAME_CONFIG } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const BoardCanvas = ({
  ballsToAnimate,
  onAnimationComplete,
  fastMode,
  reducedMotion,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const activeBallsRef = useRef([]);
  const particlesRef = useRef([]);
  const bumperPulsesRef = useRef([]);
  const slotFlashesRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 680, height: 600 });

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const boardWidth = Math.min(740, Math.max(340, w - 16));
    const boardHeight = Math.round(boardWidth * 0.95);
    setDimensions({ width: boardWidth, height: boardHeight });
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    if (!ballsToAnimate || ballsToAnimate.length === 0) return;

    if (reducedMotion) {
      ballsToAnimate.forEach((ball) => {
        slotFlashesRef.current.push({
          slotIndex: ball.slotIndex,
          alpha: 1,
          timer: 30,
        });
        const slot = GAME_CONFIG.SLOTS[ball.slotIndex];
        soundManager.playSlotWin(slot.isSpin, slot.num / slot.den);
      });
      onAnimationComplete();
      return;
    }

    const now = performance.now();
    const staggerInterval = fastMode ? 60 : 150;

    const newBalls = ballsToAnimate.map((b, idx) => {
      const slot = GAME_CONFIG.SLOTS[b.slotIndex];
      return {
        id: b.index,
        steps: b.steps,
        visitedPegs: b.visitedPegs,
        slotIndex: b.slotIndex,
        isSpin: b.isSpin,
        multiplier: slot.num / slot.den,
        startTime: now + idx * staggerInterval,
        progress: 0,
        settled: false,
        lastRowHit: -1,
      };
    });

    activeBallsRef.current = newBalls;
    soundManager.playBallLaunch();
  }, [ballsToAnimate, fastMode, reducedMotion, onAnimationComplete]);

  const getPegPosition = useCallback(
    (row, col, width, height) => {
      const topPadding = height * 0.11;
      const bottomPadding = height * 0.16;
      const availableHeight = height - topPadding - bottomPadding;
      const rowSpacing = availableHeight / GAME_CONFIG.ROWS;

      const y = topPadding + row * rowSpacing;

      const maxColSpread = width * 0.88;
      const rowSpread = (row / (GAME_CONFIG.ROWS - 1)) * maxColSpread;
      const startX = (width - rowSpread) / 2;

      const colSpacing = row === 0 ? 0 : rowSpread / row;
      const x = startX + col * colSpacing;

      return { x, y };
    },
    []
  );

  const getSlotPosition = useCallback(
    (slotIndex, width, height) => {
      const y = height * 0.90;
      const slotWidth = (width * 0.92) / GAME_CONFIG.SLOTS_COUNT;
      const startX = (width - width * 0.92) / 2;
      const x = startX + (slotIndex + 0.5) * slotWidth;
      return { x, y, width: slotWidth };
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const render = (currentTime) => {
      const { width, height } = dimensions;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      const topW = width * 0.28;
      const bottomW = width * 0.96;
      const boardTop = height * 0.04;
      const boardBottom = height * 0.98;

      ctx.beginPath();
      ctx.moveTo((width - topW) / 2, boardTop);
      ctx.lineTo((width + topW) / 2, boardTop);
      ctx.lineTo((width + bottomW) / 2, boardBottom);
      ctx.lineTo((width - bottomW) / 2, boardBottom);
      ctx.closePath();

      const boardGrad = ctx.createLinearGradient(0, boardTop, 0, boardBottom);
      boardGrad.addColorStop(0, '#10141d');
      boardGrad.addColorStop(0.5, '#0e121a');
      boardGrad.addColorStop(1, '#090c12');
      ctx.fillStyle = boardGrad;
      ctx.fill();

      ctx.strokeStyle = '#273248';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(13, 148, 136, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      const chuteX = width / 2;
      const chuteY = height * 0.05;
      const chuteGrad = ctx.createRadialGradient(chuteX, chuteY, 4, chuteX, chuteY, 24);
      chuteGrad.addColorStop(0, '#f59e0b');
      chuteGrad.addColorStop(0.5, '#78350f');
      chuteGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = chuteGrad;
      ctx.beginPath();
      ctx.arc(chuteX, chuteY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      for (let r = 0; r < GAME_CONFIG.ROWS; r++) {
        for (let c = 0; c <= r; c++) {
          const isBumper = GAME_CONFIG.BUMPER_PEGS.some((b) => b.row === r && b.col === c);
          if (isBumper) continue;

          const { x, y } = getPegPosition(r, c, width, height);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.arc(x, y + 1.5, 3.5, 0, Math.PI * 2);
          ctx.fill();

          const pegGrad = ctx.createRadialGradient(x - 1, y - 1, 0.5, x, y, 3.5);
          pegGrad.addColorStop(0, '#f8fafc');
          pegGrad.addColorStop(0.4, '#94a3b8');
          pegGrad.addColorStop(1, '#475569');
          ctx.fillStyle = pegGrad;
          ctx.beginPath();
          ctx.arc(x, y, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      GAME_CONFIG.BUMPER_PEGS.forEach((b) => {
        const { x, y } = getPegPosition(b.row, b.col, width, height);
        const radius = Math.max(12, width * 0.024);

        const activePulse = bumperPulsesRef.current.find(
          (p) => p.row === b.row && p.col === b.col
        );

        ctx.save();
        if (activePulse) {
          ctx.strokeStyle = `rgba(251, 191, 36, ${activePulse.alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, radius * activePulse.scale, 0, Math.PI * 2);
          ctx.stroke();

          activePulse.scale += 0.05;
          activePulse.alpha -= 0.04;
        }

        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;

        const bGrad = ctx.createRadialGradient(x - 2, y - 2, 2, x, y, radius);
        bGrad.addColorStop(0, '#fef08a');
        bGrad.addColorStop(0.3, '#f59e0b');
        bGrad.addColorStop(0.8, '#b45309');
        bGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#451a03';
        ctx.font = `bold ${Math.round(radius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x, y + 0.5);

        ctx.restore();
      });

      bumperPulsesRef.current = bumperPulsesRef.current.filter((p) => p.alpha > 0);

      const slotY = height * 0.88;
      const slotH = height * 0.09;
      const slotTotalW = width * 0.94;
      const slotW = slotTotalW / GAME_CONFIG.SLOTS_COUNT;
      const slotStartX = (width - slotTotalW) / 2;

      for (let s = 0; s < GAME_CONFIG.SLOTS_COUNT; s++) {
        const slot = GAME_CONFIG.SLOTS[s];
        const x = slotStartX + s * slotW;
        const isSpin = slot.isSpin;

        const flash = slotFlashesRef.current.find((f) => f.slotIndex === s);

        ctx.save();

        if (flash) {
          ctx.shadowColor = slot.color;
          ctx.shadowBlur = 18;
          ctx.fillStyle = isSpin ? '#fef08a' : slot.color;
        } else {
          ctx.fillStyle = isSpin
            ? 'rgba(234, 179, 8, 0.25)'
            : 'rgba(30, 41, 59, 0.75)';
        }

        ctx.fillRect(x + 1, slotY, slotW - 2, slotH);

        ctx.strokeStyle = isSpin ? '#eab308' : slot.color;
        ctx.lineWidth = isSpin ? 2.5 : 1.5;
        ctx.strokeRect(x + 1, slotY, slotW - 2, slotH);

        ctx.shadowBlur = 0;
        ctx.fillStyle = isSpin ? '#fef08a' : '#f8fafc';
        const fontSize = Math.max(9, Math.min(13, Math.round(slotW * 0.36)));
        ctx.font = `${isSpin ? 'bold ' : ''}${fontSize}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.label, x + slotW / 2, slotY + slotH / 2);

        ctx.restore();

        if (flash) {
          flash.timer--;
          if (flash.timer <= 0) {
            flash.alpha = 0;
          }
        }
      }

      slotFlashesRef.current = slotFlashesRef.current.filter((f) => f.alpha > 0);

      let allSettled = true;
      const speed = fastMode ? 0.024 : 0.010;

      activeBallsRef.current.forEach((ball) => {
        if (currentTime < ball.startTime) {
          allSettled = false;
          return;
        }

        if (ball.settled) return;

        allSettled = false;
        ball.progress += speed * 60;

        const currentStepIndex = Math.min(
          GAME_CONFIG.STEPS_COUNT - 1,
          Math.floor(ball.progress)
        );
        const fraction = ball.progress - currentStepIndex;

        const fromPeg = ball.visitedPegs[currentStepIndex] || { row: 0, col: 0 };
        const toPeg =
          currentStepIndex + 1 < ball.visitedPegs.length
            ? ball.visitedPegs[currentStepIndex + 1]
            : { row: GAME_CONFIG.ROWS, col: ball.slotIndex };

        const pFrom = getPegPosition(fromPeg.row, fromPeg.col, width, height);
        const pTo =
          toPeg.row < GAME_CONFIG.ROWS
            ? getPegPosition(toPeg.row, toPeg.col, width, height)
            : getSlotPosition(ball.slotIndex, width, height);

        if (currentStepIndex > ball.lastRowHit) {
          ball.lastRowHit = currentStepIndex;
          soundManager.playPegHit(fromPeg.row);

          if (
            GAME_CONFIG.BUMPER_PEGS.some(
              (b) => b.row === fromPeg.row && b.col === fromPeg.col
            )
          ) {
            soundManager.playBumperHit();
            bumperPulsesRef.current.push({
              row: fromPeg.row,
              col: fromPeg.col,
              scale: 1,
              alpha: 1,
            });

            for (let i = 0; i < 12; i++) {
              particlesRef.current.push({
                x: pFrom.x,
                y: pFrom.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#fbbf24',
                radius: Math.random() * 2 + 1,
                alpha: 1,
                decay: 0.04,
              });
            }
          }
        }

        const y = pFrom.y + (pTo.y - pFrom.y) * (fraction * fraction);
        const bounceOffset = Math.sin(fraction * Math.PI) * 5 * (ball.steps[currentStepIndex] === 0 ? -1 : 1);
        const x = pFrom.x + (pTo.x - pFrom.x) * fraction + bounceOffset;

        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;

        const ballGrad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 6);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.3, '#fef08a');
        ballGrad.addColorStop(0.7, '#f59e0b');
        ballGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (ball.progress >= GAME_CONFIG.STEPS_COUNT) {
          ball.settled = true;
          soundManager.playSlotWin(ball.isSpin, ball.multiplier);

          slotFlashesRef.current.push({
            slotIndex: ball.slotIndex,
            alpha: 1,
            timer: 20,
          });

          const slotPos = getSlotPosition(ball.slotIndex, width, height);
          for (let p = 0; p < 8; p++) {
            particlesRef.current.push({
              x: slotPos.x,
              y: slotPos.y,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 3 - 1,
              color: ball.isSpin ? '#fef08a' : '#38bdf8',
              radius: Math.random() * 2 + 1,
              alpha: 1,
              decay: 0.03,
            });
          }
        }
      });

      particlesRef.current.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.alpha > 0);

      if (
        activeBallsRef.current.length > 0 &&
        allSettled &&
        particlesRef.current.length === 0
      ) {
        activeBallsRef.current = [];
        onAnimationComplete();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [dimensions, getPegPosition, getSlotPosition, fastMode, onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto flex items-center justify-center p-1 sm:p-2"
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="block touch-none drop-shadow-2xl"
      />
    </div>
  );
};
