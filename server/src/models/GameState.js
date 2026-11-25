import mongoose, { Schema } from 'mongoose';

const GameStateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    spinPoints: { type: Number, default: 0, min: 0 },
    energyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const GameState = mongoose.model('GameState', GameStateSchema);
