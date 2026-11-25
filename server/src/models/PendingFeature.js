import mongoose, { Schema } from 'mongoose';

const PendingFeatureSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roundId: { type: String, required: true, index: true },
    type: { type: String, enum: ['WHEEL_SPIN', 'BONUS'], required: true },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'RESOLVED'], default: 'PENDING', index: true },
    betPerBallCents: { type: Number, required: true },
    order: { type: Number, default: 0, index: true },
    metadata: { type: Schema.Types.Mixed },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const PendingFeature = mongoose.model('PendingFeature', PendingFeatureSchema);
