import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/services/gameEngine.js';
import { GAME_CONFIG, calculateSlotPayoutCents } from '@temple-drop/shared';

describe('GameEngine - Core Plinko Math & Physics', () => {
  it('generates 14 steps with 50/50 decisions and exact slot index', () => {
    for (let test = 0; test < 100; test++) {
      const pathData = GameEngine.generateBallPath();
      expect(pathData.steps).toHaveLength(14);
      for (const step of pathData.steps) {
        expect(step === 0 || step === 1).toBe(true);
      }

      const expectedSlot = pathData.steps.reduce((a, b) => a + b, 0);
      expect(pathData.slotIndex).toBe(expectedSlot);
      expect(pathData.slotIndex).toBeGreaterThanOrEqual(0);
      expect(pathData.slotIndex).toBeLessThanOrEqual(14);

      expect(pathData.visitedPegs).toHaveLength(14);
      for (let r = 0; r < 14; r++) {
        expect(pathData.visitedPegs[r].row).toBe(r);
      }
    }
  });

  it('correctly detects bumper hits only when visited pegs match bumper coordinates', () => {
    const bumperPegs = GAME_CONFIG.BUMPER_PEGS;

    for (let i = 0; i < 50; i++) {
      const pathData = GameEngine.generateBallPath();
      for (const hit of pathData.bumperHits) {
        const matchesBumper = bumperPegs.some((b) => b.row === hit.row && b.col === hit.col);
        expect(matchesBumper).toBe(true);
      }
    }
  });

  it('computes integer slot payouts without floating point discrepancies', () => {
    expect(calculateSlotPayoutCents(50, 100, 1)).toBe(5000);
    expect(calculateSlotPayoutCents(50, 1, 2)).toBe(25);
    expect(calculateSlotPayoutCents(50, 1, 5)).toBe(10);
    expect(calculateSlotPayoutCents(25000, 1, 5)).toBe(5000);
    expect(calculateSlotPayoutCents(50, 0, 1)).toBe(0);
  });

  it('strictly caps combined winnings at 5,000 credits (500,000 cents)', () => {
    const result = GameEngine.processDrop({
      betPerBallCents: 50000,
      ballCount: 1,
      currentRoundGrossWinCents: 498000,
    });

    if (result.balls[0].rawPayoutCents > 0) {
      expect(result.boardCreditedPayoutCents).toBe(2000);
      expect(result.newRoundGrossWinCents).toBe(GAME_CONFIG.PAYOUT_CAP_CENTS);
      expect(result.payoutCapReached).toBe(true);
    }
  });

  it('spins reward wheel respecting configured outcomes and cap', () => {
    const counts = {};
    for (let i = 0; i < 1000; i++) {
      const res = GameEngine.spinWheel(100, 0);
      counts[res.outcome.id] = (counts[res.outcome.id] || 0) + 1;
      expect(res.angleTargetDegrees).toBeGreaterThanOrEqual(0);
      expect(res.angleTargetDegrees).toBeLessThanOrEqual(360);
    }

    expect(counts['1x']).toBeGreaterThan(200);
    expect(counts['2x']).toBeGreaterThan(150);
    expect(counts['5x']).toBeGreaterThan(100);
    expect(counts['10x']).toBeGreaterThan(40);
    expect(counts['BONUS']).toBeGreaterThan(10);
  });
});
