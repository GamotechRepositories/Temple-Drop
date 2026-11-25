import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GAME_CONFIG } from '@temple-drop/shared';
import { soundManager } from '../audio/soundManager.js';

export const PlinkoBoard = ({
  ballsToAnimate,
  onAnimationComplete,
  onBallLand,
  fastMode,
  reducedMotion,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // References for live animation loop
  const activeBallsRef = useRef([]);
  const particlesRef = useRef([]);
  const bumperPulsesRef = useRef([]);
  const pegFlashesRef = useRef([]);
  const animFrameIdRef = useRef(null);

  // Keep callback refs stable across re-renders
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const onBallLandRef = useRef(onBallLand);
  const fastModeRef = useRef(fastMode);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
    onBallLandRef.current = onBallLand;
    fastModeRef.current = fastMode;
  }, [onAnimationComplete, onBallLand, fastMode]);

  // Board dimensions adapting smoothly to container
  const [boardSize, setBoardSize] = useState({ width: 380, height: 260 });

  const TOTAL_ROWS = 13; // 13 visible rows (Row 0 to Row 12), with last row removed as requested

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    if (containerW <= 0) return;
    const targetW = Math.max(260, Math.min(500, containerW));
    // Proportional height matching the Plinko triangle
    const targetH = Math.round(targetW * 0.72);
    setBoardSize({ width: targetW, height: targetH });
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  // Mathematical coordinate system:
  // Row r in [0, 12], Col c in [0, r].
  // Spacing based on 15 equal slot intervals across width W.
  const getPegPosition = useCallback((row, col, width, height) => {
    const slotSpacing = width / GAME_CONFIG.SLOTS_COUNT;
    const x = width / 2 + (col - row / 2) * slotSpacing;

    const yStart = height * 0.26;
    const yEnd = height * 0.98;
    const ySpacing = (yEnd - yStart) / (TOTAL_ROWS - 1);
    const y = yStart + row * ySpacing;

    return { x, y };
  }, []);

  // Landing slot center at bottom of canvas (aligns exactly with SlotRow column centers)
  const getSlotCenter = useCallback((slotIndex, width, height) => {
    const slotSpacing = width / GAME_CONFIG.SLOTS_COUNT;
    const x = (slotIndex + 0.5) * slotSpacing;
    const y = height * 1.02; // Entry to slot chute
    return { x, y };
  }, []);

  // Launcher aperture (aperture at the top arch)
  const getLauncherPosition = useCallback((width, height) => {
    return { x: width / 2, y: height * 0.10 };
  }, []);

  // Handle incoming balls to drop from API
  useEffect(() => {
    if (!ballsToAnimate || ballsToAnimate.length === 0) return;

    if (reducedMotion) {
      ballsToAnimate.forEach((ball) => {
        if (onBallLandRef.current) onBallLandRef.current(ball.slotIndex);
        const slot = GAME_CONFIG.SLOTS[ball.slotIndex];
        soundManager.playSlotWin(slot.isSpin, slot.num / slot.den);
      });
      if (onAnimationCompleteRef.current) onAnimationCompleteRef.current();
      return;
    }

    const now = performance.now();
    // Tuning values: 100-150ms stagger, 2-3s travel per ball
    const isFast = fastModeRef.current;
    const staggerInterval = isFast ? 80 : 130;
    const dropDuration = isFast ? 1300 : 2400;

    const newBalls = ballsToAnimate.map((b, idx) => {
      const slot = GAME_CONFIG.SLOTS[b.slotIndex];
      return {
        id: b.index !== undefined ? b.index : idx,
        steps: b.steps,
        visitedPegs: b.visitedPegs,
        bumperHits: b.bumperHits || [],
        slotIndex: b.slotIndex,
        isSpin: b.isSpin,
        multiplier: slot.num / slot.den,
        startTime: now + idx * staggerInterval,
        duration: dropDuration,
        settled: false,
        resting: false,
        restStartTime: 0,
        lastSegmentTriggered: -1,
      };
    });

    activeBallsRef.current = newBalls;
    soundManager.playBallLaunch();
  }, [ballsToAnimate, reducedMotion]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (currentTime) => {
      const { width, height } = boardSize;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      // Radii based on scale
      const isMobile = width < 360;
      const pegRadius = isMobile ? 2.0 : 2.5;
      const ballRadius = isMobile ? 3.0 : 3.6;
      const bumperRadius = Math.max(8.5, width * 0.024);

      // 2. Render 13 rows of metallic pegs (last row removed per user request)
      for (let r = 0; r < TOTAL_ROWS; r++) {
        for (let c = 0; c <= r; c++) {
          const isBumper = GAME_CONFIG.BUMPER_PEGS.some((b) => b.row === r && b.col === c);
          if (isBumper) continue; // Bumpers rendered separately

          const { x, y } = getPegPosition(r, c, width, height);
          const flash = pegFlashesRef.current.find((f) => f.row === r && f.col === c);

          // Subtle lower shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.beginPath();
          ctx.arc(x, y + 1.2, pegRadius + 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Metallic peg body
          if (flash) {
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#fef08a';
            ctx.shadowBlur = 8;
          } else {
            const pegGrad = ctx.createRadialGradient(x - 0.7, y - 0.7, 0.3, x, y, pegRadius);
            pegGrad.addColorStop(0, '#ffffff');
            pegGrad.addColorStop(0.35, '#cbd5e1');
            pegGrad.addColorStop(1, '#475569');
            ctx.fillStyle = pegGrad;
          }

          ctx.beginPath();
          ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Decrement peg flashes
      pegFlashesRef.current.forEach((f) => f.timer--);
      pegFlashesRef.current = pegFlashesRef.current.filter((f) => f.timer > 0);

      // 3. Render 3 Amber Energy Bumpers at (5, 2), (5, 3), (6, 3)
      GAME_CONFIG.BUMPER_PEGS.forEach((b) => {
        const { x, y } = getPegPosition(b.row, b.col, width, height);

        // Active pulse animation if hit
        const activePulse = bumperPulsesRef.current.find(
          (p) => p.row === b.row && p.col === b.col
        );

        ctx.save();
        if (activePulse) {
          ctx.strokeStyle = `rgba(251, 191, 36, ${activePulse.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, bumperRadius * activePulse.scale, 0, Math.PI * 2);
          ctx.stroke();

          activePulse.scale += 0.05;
          activePulse.alpha -= 0.04;
        }

        // Bumper shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.arc(x, y + 1.8, bumperRadius + 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing outer medallion
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;

        const bGrad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, bumperRadius);
        bGrad.addColorStop(0, '#fef08a');
        bGrad.addColorStop(0.3, '#f59e0b');
        bGrad.addColorStop(0.8, '#b45309');
        bGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(x, y, bumperRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Inner electric bolt glyph
        ctx.fillStyle = '#451a03';
        ctx.font = `bold ${Math.round(bumperRadius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', x, y + 0.5);

        ctx.restore();
      });

      bumperPulsesRef.current = bumperPulsesRef.current.filter((p) => p.alpha > 0);

      // 4. Update and Render Animated Balls
      let allSettled = true;
      const launcher = getLauncherPosition(width, height);
      const TOTAL_SEGMENTS = TOTAL_ROWS + 1; // 0 to 13 = 14 segments

      activeBallsRef.current.forEach((ball) => {
        if (currentTime < ball.startTime) {
          allSettled = false;
          return;
        }

        if (ball.settled) return;

        allSettled = false;
        const elapsed = currentTime - ball.startTime;
        const totalProgress = Math.min(1.0, elapsed / ball.duration);

        let ballX = launcher.x;
        let ballY = launcher.y;

        if (totalProgress < 1.0) {
          // Ball is actively dropping through segments
          const globalProgress = totalProgress * TOTAL_SEGMENTS;
          const segmentIndex = Math.min(TOTAL_SEGMENTS - 1, Math.floor(globalProgress));
          const u = globalProgress - segmentIndex; // Local progress in segment [0, 1]

          let pStart, pEnd;
          let currentStepDirection = 0; // -1 for left, 1 for right

          if (segmentIndex === 0) {
            // Segment 0: Launcher -> Row 0 Peg (0, 0)
            pStart = launcher;
            pEnd = getPegPosition(0, 0, width, height);
            currentStepDirection = ball.steps[0] === 0 ? -1 : 1;
          } else if (segmentIndex <= TOTAL_ROWS - 1) {
            // Peg-to-Peg segments: Row (segmentIndex - 1) to Row segmentIndex
            const fromPeg = ball.visitedPegs[segmentIndex - 1];
            const toPeg = ball.visitedPegs[segmentIndex];
            pStart = getPegPosition(fromPeg.row, fromPeg.col, width, height);
            pEnd = getPegPosition(toPeg.row, toPeg.col, width, height);
            currentStepDirection = ball.steps[segmentIndex - 1] === 0 ? -1 : 1;
          } else {
            // Final segment: Row 12 Peg to Slot Entry
            const lastPeg = ball.visitedPegs[TOTAL_ROWS - 1];
            pStart = getPegPosition(lastPeg.row, lastPeg.col, width, height);
            pEnd = getSlotCenter(ball.slotIndex, width, height);
            currentStepDirection = ball.steps[TOTAL_ROWS - 1] === 0 ? -1 : 1;
          }

          // Trigger contact event at segment start
          if (segmentIndex > ball.lastSegmentTriggered) {
            ball.lastSegmentTriggered = segmentIndex;

            if (segmentIndex > 0 && segmentIndex <= TOTAL_ROWS) {
              const hitPeg = ball.visitedPegs[segmentIndex - 1];
              soundManager.playPegHit(hitPeg.row);
              pegFlashesRef.current.push({ row: hitPeg.row, col: hitPeg.col, timer: 7 });

              // Check bumper hit
              const wasBumperHit = GAME_CONFIG.BUMPER_PEGS.some(
                (b) => b.row === hitPeg.row && b.col === hitPeg.col
              );
              if (wasBumperHit) {
                soundManager.playBumperHit();
                bumperPulsesRef.current.push({
                  row: hitPeg.row,
                  col: hitPeg.col,
                  scale: 1,
                  alpha: 1,
                });

                // Spark burst
                for (let i = 0; i < 9; i++) {
                  particlesRef.current.push({
                    x: pStart.x,
                    y: pStart.y,
                    vx: (Math.random() - 0.5) * 3.5,
                    vy: (Math.random() - 0.5) * 3.5,
                    color: '#fbbf24',
                    radius: Math.random() * 2 + 1,
                    alpha: 1,
                    decay: 0.04,
                  });
                }
              }
            }
          }

          // Continuous curved bounce trajectory
          // Arc deflection rolls around peg perimeter then accelerates under gravity
          const gravityCurve = u * u;
          const bounceArc = Math.sin(u * Math.PI) * 3.8 * currentStepDirection;

          ballX = pStart.x + (pEnd.x - pStart.x) * u + bounceArc;
          ballY = pStart.y + (pEnd.y - pStart.y) * gravityCurve;
        } else {
          // Ball has reached the slot!
          const slotPos = getSlotCenter(ball.slotIndex, width, height);

          if (!ball.resting) {
            ball.resting = true;
            ball.restStartTime = currentTime;
            soundManager.playSlotWin(ball.isSpin, ball.multiplier);

            if (onBallLandRef.current) {
              onBallLandRef.current(ball.slotIndex);
            }

            // Burst particles at chute entrance
            for (let p = 0; p < 8; p++) {
              particlesRef.current.push({
                x: slotPos.x,
                y: slotPos.y,
                vx: (Math.random() - 0.5) * 2.8,
                vy: -Math.random() * 2.5 - 0.6,
                color: ball.isSpin ? '#22d3ee' : '#fbbf24',
                radius: Math.random() * 2 + 1,
                alpha: 1,
                decay: 0.035,
              });
            }
          }

          // Ball rests visible inside chute chamber for 450ms before clearing
          const restElapsed = currentTime - ball.restStartTime;
          const restProgress = Math.min(1.0, restElapsed / 450);

          ballX = slotPos.x;
          // Settles slightly downward into the chute
          ballY = slotPos.y + restProgress * 6;

          if (restElapsed >= 450) {
            ball.settled = true;
          }
        }

        // Draw Ball
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;

        const ballGrad = ctx.createRadialGradient(
          ballX - 1.2,
          ballY - 1.2,
          0.4,
          ballX,
          ballY,
          ballRadius
        );
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.3, '#fef08a');
        ballGrad.addColorStop(0.7, '#f59e0b');
        ballGrad.addColorStop(1, '#92400e');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Update and Render Particles
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

      // Check if entire drop round is settled
      if (
        activeBallsRef.current.length > 0 &&
        allSettled &&
        particlesRef.current.length === 0
      ) {
        activeBallsRef.current = [];
        if (onAnimationCompleteRef.current) {
          onAnimationCompleteRef.current();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    boardSize,
    getPegPosition,
    getSlotCenter,
    getLauncherPosition,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        style={{ width: `${boardSize.width}px`, height: `${boardSize.height}px` }}
        className="block touch-none"
      />
    </div>
  );
};
