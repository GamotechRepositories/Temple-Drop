import mongoose, { Schema } from 'mongoose';

const PegCoordinateSchema = new Schema(
  {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
  },
  { _id: false }
);

const BallOutcomeSchema = new Schema(
  {
    index: { type: Number, required: true },
    steps: [{ type: Number, required: true }],
    visitedPegs: [PegCoordinateSchema],
    bumperHits: [PegCoordinateSchema],
    slotIndex: { type: Number, required: true },
    slotLabel: { type: String, required: true },
    isSpin: { type: Boolean, required: true },
    rawPayoutCents: { type: Number, required: true },
    creditedPayoutCents: { type: Number, required: true },
  },
  { _id: false }
);

const RoundSchema = new Schema(
  {
    roundId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['PAID', 'BONUS_BALL'], required: true },
    originRoundId: { type: String, required: true, index: true },
    betPerBallCents: { type: Number, required: true },
    ballCount: { type: Number, required: true },
    totalBetCents: { type: Number, required: true },
    balls: [BallOutcomeSchema],
    boardPayoutCents: { type: Number, default: 0 },
    wheelPayoutCents: { type: Number, default: 0 },
    bonusPayoutCents: { type: Number, default: 0 },
    totalGrossPayoutCents: { type: Number, default: 0 },
    netPayoutCents: { type: Number, default: 0 },
    payoutCapReached: { type: Boolean, default: false },
    spinPointsEarned: { type: Number, default: 0 },
    energyEarned: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Round = mongoose.model('Round', RoundSchema);
