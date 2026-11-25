import { Wallet } from '../models/Wallet.js';
import { WalletLedger } from '../models/WalletLedger.js';
import { PendingFeature } from '../models/PendingFeature.js';
import { ActiveBonus } from '../models/ActiveBonus.js';
import { GAME_CONFIG } from '@temple-drop/shared';

export class WalletService {
  static async getWallet(userId, session) {
    let wallet = await Wallet.findOne({ userId }).session(session || null);
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        version: 0,
      });
      await wallet.save({ session });

      const ledger = new WalletLedger({
        userId,
        type: 'INITIAL',
        amountCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        balanceAfterCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        description: 'Welcome initial demo credits',
      });
      await ledger.save({ session });
    }
    return wallet;
  }

  static async debitBet(userId, betCents, roundId, session) {
    if (betCents <= 0) {
      throw new Error('Bet amount must be greater than zero');
    }

    const wallet = await this.getWallet(userId, session);

    if (wallet.balanceCents < betCents) {
      throw new Error('Insufficient credits for this bet');
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        userId,
        balanceCents: { $gte: betCents },
        version: wallet.version,
      },
      {
        $inc: { balanceCents: -betCents, version: 1 },
      },
      { new: true, session: session || null }
    );

    if (!updatedWallet) {
      throw new Error('Concurrent wallet update detected. Please try again.');
    }

    const ledger = new WalletLedger({
      userId,
      roundId,
      type: 'BET',
      amountCents: -betCents,
      balanceAfterCents: updatedWallet.balanceCents,
      description: `Placed bet of ${betCents / 100} credits on round ${roundId}`,
    });
    await ledger.save({ session });

    return updatedWallet;
  }

  static async creditWin(userId, winCents, type, roundId, description, session) {
    if (winCents < 0) {
      throw new Error('Win amount cannot be negative');
    }

    const wallet = await this.getWallet(userId, session);

    if (winCents === 0) {
      return wallet;
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId, version: wallet.version },
      {
        $inc: { balanceCents: winCents, version: 1 },
      },
      { new: true, session: session || null }
    );

    if (!updatedWallet) {
      throw new Error('Concurrent wallet update detected during payout');
    }

    const ledger = new WalletLedger({
      userId,
      roundId,
      type,
      amountCents: winCents,
      balanceAfterCents: updatedWallet.balanceCents,
      description,
    });
    await ledger.save({ session });

    return updatedWallet;
  }

  static async refillIfEligible(userId, session) {
    const wallet = await this.getWallet(userId, session);

    if (wallet.balanceCents >= GAME_CONFIG.MIN_BET_CENTS) {
      throw new Error(
        `Wallet has ${wallet.balanceCents / 100} credits. Refill only available below ${
          GAME_CONFIG.MIN_BET_CENTS / 100
        } credits.`
      );
    }

    const pendingFeaturesCount = await PendingFeature.countDocuments({
      userId,
      status: { $in: ['PENDING', 'ACTIVE'] },
    }).session(session || null);

    if (pendingFeaturesCount > 0) {
      throw new Error('Cannot refill while bonus rounds or free wheel spins are pending.');
    }

    const activeBonus = await ActiveBonus.findOne({
      userId,
      isCompleted: false,
    }).session(session || null);

    if (activeBonus) {
      throw new Error('Cannot refill while an active bonus game is in progress.');
    }

    const refillAmountCents = GAME_CONFIG.INITIAL_BALANCE_CENTS - wallet.balanceCents;

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId, version: wallet.version },
      {
        $set: { balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS },
        $inc: { version: 1 },
      },
      { new: true, session: session || null }
    );

    if (!updatedWallet) {
      throw new Error('Concurrent wallet update detected during refill');
    }

    const ledger = new WalletLedger({
      userId,
      type: 'REFILL',
      amountCents: refillAmountCents,
      balanceAfterCents: updatedWallet.balanceCents,
      description: `Free demo refill: credited ${refillAmountCents / 100} credits`,
    });
    await ledger.save({ session });

    return updatedWallet;
  }
}
