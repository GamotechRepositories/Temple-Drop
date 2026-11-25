import mongoose, { Schema } from 'mongoose';
import { GAME_CONFIG } from '@temple-drop/shared';

const WalletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balanceCents: { type: Number, required: true, default: GAME_CONFIG.INITIAL_BALANCE_CENTS, min: 0 },
    initialCents: { type: Number, required: true, default: GAME_CONFIG.INITIAL_BALANCE_CENTS },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model('Wallet', WalletSchema);
