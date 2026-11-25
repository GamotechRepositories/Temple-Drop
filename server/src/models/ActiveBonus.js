import mongoose, { Schema } from 'mongoose';

const ActiveBonusSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    featureId: { type: Schema.Types.ObjectId, ref: 'PendingFeature', required: true },
    originRoundId: { type: String, required: true, index: true },
    betPerBallCents: { type: Number, required: true },
    remainingBalls: { type: Number, required: true, default: 5 },
    totalBallsGranted: { type: Number, required: true, default: 5 },
    bonusEnergy: { type: Number, required: true, default: 0 },
    accumulatedWinCents: { type: Number, required: true, default: 0 },
    ballsPlayed: { type: Number, required: true, default: 0 },
    isCompleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const ActiveBonus = mongoose.model('ActiveBonus', ActiveBonusSchema);
