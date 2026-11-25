import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { csrfProtection } from '../middleware/csrf.js';
import { gameplayRateLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { WalletService } from '../services/walletService.js';
import { GameEngine } from '../services/gameEngine.js';
import { FeatureQueueService } from '../services/featureQueueService.js';
import { Round } from '../models/Round.js';
import { PendingFeature } from '../models/PendingFeature.js';
import { GAME_CONFIG } from '@temple-drop/shared';

const router = Router();

router.get('/config', (req, res) => {
  res.json({
    config: GAME_CONFIG,
    mathDocumentation: {
      rtpProfile: 'Arcade Demo Payout Profile',
      boardRows: 14,
      landingSlots: 15,
      expectedBaseRtpPercentage: 86.4,
      expectedWheelContributionPercentage: 5.8,
      expectedBonusContributionPercentage: 6.2,
      totalExpectedRtpPercentage: 98.4,
      disclaimer:
        'All credits are virtual arcade demo tokens with zero cash value. Outlays, multipliers, and probabilities are tuned for entertainment.',
      sharedPayoutCapCredits: GAME_CONFIG.PAYOUT_CAP_CENTS / 100,
      maxBonusBallsPerSession: GAME_CONFIG.BONUS_MAX_TOTAL_BALLS,
    },
  });
});

router.get('/state', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    await FeatureQueueService.ensureActiveFeature(user._id);
    const wallet = await WalletService.getWallet(user._id);
    const gameState = await FeatureQueueService.getGameState(user._id);
    const pendingFeatures = await FeatureQueueService.getPendingFeatures(user._id);
    const activeBonus = await FeatureQueueService.getActiveBonus(user._id);

    const lastRoundDoc = await Round.findOne({ userId: user._id, type: 'PAID' }).sort({
      createdAt: -1,
    });

    let lastRound = null;
    if (lastRoundDoc) {
      lastRound = {
        roundId: lastRoundDoc.roundId,
        type: 'PAID',
        betPerBallCents: lastRoundDoc.betPerBallCents,
        ballCount: lastRoundDoc.ballCount,
        totalBetCents: lastRoundDoc.totalBetCents,
        balls: lastRoundDoc.balls,
        grossPayoutCents: lastRoundDoc.boardPayoutCents,
        netPayoutCents: lastRoundDoc.netPayoutCents,
        payoutCapReached: lastRoundDoc.payoutCapReached,
        walletBalanceCents: wallet.balanceCents,
        spinPoints: gameState.spinPoints,
        energyPoints: gameState.energyPoints,
        pendingFeatures: pendingFeatures.map(FeatureQueueService.formatFeatureDTO),
        activeBonus: activeBonus ? FeatureQueueService.formatActiveBonusDTO(activeBonus) : null,
        serverTime: lastRoundDoc.createdAt.toISOString(),
      };
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isGuest: user.isGuest,
        avatarId: user.avatarId,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
      },
      wallet: {
        balanceCents: wallet.balanceCents,
        initialCents: wallet.initialCents,
        version: wallet.version,
      },
      spinPoints: gameState.spinPoints,
      energyPoints: gameState.energyPoints,
      pendingFeatures: pendingFeatures.map(FeatureQueueService.formatFeatureDTO),
      activeBonus: activeBonus ? FeatureQueueService.formatActiveBonusDTO(activeBonus) : null,
      lastRound,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/drop',
  requireAuth,
  csrfProtection,
  gameplayRateLimiter,
  idempotencyMiddleware('drop'),
  async (req, res, next) => {
    try {
      const user = req.user;
      const { betPerBallCents, ballCount } = req.body;

      if (!GAME_CONFIG.BET_PER_BALL_OPTIONS_CENTS.includes(betPerBallCents)) {
        res.status(400).json({
          error: `Invalid bet per ball. Must be one of: ${GAME_CONFIG.BET_PER_BALL_OPTIONS_CENTS.map(
            (c) => c / 100
          ).join(', ')} credits`,
        });
        return;
      }

      if (!GAME_CONFIG.BALLS_PER_DROP_OPTIONS.includes(ballCount)) {
        res.status(400).json({
          error: `Invalid ball count. Must be one of: ${GAME_CONFIG.BALLS_PER_DROP_OPTIONS.join(', ')}`,
        });
        return;
      }

      const totalBetCents = betPerBallCents * ballCount;
      if (
        totalBetCents < GAME_CONFIG.MIN_BET_CENTS ||
        totalBetCents > GAME_CONFIG.MAX_TOTAL_BET_CENTS
      ) {
        res.status(400).json({
          error: `Total bet must be between ${GAME_CONFIG.MIN_BET_CENTS / 100} and ${
            GAME_CONFIG.MAX_TOTAL_BET_CENTS / 100
          } credits`,
        });
        return;
      }

      const pendingCount = await PendingFeature.countDocuments({
        userId: user._id,
        status: { $in: ['PENDING', 'ACTIVE'] },
      });
      if (pendingCount > 0) {
        res.status(400).json({
          error: 'Please resolve active bonus game or pending wheel spins before dropping again.',
        });
        return;
      }

      const activeBonus = await FeatureQueueService.getActiveBonus(user._id);
      if (activeBonus) {
        res.status(400).json({
          error: 'An active bonus game is in progress. Please complete all bonus balls first.',
        });
        return;
      }

      const roundId = `round_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      await WalletService.debitBet(user._id, totalBetCents, roundId);

      const dropResult = GameEngine.processDrop({
        betPerBallCents,
        ballCount,
        currentRoundGrossWinCents: 0,
        isBonusRound: false,
      });

      let updatedWallet = await WalletService.getWallet(user._id);
      if (dropResult.boardCreditedPayoutCents > 0) {
        updatedWallet = await WalletService.creditWin(
          user._id,
          dropResult.boardCreditedPayoutCents,
          'WIN_BOARD',
          roundId,
          `Round ${roundId}: Landed board payout of ${
            dropResult.boardCreditedPayoutCents / 100
          } credits`
        );
      }

      const featureResult = await FeatureQueueService.processPaidDropFeatures(
        user._id,
        roundId,
        betPerBallCents,
        dropResult.spinPointsEarned,
        dropResult.bumperHitsTotal
      );

      const roundDoc = new Round({
        roundId,
        userId: user._id,
        type: 'PAID',
        originRoundId: roundId,
        betPerBallCents,
        ballCount,
        totalBetCents,
        balls: dropResult.balls,
        boardPayoutCents: dropResult.boardCreditedPayoutCents,
        wheelPayoutCents: 0,
        bonusPayoutCents: 0,
        totalGrossPayoutCents: dropResult.boardCreditedPayoutCents,
        netPayoutCents: dropResult.boardCreditedPayoutCents - totalBetCents,
        payoutCapReached: dropResult.payoutCapReached,
        spinPointsEarned: dropResult.spinPointsEarned,
        energyEarned: dropResult.bumperHitsTotal * GAME_CONFIG.ENERGY_PER_BUMPER_HIT,
      });
      await roundDoc.save();

      const pendingFeatures = await FeatureQueueService.getPendingFeatures(user._id);
      const latestActiveBonus = await FeatureQueueService.getActiveBonus(user._id);

      res.json({
        roundId,
        type: 'PAID',
        betPerBallCents,
        ballCount,
        totalBetCents,
        balls: dropResult.balls,
        grossPayoutCents: dropResult.boardCreditedPayoutCents,
        netPayoutCents: dropResult.boardCreditedPayoutCents - totalBetCents,
        payoutCapReached: dropResult.payoutCapReached,
        walletBalanceCents: updatedWallet.balanceCents,
        spinPoints: featureResult.spinPoints,
        energyPoints: featureResult.energyPoints,
        pendingFeatures: pendingFeatures.map(FeatureQueueService.formatFeatureDTO),
        activeBonus: latestActiveBonus
          ? FeatureQueueService.formatActiveBonusDTO(latestActiveBonus)
          : null,
        serverTime: roundDoc.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/spin',
  requireAuth,
  csrfProtection,
  gameplayRateLimiter,
  idempotencyMiddleware('spin'),
  async (req, res, next) => {
    try {
      const user = req.user;

      const activeBonus = await FeatureQueueService.getActiveBonus(user._id);
      if (activeBonus) {
        res.status(400).json({
          error: 'An active bonus game is in progress. Please complete the bonus round first.',
        });
        return;
      }

      const pendingList = await FeatureQueueService.getPendingFeatures(user._id);
      if (pendingList.length === 0 || pendingList[0].type !== 'WHEEL_SPIN') {
        res.status(400).json({
          error: 'No pending wheel spin available. Earn 10 spin points to spin the wheel.',
        });
        return;
      }

      const feature = pendingList[0];
      const originRound = await Round.findOne({ roundId: feature.roundId, userId: user._id });
      const currentGross = originRound ? originRound.totalGrossPayoutCents : 0;

      const wheelResult = GameEngine.spinWheel(feature.betPerBallCents, currentGross);
      let updatedWallet = await WalletService.getWallet(user._id);

      if (wheelResult.outcome.isBonus) {
        await FeatureQueueService.queueBonusFromWheel(
          user._id,
          feature.roundId,
          feature.betPerBallCents
        );
      } else if (wheelResult.creditedPayoutCents > 0) {
        updatedWallet = await WalletService.creditWin(
          user._id,
          wheelResult.creditedPayoutCents,
          'WIN_WHEEL',
          feature.roundId,
          `Wheel Spin: Landed ${wheelResult.outcome.label} win of ${
            wheelResult.creditedPayoutCents / 100
          } credits`
        );
      }

      if (originRound) {
        originRound.wheelPayoutCents += wheelResult.creditedPayoutCents;
        originRound.totalGrossPayoutCents += wheelResult.creditedPayoutCents;
        originRound.netPayoutCents += wheelResult.creditedPayoutCents;
        if (wheelResult.payoutCapReached) {
          originRound.payoutCapReached = true;
        }
        await originRound.save();
      }

      feature.status = 'RESOLVED';
      feature.resolvedAt = new Date();
      await feature.save();

      await FeatureQueueService.ensureActiveFeature(user._id);

      const remainingFeatures = await FeatureQueueService.getPendingFeatures(user._id);
      const nextActiveBonus = await FeatureQueueService.getActiveBonus(user._id);

      res.json({
        featureId: feature._id.toString(),
        originRoundId: feature.roundId,
        outcome: wheelResult.outcome,
        angleTargetDegrees: wheelResult.angleTargetDegrees,
        grossPayoutCents: wheelResult.creditedPayoutCents,
        payoutCapReached: wheelResult.payoutCapReached,
        walletBalanceCents: updatedWallet.balanceCents,
        pendingFeatures: remainingFeatures.map(FeatureQueueService.formatFeatureDTO),
        activeBonus: nextActiveBonus
          ? FeatureQueueService.formatActiveBonusDTO(nextActiveBonus)
          : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/bonus/drop',
  requireAuth,
  csrfProtection,
  gameplayRateLimiter,
  idempotencyMiddleware('bonus_drop'),
  async (req, res, next) => {
    try {
      const user = req.user;

      const activeBonus = await FeatureQueueService.getActiveBonus(user._id);
      if (!activeBonus || activeBonus.isCompleted || activeBonus.remainingBalls <= 0) {
        res.status(400).json({ error: 'No active bonus round currently in progress.' });
        return;
      }

      const originRound = await Round.findOne({
        roundId: activeBonus.originRoundId,
        userId: user._id,
      });
      const currentGross = originRound ? originRound.totalGrossPayoutCents : activeBonus.accumulatedWinCents;

      const dropResult = GameEngine.processDrop({
        betPerBallCents: activeBonus.betPerBallCents,
        ballCount: 1,
        currentRoundGrossWinCents: currentGross,
        isBonusRound: true,
      });

      const ballOutcome = dropResult.balls[0];

      const bumperHits = dropResult.bumperHitsTotal;
      const energyGained = bumperHits * GAME_CONFIG.ENERGY_PER_BUMPER_HIT;
      const newBonusEnergyTotal = activeBonus.bonusEnergy + energyGained;

      const earnedGrants = Math.floor(newBonusEnergyTotal / 100);
      const remainingBonusEnergy = newBonusEnergyTotal % 100;
      const additionalBallsDesired = earnedGrants * GAME_CONFIG.BONUS_RETRIGGER_BALLS;
      const ballsAvailableBeforeCap = Math.max(
        0,
        GAME_CONFIG.BONUS_MAX_TOTAL_BALLS - activeBonus.totalBallsGranted
      );
      const actualAdditionalBalls = Math.min(additionalBallsDesired, ballsAvailableBeforeCap);

      activeBonus.totalBallsGranted += actualAdditionalBalls;
      activeBonus.remainingBalls += actualAdditionalBalls;
      activeBonus.bonusEnergy = remainingBonusEnergy;

      activeBonus.remainingBalls -= 1;
      activeBonus.ballsPlayed += 1;

      let updatedWallet = await WalletService.getWallet(user._id);
      if (dropResult.boardCreditedPayoutCents > 0) {
        updatedWallet = await WalletService.creditWin(
          user._id,
          dropResult.boardCreditedPayoutCents,
          'WIN_BONUS',
          activeBonus.originRoundId,
          `Bonus Round: Landed ${ballOutcome.slotLabel} payout of ${
            dropResult.boardCreditedPayoutCents / 100
          } credits`
        );
      }

      activeBonus.accumulatedWinCents += dropResult.boardCreditedPayoutCents;

      if (originRound) {
        originRound.bonusPayoutCents += dropResult.boardCreditedPayoutCents;
        originRound.totalGrossPayoutCents += dropResult.boardCreditedPayoutCents;
        originRound.netPayoutCents += dropResult.boardCreditedPayoutCents;
        if (dropResult.payoutCapReached) {
          originRound.payoutCapReached = true;
        }
        await originRound.save();
      }

      const isCompleted = activeBonus.remainingBalls <= 0;
      if (isCompleted) {
        activeBonus.isCompleted = true;
        activeBonus.bonusEnergy = 0;

        await PendingFeature.updateOne(
          { _id: activeBonus.featureId },
          { $set: { status: 'RESOLVED', resolvedAt: new Date() } }
        );

        await FeatureQueueService.ensureActiveFeature(user._id);
      }

      await activeBonus.save();

      const remainingPending = await FeatureQueueService.getPendingFeatures(user._id);
      const nextActiveBonus = isCompleted ? null : activeBonus;

      res.json({
        bonusSessionId: activeBonus._id.toString(),
        originRoundId: activeBonus.originRoundId,
        betPerBallCents: activeBonus.betPerBallCents,
        ball: ballOutcome,
        additionalBallsGranted: actualAdditionalBalls,
        remainingBalls: activeBonus.remainingBalls,
        totalBallsGranted: activeBonus.totalBallsGranted,
        bonusEnergy: activeBonus.bonusEnergy,
        accumulatedWinCents: activeBonus.accumulatedWinCents,
        isCompleted,
        grossPayoutCents: dropResult.boardCreditedPayoutCents,
        payoutCapReached: dropResult.payoutCapReached,
        walletBalanceCents: updatedWallet.balanceCents,
        pendingFeatures: remainingPending.map(FeatureQueueService.formatFeatureDTO),
        activeBonus: nextActiveBonus
          ? FeatureQueueService.formatActiveBonusDTO(nextActiveBonus)
          : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/wallet/refill', requireAuth, csrfProtection, async (req, res, next) => {
  try {
    const user = req.user;
    const updatedWallet = await WalletService.refillIfEligible(user._id);

    res.json({
      message: 'Wallet successfully refilled with 10,000 demo credits!',
      wallet: {
        balanceCents: updatedWallet.balanceCents,
        initialCents: updatedWallet.initialCents,
        version: updatedWallet.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalRounds = await Round.countDocuments({ userId: user._id, type: 'PAID' });
    const rounds = await Round.find({ userId: user._id, type: 'PAID' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const items = rounds.map((r) => {
      const slotCounts = {};
      for (const ball of r.balls) {
        slotCounts[ball.slotIndex] = (slotCounts[ball.slotIndex] || 0) + 1;
      }

      return {
        roundId: r.roundId,
        timestamp: r.createdAt.toISOString(),
        type: 'PAID',
        ballCount: r.ballCount,
        betPerBallCents: r.betPerBallCents,
        totalBetCents: r.totalBetCents,
        slotCounts,
        boardPayoutCents: r.boardPayoutCents,
        wheelPayoutCents: r.wheelPayoutCents,
        bonusPayoutCents: r.bonusPayoutCents,
        totalGrossPayoutCents: r.totalGrossPayoutCents,
        netChangeCents: r.netPayoutCents,
        payoutCapReached: r.payoutCapReached,
        balls: r.balls,
      };
    });

    res.json({
      items,
      page,
      limit,
      totalRounds,
      totalPages: Math.ceil(totalRounds / limit),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history/:roundId', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const round = await Round.findOne({ roundId: req.params.roundId, userId: user._id });
    if (!round) {
      res.status(404).json({ error: 'Round not found' });
      return;
    }

    res.json({ round });
  } catch (err) {
    next(err);
  }
});

export default router;
