import mongoose, { Schema } from 'mongoose';

const IdempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    requestHash: { type: String, required: true },
    responseBody: { type: Schema.Types.Mixed },
    statusCode: { type: Number },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

IdempotencyKeySchema.index({ userId: 1, action: 1, key: 1 }, { unique: true });
IdempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const IdempotencyKey = mongoose.model('IdempotencyKey', IdempotencyKeySchema);
