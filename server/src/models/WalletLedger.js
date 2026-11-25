import mongoose, { Schema } from 'mongoose';

const WalletLedgerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roundId: { type: String, index: true },
    featureId: { type: String },
    type: {
      type: String,
      required: true,
      enum: ['INITIAL', 'BET', 'WIN_BOARD', 'WIN_WHEEL', 'WIN_BONUS', 'REFILL'],
    },
    amountCents: { type: Number, required: true },
    balanceAfterCents: { type: Number, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const WalletLedger = mongoose.model('WalletLedger', WalletLedgerSchema);
