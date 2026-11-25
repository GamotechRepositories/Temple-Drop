import crypto from 'crypto';
import {
  GAME_CONFIG,
  calculateSlotPayoutCents,
} from '@temple-drop/shared';

export class GameEngine {
  /**
   * Generates a single ball path with 14 left/right 50/50 decisions using crypto.randomInt.
   */
  static generateBallPath() {
    const steps = [];
    const visitedPegs = [];
    const bumperHits = [];

    let currentPeg = { row: 0, col: 0 };
    visitedPegs.push({ ...currentPeg });

    if (this.isBumperPeg(currentPeg)) {
      bumperHits.push({ ...currentPeg });
    }

    for (let r = 0; r < GAME_CONFIG.STEPS_COUNT; r++) {
      const step = crypto.randomInt(0, 2);
      steps.push(step);

      currentPeg = {
        row: r + 1,
        col: currentPeg.col + step,
      };

      if (currentPeg.row < GAME_CONFIG.ROWS) {
        visitedPegs.push({ ...currentPeg });
        if (this.isBumperPeg(currentPeg)) {
          bumperHits.push({ ...currentPeg });
        }
      }
    }

    const slotIndex = currentPeg.col;

    return {
      steps,
      visitedPegs,
      bumperHits,
      slotIndex,
    };
  }

  static isBumperPeg(peg) {
    return GAME_CONFIG.BUMPER_PEGS.some(
      (b) => b.row === peg.row && b.col === peg.col
    );
  }

  static processDrop(input) {
    const balls = [];
    let boardGrossPayoutCents = 0;
    let boardCreditedPayoutCents = 0;
    let spinPointsEarned = 0;
    let bumperHitsTotal = 0;
    let runningGrossWinCents = input.currentRoundGrossWinCents || 0;
    let payoutCapReached = runningGrossWinCents >= GAME_CONFIG.PAYOUT_CAP_CENTS;

    for (let i = 0; i < input.ballCount; i++) {
      const pathData = this.generateBallPath();
      const slot = GAME_CONFIG.SLOTS[pathData.slotIndex];
      bumperHitsTotal += pathData.bumperHits.length;

      let rawPayout = 0;
      let isSpin = false;

      if (slot.isSpin) {
        isSpin = true;
        if (!input.isBonusRound) {
          spinPointsEarned += GAME_CONFIG.SPIN_POINTS_PER_HIT;
        }
      } else {
        rawPayout = calculateSlotPayoutCents(input.betPerBallCents, slot.num, slot.den);
      }

      boardGrossPayoutCents += rawPayout;

      let creditedPayout = 0;
      if (payoutCapReached) {
        creditedPayout = 0;
      } else if (runningGrossWinCents + rawPayout >= GAME_CONFIG.PAYOUT_CAP_CENTS) {
        creditedPayout = Math.max(0, GAME_CONFIG.PAYOUT_CAP_CENTS - runningGrossWinCents);
        runningGrossWinCents = GAME_CONFIG.PAYOUT_CAP_CENTS;
        payoutCapReached = true;
      } else {
        creditedPayout = rawPayout;
        runningGrossWinCents += creditedPayout;
      }

      boardCreditedPayoutCents += creditedPayout;

      balls.push({
        index: i,
        steps: pathData.steps,
        visitedPegs: pathData.visitedPegs,
        bumperHits: pathData.bumperHits,
        slotIndex: pathData.slotIndex,
        slotLabel: slot.label,
        isSpin,
        rawPayoutCents: rawPayout,
        creditedPayoutCents: creditedPayout,
      });
    }

    return {
      balls,
      boardGrossPayoutCents,
      boardCreditedPayoutCents,
      payoutCapReached,
      spinPointsEarned,
      bumperHitsTotal,
      newRoundGrossWinCents: runningGrossWinCents,
    };
  }

  static spinWheel(betPerBallCents, currentRoundGrossWinCents) {
    const outcomes = GAME_CONFIG.WHEEL_OUTCOMES;
    const totalWeight = outcomes.reduce((acc, cur) => acc + cur.weight, 0);

    const rand = crypto.randomInt(0, totalWeight);
    let cumulative = 0;
    let selectedOutcome = outcomes[0];
    let selectedIndex = 0;

    for (let i = 0; i < outcomes.length; i++) {
      cumulative += outcomes[i].weight;
      if (rand < cumulative) {
        selectedOutcome = outcomes[i];
        selectedIndex = i;
        break;
      }
    }

    let startDeg = 0;
    for (let i = 0; i < selectedIndex; i++) {
      startDeg += (outcomes[i].weight / totalWeight) * 360;
    }
    const wedgeSpan = (selectedOutcome.weight / totalWeight) * 360;
    const angleTargetDegrees = startDeg + wedgeSpan / 2;

    let rawPayoutCents = 0;
    if (!selectedOutcome.isBonus) {
      rawPayoutCents = calculateSlotPayoutCents(
        betPerBallCents,
        selectedOutcome.num,
        selectedOutcome.den
      );
    }

    let creditedPayoutCents = 0;
    let payoutCapReached = currentRoundGrossWinCents >= GAME_CONFIG.PAYOUT_CAP_CENTS;
    let newRoundGrossWinCents = currentRoundGrossWinCents;

    if (payoutCapReached) {
      creditedPayoutCents = 0;
    } else if (currentRoundGrossWinCents + rawPayoutCents >= GAME_CONFIG.PAYOUT_CAP_CENTS) {
      creditedPayoutCents = Math.max(0, GAME_CONFIG.PAYOUT_CAP_CENTS - currentRoundGrossWinCents);
      newRoundGrossWinCents = GAME_CONFIG.PAYOUT_CAP_CENTS;
      payoutCapReached = true;
    } else {
      creditedPayoutCents = rawPayoutCents;
      newRoundGrossWinCents += creditedPayoutCents;
    }

    return {
      outcome: selectedOutcome,
      rawPayoutCents,
      creditedPayoutCents,
      payoutCapReached,
      newRoundGrossWinCents,
      angleTargetDegrees,
    };
  }
}
