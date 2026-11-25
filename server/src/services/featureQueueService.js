import { GameState } from '../models/GameState.js';
import { PendingFeature } from '../models/PendingFeature.js';
import { ActiveBonus } from '../models/ActiveBonus.js';
import { GAME_CONFIG } from '@temple-drop/shared';

export class FeatureQueueService {
  static async getGameState(userId, session) {
    let state = await GameState.findOne({ userId }).session(session || null);
    if (!state) {
      state = new GameState({
        userId,
        spinPoints: 0,
        energyPoints: 0,
      });
      await state.save({ session });
    }
    return state;
  }

  static async getActiveBonus(userId, session) {
    return ActiveBonus.findOne({
      userId,
      isCompleted: false,
    }).session(session || null);
  }

  static async getPendingFeatures(userId, session) {
    return PendingFeature.find({
      userId,
      status: { $in: ['PENDING', 'ACTIVE'] },
    })
      .sort({ order: 1, createdAt: 1 })
      .session(session || null);
  }

  static async getNextOrderNumber(userId, session) {
    const highest = await PendingFeature.findOne({ userId })
      .sort({ order: -1 })
      .session(session || null);
    return highest ? highest.order + 1 : 1;
  }

  static async processPaidDropFeatures(
    userId,
    roundId,
    betPerBallCents,
    spinPointsGained,
    bumperHitsGained,
    session
  ) {
    const state = await this.getGameState(userId, session);

    const totalSpin = state.spinPoints + spinPointsGained;
    const earnedSpins = Math.floor(totalSpin / GAME_CONFIG.SPIN_POINTS_THRESHOLD);
    const remainingSpin = totalSpin % GAME_CONFIG.SPIN_POINTS_THRESHOLD;

    const energyGained = bumperHitsGained * GAME_CONFIG.ENERGY_PER_BUMPER_HIT;
    const totalEnergy = state.energyPoints + energyGained;
    const earnedBonuses = Math.floor(totalEnergy / GAME_CONFIG.ENERGY_THRESHOLD_FOR_BONUS);
    const remainingEnergy = totalEnergy % GAME_CONFIG.ENERGY_THRESHOLD_FOR_BONUS;

    state.spinPoints = remainingSpin;
    state.energyPoints = remainingEnergy;
    await state.save({ session });

    let currentOrder = await this.getNextOrderNumber(userId, session);

    // Queue bonus BEFORE wheel spins
    for (let b = 0; b < earnedBonuses; b++) {
      const bonusFeature = new PendingFeature({
        userId,
        roundId,
        type: 'BONUS',
        status: 'PENDING',
        betPerBallCents,
        order: currentOrder++,
      });
      await bonusFeature.save({ session });
    }

    for (let s = 0; s < earnedSpins; s++) {
      const spinFeature = new PendingFeature({
        userId,
        roundId,
        type: 'WHEEL_SPIN',
        status: 'PENDING',
        betPerBallCents,
        order: currentOrder++,
      });
      await spinFeature.save({ session });
    }

    await this.ensureActiveFeature(userId, session);

    return {
      spinPoints: state.spinPoints,
      energyPoints: state.energyPoints,
      queuedBonusesCount: earnedBonuses,
      queuedSpinsCount: earnedSpins,
    };
  }

  static async ensureActiveFeature(userId, session) {
    let activeBonus = await this.getActiveBonus(userId, session);
    if (activeBonus) {
      return { activeBonus, headFeature: null };
    }

    const pendingList = await this.getPendingFeatures(userId, session);
    if (pendingList.length === 0) {
      return { activeBonus: null, headFeature: null };
    }

    const headFeature = pendingList[0];

    if (headFeature.type === 'BONUS' && headFeature.status === 'PENDING') {
      headFeature.status = 'ACTIVE';
      await headFeature.save({ session });

      activeBonus = new ActiveBonus({
        userId,
        featureId: headFeature._id,
        originRoundId: headFeature.roundId,
        betPerBallCents: headFeature.betPerBallCents,
        remainingBalls: GAME_CONFIG.BONUS_INITIAL_BALLS,
        totalBallsGranted: GAME_CONFIG.BONUS_INITIAL_BALLS,
        bonusEnergy: 0,
        accumulatedWinCents: 0,
        ballsPlayed: 0,
        isCompleted: false,
      });
      await activeBonus.save({ session });
    }

    return { activeBonus, headFeature };
  }

  static async queueBonusFromWheel(userId, roundId, betPerBallCents, session) {
    const nextOrder = await this.getNextOrderNumber(userId, session);
    const feature = new PendingFeature({
      userId,
      roundId,
      type: 'BONUS',
      status: 'PENDING',
      betPerBallCents,
      order: nextOrder,
    });
    await feature.save({ session });

    await this.ensureActiveFeature(userId, session);
    return feature;
  }

  static formatFeatureDTO(f) {
    return {
      id: f._id.toString(),
      type: f.type,
      roundId: f.roundId,
      betPerBallCents: f.betPerBallCents,
      order: f.order,
      createdAt: f.createdAt.toISOString(),
    };
  }

  static formatActiveBonusDTO(b) {
    return {
      id: b._id.toString(),
      originRoundId: b.originRoundId,
      betPerBallCents: b.betPerBallCents,
      remainingBalls: b.remainingBalls,
      totalBallsGranted: b.totalBallsGranted,
      bonusEnergy: b.bonusEnergy,
      accumulatedWinCents: b.accumulatedWinCents,
      ballsPlayed: b.ballsPlayed,
    };
  }
}
