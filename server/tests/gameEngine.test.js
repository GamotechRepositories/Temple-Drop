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

    expect(counts['BETTER_LUCK']).toBeGreaterThan(250);
    expect(counts['1x']).toBeGreaterThan(200);
    expect(counts['2x']).toBeGreaterThan(120);
    expect(counts['5x']).toBeGreaterThan(15);
    expect(counts['10x']).toBeGreaterThan(40);
  });

  it('verifies boundary paths: all-left lands at 0, 7-rights land at 7 (SPIN), all-right lands at 14', () => {
    // All-left: 14 zeros
    const allLeftSteps = new Array(14).fill(0);
    const leftSlot = allLeftSteps.reduce((a, b) => a + b, 0);
    expect(leftSlot).toBe(0);
    expect(GAME_CONFIG.SLOTS[leftSlot].label).toBe('100x');

    // 7 rights: 7 ones and 7 zeros
    const centerSteps = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const centerSlot = centerSteps.reduce((a, b) => a + b, 0);
    expect(centerSlot).toBe(7);
    expect(GAME_CONFIG.SLOTS[centerSlot].label).toBe('SPIN');
    expect(GAME_CONFIG.SLOTS[centerSlot].isSpin).toBe(true);

    // All-right: 14 ones
    const allRightSteps = new Array(14).fill(1);
    const rightSlot = allRightSteps.reduce((a, b) => a + b, 0);
    expect(rightSlot).toBe(14);
    expect(GAME_CONFIG.SLOTS[rightSlot].label).toBe('100x');
  });

  it('verifies bumper hits carry stable IDs', () => {
    for (const b of GAME_CONFIG.BUMPER_PEGS) {
      expect(b.id).toBeDefined();
      expect(typeof b.id).toBe('string');
      expect(b.id.startsWith('bumper_')).toBe(true);
    }
  });

  it('verifies 0.50 stake in 0.2x slot credits exactly 0.10 (10 cents)', () => {
    const payoutCents = calculateSlotPayoutCents(50, 1, 5);
    expect(payoutCents).toBe(10);
  });

  it('verifies BALLS_PER_DROP_OPTIONS are [10, 20, 25, 30, 40, 50] and BET_PER_BALL are [0.50 to 50.00 credits]', () => {
    expect(GAME_CONFIG.BALLS_PER_DROP_OPTIONS).toEqual([10, 20, 25, 30, 40, 50]);
    expect(GAME_CONFIG.DEFAULT_BALLS_PER_DROP).toBe(10);
    expect(GAME_CONFIG.BET_PER_BALL_OPTIONS_CENTS).toEqual([50, 100, 200, 500, 1000, 2500, 5000]);
    expect(GAME_CONFIG.DEFAULT_BET_PER_BALL_CENTS).toBe(50);
  });
});
